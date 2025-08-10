import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching stats from backend:', error);
    
    // Fallback stats
    const fallbackStats = {
      total_jobs: 0,
      above_threshold: 0,
      avg_score: 0.0,
      threshold: 0.6,
      recent_jobs_24h: 0,
      error: 'Backend connection failed'
    };

    return NextResponse.json(fallbackStats);
  }
}
