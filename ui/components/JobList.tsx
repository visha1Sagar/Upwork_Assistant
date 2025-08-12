"use client";
import React from 'react';
import ScoreBadge from './ScoreBadge';

interface Job {
  id: string;
  title: string;
  description: string;
  score: number;
  posted: string;
  url: string;
  budget?: string;
  duration?: string;
  experienceLevel?: string;
  skills?: string[];
  proposals?: number;
  client?: {
    rating: number;
    location: string;
    verified: boolean;
    totalSpent?: string;
    paymentVerified?: boolean;
  };
  aboveThreshold?: boolean;
}

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  try {
    // Handle different date formats
    let date: Date;
    
    // If it's already a relative time string (like "2 hours ago"), return as is
    if (dateString.includes('ago') || dateString.includes('minutes') || dateString.includes('hours') || dateString.includes('days')) {
      return dateString;
    }
    
    // If it's an ISO string, parse it
    if (dateString.includes('T')) {
      date = new Date(dateString);
    } else {
      // Try parsing as a regular date string
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original if can't parse
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    } else {
      // For older dates, show the actual date
      return date.toLocaleDateString();
    }
  } catch (error) {
    // If any error occurs, return the original string
    return dateString;
  }
}

interface Job {
  id: string;
  title: string;
  description: string;
  score: number;
  posted: string;
  url: string;
  budget?: string;
  duration?: string;
  experienceLevel?: string;
  skills?: string[];
  proposals?: number;
  client?: {
    rating: number;
    location: string;
    verified: boolean;
    totalSpent?: string;
    paymentVerified?: boolean;
  };
  aboveThreshold?: boolean;
}

export default function JobList({ jobs }: { jobs: Job[] }) {
  if (!jobs.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No jobs found</h3>
          <p className="mt-2 text-gray-600">Try adjusting your filters or check back later for new opportunities.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job, index) => (
        <div key={job.id} className="card p-6 hover:shadow-lg transition-all duration-300 group">
          {/* Header with Posted Time */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">{formatRelativeTime(job.posted)}</span>
            <div className="flex items-center space-x-2">
              <button className="p-1 text-gray-400 hover:text-upwork-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Job Title */}
          <h3 className="text-xl font-semibold text-gray-900 hover:text-upwork-600 cursor-pointer mb-4 line-clamp-2">
            {job.title}
          </h3>

          {/* Client Info Bar */}
          <div className="flex items-center space-x-6 mb-4">
            {job.client?.paymentVerified && (
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-success-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">Payment verified</span>
              </div>
            )}
            
            {job.client?.rating && (
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className={`w-4 h-4 ${i < Math.floor(job.client!.rating) ? 'text-warning-400' : 'text-gray-300'} fill-current`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                {job.client.totalSpent && (
                  <span className="text-sm text-gray-600 ml-2">{job.client.totalSpent} spent</span>
                )}
              </div>
            )}

            {job.client?.location && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-gray-600">{job.client.location}</span>
              </div>
            )}
          </div>

          {/* Job Details */}
          <div className="mb-4">
            <div className="text-sm text-gray-700 font-medium">
              {job.budget && <span>Hourly: {job.budget}</span>}
            </div>
          </div>

          <div className="flex items-start gap-6">
            {/* Job Content */}
            <div className="flex-1 min-w-0">
              {/* Truncated Description - First 2-3 lines */}
              <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                {job.description || 'No description available.'}
              </p>
              
              {/* Skills Section */}
              {job.skills && job.skills.length > 0 ? (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.slice(0, 6).map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-2 py-1 bg-upwork-50 text-upwork-700 text-xs rounded-md border border-upwork-200 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 6 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md border">
                        +{job.skills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Skills</h4>
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md border italic">
                    No skills specified
                  </span>
                </div>
              )}
            </div>

            {/* Score Badge */}
            <div className="flex-shrink-0">
              <ScoreBadge score={job.score} />
            </div>
          </div>

          {/* Proposals Count */}
          {job.proposals && (
            <div className="text-sm text-gray-500 mb-4">
              {job.proposals} proposal{job.proposals !== 1 ? 's' : ''} submitted
            </div>
          )}

          {/* Action Bar */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button className="btn btn-primary text-sm">
                Apply Now
              </button>
              <button className="btn btn-ghost text-sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Save
              </button>
              <button className="btn btn-ghost text-sm">
                View Details
              </button>
            </div>
            {/* Removed Match #1 label for cleaner UI */}
          </div>
        </div>
      ))}
    </div>
  );
}
