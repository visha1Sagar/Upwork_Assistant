# Upwork Assistant Backend API

A comprehensive backend system that connects the Next.js frontend with the profile and scrapper modules for intelligent Upwork job matching.

## Features

- **Job Management**: Store, retrieve, and score jobs based on user profile
- **Profile Management**: GitHub profile analysis and skill management
- **Web Scraping**: Integration with Upwork job scraping capabilities
- **Real-time Updates**: Background processing for job scoring and profile analysis

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+

### Installation & Running

#### Option 1: Use Startup Scripts
```bash
# On Windows
start.bat

# On Linux/Mac
chmod +x start.sh
./start.sh
```

#### Option 2: Manual Setup

1. **Install Python dependencies**:
```bash
pip install -r requirements.txt
```

2. **Start the backend server**:
```bash
python main.py
```

3. **Start the frontend** (in another terminal):
```bash
cd ui
npm install
npm run dev
```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## API Endpoints

### Jobs
- `GET /api/jobs` - Get jobs with filtering and sorting
  - Query params: `show_above_threshold_only`, `sort_by`, `limit`
- `GET /api/stats` - Get dashboard statistics

### Profile Management
- `GET /api/profile` - Get current profile configuration
- `POST /api/profile` - Update profile configuration

### Scraping
- `POST /api/scrape/start` - Start job scraping process
- `GET /api/scrape/status` - Get latest scraping status

## Database Schema

The system uses SQLite with the following tables:

### jobs
- Stores scraped job data with calculated relevance scores
- Tracks job status, skills, client information

### profile
- User profile configuration including GitHub data
- Skills, rate preferences, and scoring thresholds

### scraping_logs
- Tracks scraping activities and results

## Configuration

Environment variables (optional):
- `GITHUB_TOKEN` - GitHub personal access token for enhanced API limits
- `DATABASE_URL` - Database connection string (defaults to SQLite)
- `API_HOST` - Backend host (default: 0.0.0.0)
- `API_PORT` - Backend port (default: 8000)
- `BACKEND_URL` - Frontend-to-backend URL (default: http://localhost:8000)

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI    │───▶│   FastAPI       │───▶│   SQLite DB     │
│   (Port 3000)   │    │   Backend       │    │                 │
└─────────────────┘    │   (Port 8000)   │    └─────────────────┘
                       └─────────────────┘              │
                                 │                       │
                       ┌─────────────────┐              │
                       │   Background    │              │
                       │   Tasks         │              │
                       └─────────────────┘              │
                                 │                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   GitHub        │    │   Upwork        │
                       │   Scrapper      │    │   Scrapper      │
                       └─────────────────┘    └─────────────────┘
```

## Key Features

### Job Scoring Algorithm
Jobs are automatically scored based on:
- Skill matching with user profile
- Budget alignment with rate preferences
- Experience level requirements

### Profile Integration
- GitHub repository analysis for skill extraction
- Upwork profile URL integration
- Drag-and-drop skill prioritization

### Real-time Updates
- Background job scoring recalculation
- Automatic profile data refresh
- Live job status tracking

## Development

### Adding New Endpoints
1. Define Pydantic models in `main.py`
2. Create endpoint function with proper error handling
3. Add corresponding Next.js API route in `ui/app/api/`

### Database Migrations
The database is automatically initialized on startup. For schema changes:
1. Update table creation in `init_database()`
2. Handle existing data migration if needed

### Testing
Start both servers and test the full stack:
1. Profile configuration at `/profile`
2. Job dashboard at `/`
3. API endpoints at `/api/*`

## Troubleshooting

### Backend Connection Issues
- Ensure Python backend is running on port 8000
- Check firewall settings
- Verify CORS configuration

### Database Issues
- Database file is created automatically
- Check write permissions in project directory
- SQLite browser recommended for debugging

### Module Import Errors
- Ensure all Python dependencies are installed
- Check Python path configuration
- Verify module structure

## Next Steps

1. **Enhanced Scraping**: Implement production-ready Upwork scraping
2. **Authentication**: Add user authentication system  
3. **Notifications**: Email/webhook alerts for high-scoring jobs
4. **Analytics**: Advanced job market analysis and trends
5. **Deployment**: Docker containerization and cloud deployment
