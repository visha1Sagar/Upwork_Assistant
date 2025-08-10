import { NextResponse, NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/profile`, {
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
    console.error('Error fetching profile from backend:', error);
    
    // Fallback to default profile
    const defaultProfile = {
      github_username: null,
      upwork_profile_url: null,
      skills: ['python', 'n8n', 'selenium', 'api', 'automation', 'postgres', 'docker', 'github-actions', 'react', 'fastapi'],
      rate_min: 25,
      rate_max: 90,
      score_threshold: 0.6,
      github_data: null
    };

    return NextResponse.json({
      ...defaultProfile,
      error: 'Backend connection failed',
      message: 'Using default profile. Start the Python backend server: python main.py'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', message: error.message },
      { status: 500 }
    );
  }
}
