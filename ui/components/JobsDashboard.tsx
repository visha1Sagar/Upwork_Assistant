"use client";
import useSWR from 'swr';
import { useState, useMemo } from 'react';
import JobList from './JobList';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function JobsDashboard() {
  const [showAboveOnly, setShowAboveOnly] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [sortBy, setSortBy] = useState<'time' | 'score'>('time');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Build the API URL with pagination parameters
  const apiUrl = `/api/jobs?show_above_threshold_only=${showAboveOnly}&sort_by=${sortBy}&page=${currentPage}&page_size=${pageSize}`;
  
  const { data, error, isLoading } = useSWR(apiUrl, fetcher, { refreshInterval: 30000 });
  
  const jobs = data?.jobs || [];
  const pagination = data?.pagination || {
    current_page: 1,
    page_size: pageSize,
    total_count: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false
  };
  const apiStats = data?.stats || {
    total_all_jobs: 0,
    total_above_threshold: 0,
    filtered_count: 0
  };
  const threshold = 0.6;

  // Since filtering and sorting is now handled by the backend, we just use the jobs as-is
  const filtered = jobs;

  const stats = useMemo(() => {
    const total = apiStats.total_all_jobs;
    const aboveThreshold = apiStats.total_above_threshold;
    const avgScore = jobs.length > 0 ? jobs.reduce((sum: number, job: any) => sum + job.score, 0) / jobs.length : 0;
    return { total, aboveThreshold, avgScore };
  }, [jobs, apiStats]);

  // Handle filter/sort changes - reset to page 1
  const handleFilterChange = (newShowAboveOnly: boolean) => {
    setShowAboveOnly(newShowAboveOnly);
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy: 'time' | 'score') => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs - Outside the collapsible section */}
      <div className="flex items-center justify-between">
        <div className="flex-1 flex justify-center">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => handleFilterChange(false)}
              className={`px-4 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                !showAboveOnly 
                  ? 'bg-white text-upwork-700 shadow-sm border border-gray-200' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Jobs ({stats.total})
            </button>
            <button
              onClick={() => handleFilterChange(true)}
              className={`px-4 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                showAboveOnly 
                  ? 'bg-white text-upwork-700 shadow-sm border border-gray-200' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              High Match ({stats.aboveThreshold})
            </button>
          </div>
        </div>
        <div className="flex items-center">
          <select
            value={sortBy}
            onChange={e => handleSortChange(e.target.value as 'time' | 'score')}
            className="input px-2 py-1 text-sm rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-upwork-400 min-w-[90px]"
            style={{ minWidth: '90px' }}
          >
            <option value="time">Newest</option>
            <option value="score">Best Match</option>
          </select>
        </div>
      </div>

      {/* Collapsible Job Opportunities Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Clickable Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Job Opportunities</h2>
              <p className="text-gray-600 mt-1">AI-powered job matching and scoring</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live monitoring</span>
              </div>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="px-6 pb-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-upwork-50 to-upwork-100 rounded-lg p-4 border border-upwork-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-upwork-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-upwork-800">Total Jobs</p>
                    <p className="text-2xl font-semibold text-upwork-900">{stats.total}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-success-50 to-success-100 rounded-lg p-4 border border-success-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-success-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-success-800">High Match</p>
                    <p className="text-2xl font-semibold text-success-900">{stats.aboveThreshold}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-brand-50 to-brand-100 rounded-lg p-4 border border-brand-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-brand-800">Avg Score</p>
                    <p className="text-2xl font-semibold text-brand-900">{(stats.avgScore * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-danger-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-danger-800">Error loading jobs</h3>
              <p className="text-sm text-danger-600 mt-1">Please try refreshing the page or check your connection.</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-upwork-600 mb-4"></div>
            <p className="text-gray-600">Loading fresh opportunities...</p>
          </div>
        </div>
      )}

      {/* Job List */}
      <JobList jobs={filtered} />

      {/* Pagination Controls */}
      {pagination.total_pages > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.current_page} of {pagination.total_pages} 
              {showAboveOnly ? (
                <span> ({pagination.total_count} high-match jobs)</span>
              ) : (
                <span> ({pagination.total_count} total jobs)</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.has_prev}
                className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                  pagination.has_prev
                    ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {(() => {
                  const pages = [];
                  const maxVisible = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                  let endPage = Math.min(pagination.total_pages, startPage + maxVisible - 1);
                  
                  // Adjust start if we're near the end
                  if (endPage - startPage < maxVisible - 1) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }

                  // Add first page and ellipsis if needed
                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      pages.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>);
                    }
                  }

                  // Add visible page numbers
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                          i === currentPage
                            ? 'border-upwork-600 bg-upwork-600 text-white'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }

                  // Add ellipsis and last page if needed
                  if (endPage < pagination.total_pages) {
                    if (endPage < pagination.total_pages - 1) {
                      pages.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>);
                    }
                    pages.push(
                      <button
                        key={pagination.total_pages}
                        onClick={() => handlePageChange(pagination.total_pages)}
                        className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        {pagination.total_pages}
                      </button>
                    );
                  }

                  return pages;
                })()}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.has_next}
                className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                  pagination.has_next
                    ? 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
