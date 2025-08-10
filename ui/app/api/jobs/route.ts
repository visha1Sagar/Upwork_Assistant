import { NextResponse, NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showAboveOnly = searchParams.get('show_above_threshold_only') === 'true';
    const sortBy = searchParams.get('sort_by') || 'time';
    const limit = parseInt(searchParams.get('limit') || '50');

    const response = await fetch(
      `${BACKEND_URL}/api/jobs?show_above_threshold_only=${showAboveOnly}&sort_by=${sortBy}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Disable caching for real-time data
      }
    );

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching jobs from backend:', error);
    
    // Fallback to sample data if backend is not available
    const fallbackJobs = [
      {
        id: 'fallback-1',
        title: 'Backend Connection Error - Sample Job',
        description: 'This is a fallback job displayed when the backend is not available. Please start the Python backend server.',
        score: 0.5,
        posted: '1 minute ago',
        url: '#',
        budget: 'Backend Unavailable',
        duration: 'N/A',
        experienceLevel: 'N/A',
        skills: ['Backend Error'],
        client: {
          rating: 0,
          location: 'N/A',
          verified: false,
          totalSpent: 'N/A',
          paymentVerified: false
        },
        proposals: 0,
        aboveThreshold: false
      }
    ];

    return NextResponse.json({ 
      jobs: fallbackJobs,
      error: 'Backend connection failed',
      message: 'Start the Python backend server: python main.py'
    });
  }
}
