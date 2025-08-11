"""
Upwork Assistant Backend API
FastAPI server providing endpoints for job scraping, profile management, and job matching
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os
import asyncio
from datetime import datetime, timedelta
import sqlite3
import logging
import threading
import time

# Import local modules
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import *
from profile.github_scrapper import fetch_all_readmes


from scrapper.upwork_job_scrapper import manual_upwork_viewer


# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Upwork Assistant API",
    description="Backend API for Upwork job scraping and profile-based matching",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ProfileConfig(BaseModel):
    github_username: Optional[str] = None
    upwork_profile_url: Optional[str] = None
    skills: Optional[List[str]] = None
    rate_min: Optional[int] = 0
    rate_max: Optional[int] = 100
    score_threshold: float = DEFAULT_SCORE_THRESHOLD
    scrape_frequency: Optional[str] = "30min"

class JobFilter(BaseModel):
    show_above_threshold_only: bool = False
    sort_by: str = "time"  # "time" or "score"
    skills_filter: Optional[List[str]] = None

class ScrapingConfig(BaseModel):
    search_terms: Optional[List[str]] = None
    max_jobs: int = MAX_JOBS_PER_SCRAPE
    auto_scrape: bool = False

# Database setup
def init_database():
    """Initialize SQLite database with required tables"""
    os.makedirs(PROFILE_DATA_DIR, exist_ok=True)
    os.makedirs(SCRAPPER_DATA_DIR, exist_ok=True)
    
    db_path = "upwork_assistant.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Jobs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            score REAL DEFAULT 0.0,
            posted TEXT,
            url TEXT,
            budget TEXT,
            duration TEXT,
            experience_level TEXT,
            skills TEXT,  -- JSON array
            client_info TEXT,  -- JSON object
            proposals INTEGER DEFAULT 0,
            above_threshold BOOLEAN DEFAULT FALSE,
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE
        )
    """)
    
    # Profile table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY,
            github_username TEXT,
            upwork_profile_url TEXT,
            skills TEXT,  -- JSON array
            rate_min INTEGER,
            rate_max INTEGER,
            score_threshold REAL,
            scrape_frequency TEXT DEFAULT '30min',
            github_data TEXT,  -- JSON object
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Add scrape_frequency column if it doesn't exist (migration)
    try:
        cursor.execute("ALTER TABLE profile ADD COLUMN scrape_frequency TEXT DEFAULT '30min'")
        conn.commit()
    except sqlite3.OperationalError:
        # Column already exists
        pass
    
    # Scraping logs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scraping_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            status TEXT,
            jobs_found INTEGER DEFAULT 0,
            error_message TEXT,
            started_at TIMESTAMP,
            completed_at TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()

# Helper functions
def get_db_connection():
    """Get database connection"""
    return sqlite3.connect("upwork_assistant.db", check_same_thread=False)

def calculate_job_score(job_data: Dict, profile_skills: List[str]) -> float:
    """Calculate job relevance score based on profile skills"""
    job_skills = job_data.get('skills', [])
    if not job_skills or not profile_skills:
        return 0.0
    
    # Convert to lowercase for comparison
    job_skills_lower = [skill.lower() for skill in job_skills]
    profile_skills_lower = [skill.lower() for skill in profile_skills]
    
    # Calculate skill match percentage
    matches = sum(1 for skill in profile_skills_lower if skill in job_skills_lower)
    score = matches / len(profile_skills_lower) if profile_skills_lower else 0.0
    
    # Boost score for higher budget jobs
    budget = job_data.get('budget', '')
    if '$50' in budget or '$60' in budget or '$70' in budget:
        score += 0.1
    elif '$30' in budget or '$40' in budget:
        score += 0.05
    
    return min(score, 1.0)  # Cap at 1.0

# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Upwork Assistant API is running", "version": "1.0.0"}

@app.get("/api/jobs")
async def get_jobs(
    show_above_threshold_only: bool = False,
    sort_by: str = "time",
    limit: int = 50
):
    """Get jobs from database with filtering and sorting"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get current profile to determine threshold
        cursor.execute("SELECT score_threshold FROM profile ORDER BY updated_at DESC LIMIT 1")
        profile_result = cursor.fetchone()
        threshold = profile_result[0] if profile_result else DEFAULT_SCORE_THRESHOLD
        
        # Build query
        where_clause = ""
        if show_above_threshold_only:
            where_clause = f"WHERE score >= {threshold} AND is_active = 1"
        else:
            where_clause = "WHERE is_active = 1"
        
        order_clause = "ORDER BY scraped_at DESC"
        if sort_by == "score":
            order_clause = "ORDER BY score DESC, scraped_at DESC"
        
        query = f"""
            SELECT id, title, description, score, posted, url, budget, duration, 
                   experience_level, skills, client_info, proposals, above_threshold
            FROM jobs 
            {where_clause} 
            {order_clause} 
            LIMIT {limit}
        """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        jobs = []
        for row in rows:
            job = {
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "score": row[3],
                "posted": row[4],
                "url": row[5],
                "budget": row[6],
                "duration": row[7],
                "experienceLevel": row[8],
                "skills": json.loads(row[9]) if row[9] else [],
                "client": json.loads(row[10]) if row[10] else {},
                "proposals": row[11],
                "aboveThreshold": bool(row[12])
            }
            jobs.append(job)
        
        return {"jobs": jobs}
    
    except Exception as e:
        logger.error(f"Error fetching jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/profile")
async def get_profile():
    """Get current profile configuration"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT github_username, upwork_profile_url, skills, rate_min, rate_max, 
                   score_threshold, scrape_frequency, github_data 
            FROM profile 
            ORDER BY updated_at DESC 
            LIMIT 1
        """)
        row = cursor.fetchone()
        
        if row:
            return {
                "github_username": row[0],
                "upwork_profile_url": row[1],
                "skills": json.loads(row[2]) if row[2] else DEFAULT_SKILLS,
                "rate_min": row[3] or DEFAULT_RATE_MIN,
                "rate_max": row[4] or DEFAULT_RATE_MAX,
                "score_threshold": row[5] or DEFAULT_SCORE_THRESHOLD,
                "scrape_frequency": row[6] or "30min",
                "github_data": json.loads(row[7]) if row[7] else None
            }
        else:
            # Return default profile
            return {
                "github_username": None,
                "upwork_profile_url": None,
                "skills": DEFAULT_SKILLS,
                "rate_min": DEFAULT_RATE_MIN,
                "rate_max": DEFAULT_RATE_MAX,
                "score_threshold": DEFAULT_SCORE_THRESHOLD,
                "scrape_frequency": "30min",
                "github_data": None
            }
    
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/profile")
async def update_profile(profile: ProfileConfig, background_tasks: BackgroundTasks):
    """Update profile configuration"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # If GitHub username provided, schedule GitHub data fetch
        github_data = None
        if profile.github_username:
            background_tasks.add_task(fetch_github_data, profile.github_username)
        
        # Insert or update profile
        cursor.execute("""
            INSERT OR REPLACE INTO profile 
            (id, github_username, upwork_profile_url, skills, rate_min, rate_max, 
             score_threshold, scrape_frequency, github_data, updated_at)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (
            profile.github_username,
            profile.upwork_profile_url,
            json.dumps(profile.skills),
            profile.rate_min,
            profile.rate_max,
            profile.score_threshold,
            profile.scrape_frequency,
            json.dumps(github_data) if github_data else None
        ))
        
        conn.commit()
        
        # Recalculate job scores with new skills
        background_tasks.add_task(recalculate_job_scores, profile.skills)
        
        return {"message": "Profile updated successfully"}
    
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/scrape/start")
async def start_scraping(config: ScrapingConfig, background_tasks: BackgroundTasks):
    """Start job scraping process"""
    try:
        background_tasks.add_task(scrape_jobs_background, config)
        return {"message": "Scraping started", "status": "in_progress"}
    except Exception as e:
        logger.error(f"Error starting scraping: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scrape/status")
async def get_scraping_status():
    """Get latest scraping status"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT status, jobs_found, error_message, started_at, completed_at
            FROM scraping_logs 
            ORDER BY started_at DESC 
            LIMIT 1
        """)
        row = cursor.fetchone()
        
        if row:
            return {
                "status": row[0],
                "jobs_found": row[1],
                "error_message": row[2],
                "started_at": row[3],
                "completed_at": row[4]
            }
        else:
            return {"status": "never_run"}
    
    except Exception as e:
        logger.error(f"Error fetching scraping status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/stats")
async def get_stats():
    """Get dashboard statistics"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get total jobs
        cursor.execute("SELECT COUNT(*) FROM jobs WHERE is_active = 1")
        total_jobs = cursor.fetchone()[0]
        
        # Get profile threshold
        cursor.execute("SELECT score_threshold FROM profile ORDER BY updated_at DESC LIMIT 1")
        profile_result = cursor.fetchone()
        threshold = profile_result[0] if profile_result else DEFAULT_SCORE_THRESHOLD
        
        # Get above threshold count
        cursor.execute("SELECT COUNT(*) FROM jobs WHERE score >= ? AND is_active = 1", (threshold,))
        above_threshold = cursor.fetchone()[0]
        
        # Get average score
        cursor.execute("SELECT AVG(score) FROM jobs WHERE is_active = 1")
        avg_score_result = cursor.fetchone()[0]
        avg_score = avg_score_result if avg_score_result else 0.0
        
        # Get recent scraping activity
        cursor.execute("""
            SELECT COUNT(*) FROM jobs 
            WHERE scraped_at > datetime('now', '-24 hours') AND is_active = 1
        """)
        recent_jobs = cursor.fetchone()[0]
        
        return {
            "total_jobs": total_jobs,
            "above_threshold": above_threshold,
            "avg_score": round(avg_score, 2),
            "threshold": threshold,
            "recent_jobs_24h": recent_jobs
        }
    
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# Background tasks
async def fetch_github_data(username: str):
    """Background task to fetch GitHub repository data"""
    try:
        logger.info(f"Fetching GitHub data for user: {username}")
        readmes = fetch_all_readmes(username, token=GITHUB_TOKEN)

        logger.info(f"Fetched {len(readmes)}, {readmes} repositories for {username}")
        
        # Store GitHub data in profile
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE profile 
            SET github_data = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        """, (json.dumps(readmes),))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Successfully fetched {len(readmes)} repositories for {username}")
    
    except Exception as e:
        logger.error(f"Error fetching GitHub data for {username}: {e}")

async def recalculate_job_scores(skills: List[str]):
    """Background task to recalculate job scores with new skills"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all active jobs
        cursor.execute("""
            SELECT id, title, description, skills, budget
            FROM jobs 
            WHERE is_active = 1
        """)
        jobs = cursor.fetchall()
        
        # Recalculate scores
        for job in jobs:
            job_data = {
                'skills': json.loads(job[3]) if job[3] else [],
                'budget': job[4] or ''
            }
            
            new_score = calculate_job_score(job_data, skills)
            above_threshold = new_score >= DEFAULT_SCORE_THRESHOLD
            
            cursor.execute("""
                UPDATE jobs 
                SET score = ?, above_threshold = ?
                WHERE id = ?
            """, (new_score, above_threshold, job[0]))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Recalculated scores for {len(jobs)} jobs")
    
    except Exception as e:
        logger.error(f"Error recalculating job scores: {e}")

async def scrape_jobs_background(config: ScrapingConfig):
    """Background task to scrape jobs"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Log scraping start
    log_id = None
    try:
        cursor.execute("""
            INSERT INTO scraping_logs (status, started_at)
            VALUES ('in_progress', CURRENT_TIMESTAMP)
        """)
        log_id = cursor.lastrowid
        conn.commit()
        
        logger.info("Starting job scraping...")
        
        # Note: This is a placeholder implementation
        # The actual scraping would use the upwork_job_scrapper module
        # For now, we'll create some sample jobs
        
        # Get current profile skills for scoring
        cursor.execute("SELECT skills FROM profile ORDER BY updated_at DESC LIMIT 1")
        profile_result = cursor.fetchone()
        profile_skills = json.loads(profile_result[0]) if profile_result and profile_result[0] else DEFAULT_SKILLS
        
        # Simulate scraping by creating sample jobs (replace with actual scraper)
        sample_jobs = [
            {
                'id': f'job_{datetime.now().timestamp()}_{i}',
                'title': f'Sample Job {i}',
                'description': f'Sample job description {i}',
                'posted': '5 minutes ago',
                'url': f'https://upwork.com/job/{i}',
                'budget': '$30.00 - $60.00',
                'duration': '1 to 3 months',
                'experience_level': 'intermediate',
                'skills': ['Python', 'API', 'Automation'],
                'client': {
                    'rating': 4.8,
                    'location': 'United States',
                    'verified': True,
                    'total_spent': '$10K+',
                    'payment_verified': True
                },
                'proposals': 10
            }
            for i in range(min(config.max_jobs, 10))  # Limit sample jobs
        ]
        
        jobs_added = 0
        for job_data in sample_jobs:
            score = calculate_job_score(job_data, profile_skills)
            above_threshold = score >= DEFAULT_SCORE_THRESHOLD
            
            cursor.execute("""
                INSERT OR REPLACE INTO jobs 
                (id, title, description, score, posted, url, budget, duration, 
                 experience_level, skills, client_info, proposals, above_threshold, 
                 scraped_at, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)
            """, (
                job_data['id'],
                job_data['title'],
                job_data['description'],
                score,
                job_data['posted'],
                job_data['url'],
                job_data['budget'],
                job_data['duration'],
                job_data['experience_level'],
                json.dumps(job_data['skills']),
                json.dumps(job_data['client']),
                job_data['proposals'],
                above_threshold
            ))
            jobs_added += 1
        
        # Update scraping log
        cursor.execute("""
            UPDATE scraping_logs 
            SET status = 'completed', jobs_found = ?, completed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (jobs_added, log_id))
        
        conn.commit()
        logger.info(f"Successfully scraped {jobs_added} jobs")
    
    except Exception as e:
        logger.error(f"Error during scraping: {e}")
        if log_id:
            cursor.execute("""
                UPDATE scraping_logs 
                SET status = 'failed', error_message = ?, completed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (str(e), log_id))
            conn.commit()
    
    finally:
        conn.close()

# Automatic scraping scheduler
def get_scrape_interval_minutes(frequency: str) -> int:
    """Convert frequency string to minutes"""
    if frequency == "5min":
        return 5
    elif frequency == "30min":
        return 30
    elif frequency == "1hour":
        return 60
    else:
        return 30  # default

async def automatic_scraper():
    """Background task that runs automatic scraping based on user preferences"""
    logger.info("Starting automatic scraper...")
    
    while True:
        try:
            # Get current profile scraping frequency
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT scrape_frequency FROM profile ORDER BY updated_at DESC LIMIT 1")
            result = cursor.fetchone()
            conn.close()
            
            frequency = result[0] if result else "30min"
            interval_minutes = get_scrape_interval_minutes(frequency)
            
            logger.info(f"Next scraping in {interval_minutes} minutes (frequency: {frequency})")
            
            # Wait for the specified interval
            await asyncio.sleep(interval_minutes * 60)
            
            # Run scraping
            logger.info("Running automatic scraping...")
            config = ScrapingConfig(max_jobs=20, auto_scrape=True)
            await scrape_jobs_background(config)
            
        except Exception as e:
            logger.error(f"Error in automatic scraper: {e}")
            # Wait 5 minutes before retrying on error
            await asyncio.sleep(300)

@app.on_event("startup")
async def startup_event():
    """Initialize database and start automatic scraper on startup"""
    init_database()
    logger.info("Upwork Assistant API started successfully")
    
    # Start automatic scraper in background
    asyncio.create_task(automatic_scraper())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=API_HOST, port=API_PORT)
