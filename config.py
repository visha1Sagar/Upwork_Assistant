"""
Configuration settings for the Upwork Assistant
"""
import os
from typing import List

# Database settings
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///upwork_assistant.db")

# GitHub settings
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

# Upwork scraping settings
SCRAPING_INTERVAL_MINUTES = int(os.getenv("SCRAPING_INTERVAL_MINUTES", "30"))
MAX_JOBS_PER_SCRAPE = int(os.getenv("MAX_JOBS_PER_SCRAPE", "50"))

# Scoring settings
DEFAULT_SCORE_THRESHOLD = float(os.getenv("DEFAULT_SCORE_THRESHOLD", "0.6"))

# API settings
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

# File paths
PROFILE_DATA_DIR = "profile/data"
SCRAPPER_DATA_DIR = "scrapper/data"

# Default skills for matching
DEFAULT_SKILLS = [
    'python', 'n8n', 'selenium', 'api', 'automation', 
    'postgres', 'docker', 'github-actions', 'react', 'fastapi'
]

# Rate limits
DEFAULT_RATE_MIN = 25
DEFAULT_RATE_MAX = 90
