"use client";
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

const defaultSkills = [
  'python','n8n','selenium','api','automation','postgres','docker','github-actions','react','fastapi'
];

interface ProfileData {
  github_username?: string;
  upwork_profile_url?: string;
  skills: string[];
  rate_min: number;
  rate_max: number;
  score_threshold: number;
  github_data?: any;
}

export default function ProfileTabs() {
  const [tab, setTab] = useState<'sources' | 'preferences'>('sources');
  const [skills, setSkills] = useState<string[]>(defaultSkills);
  const [rateMin, setRateMin] = useState<number>(25);
  const [rateMax, setRateMax] = useState<number>(90);
  const [githubUsername, setGithubUsername] = useState<string>('');
  const [upworkProfile, setUpworkProfile] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(0.6);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Load profile data on component mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data: ProfileData = await response.json();
        setSkills(data.skills || defaultSkills);
        setRateMin(data.rate_min || 25);
        setRateMax(data.rate_max || 90);
        setGithubUsername(data.github_username || '');
        setUpworkProfile(data.upwork_profile_url || '');
        setThreshold(data.score_threshold || 0.6);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage('Failed to load profile data');
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const profileData: ProfileData = {
        github_username: githubUsername,
        upwork_profile_url: upworkProfile,
        skills,
        rate_min: rateMin,
        rate_max: rateMax,
        score_threshold: threshold
      };

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        setMessage('Profile updated successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const items = Array.from(skills);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setSkills(items);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Profile Configuration</h2>
            <p className="text-gray-600 mt-1">Manage your profile sources and matching preferences</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Configuration needed</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setTab('sources')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              tab === 'sources'
                ? 'bg-white text-upwork-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Profile Sources</span>
            </div>
          </button>
          <button
            onClick={() => setTab('preferences')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              tab === 'preferences'
                ? 'bg-white text-upwork-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <span>Preferences</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'sources' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GitHub Profile */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">GitHub Username</label>
                    <p className="text-xs text-gray-600">We'll analyze your repositories and READMEs</p>
                  </div>
                </div>
                <input 
                  type="text" 
                  placeholder="octocat" 
                  className="input"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                />
              </div>

              {/* Upwork Profile */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-upwork-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">Upwork Profile URL</label>
                    <p className="text-xs text-gray-600">Your public Upwork freelancer profile</p>
                  </div>
                </div>
                <input 
                  type="url" 
                  placeholder="https://www.upwork.com/freelancers/~01..." 
                  className="input"
                  value={upworkProfile}
                  onChange={(e) => setUpworkProfile(e.target.value)}
                />
              </div>
            </div>

            {/* Resume Upload */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Resume</label>
                  <p className="text-xs text-gray-600">Upload PDF, DOC, or paste text content</p>
                </div>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-upwork-400 transition-colors">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">Drop files here or click to upload</span>
                      <span className="mt-1 block text-xs text-gray-600">PDF, DOC up to 10MB</span>
                    </label>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf,.doc,.docx" />
                  </div>
                </div>
              </div>
            </div>

            {/* Status Message */}
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.includes('successfully') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button 
                className="btn btn-primary"
                onClick={saveProfile}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Profile Sources
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {tab === 'preferences' && (
          <div className="space-y-8">
            {/* Skills Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Skills Priority</h3>
                  <p className="text-sm text-gray-600">Drag to reorder by importance for job matching</p>
                </div>
                <button className="btn btn-secondary text-xs">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Skill
                </button>
              </div>
              
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="skills" direction="horizontal">
                  {(provided) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps} 
                      className="flex flex-wrap gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg min-h-[80px]"
                    >
                      {skills.map((skill, index) => (
                        <Draggable key={skill} draggableId={skill} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium cursor-move transition-all duration-200 ${
                                snapshot.isDragging
                                  ? 'bg-upwork-600 text-white shadow-lg scale-105'
                                  : index < 3
                                  ? 'bg-upwork-100 text-upwork-800 border border-upwork-200'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:border-upwork-300'
                              }`}
                            >
                              <svg className="w-3 h-3 mr-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                              </svg>
                              {skill}
                              {index < 3 && (
                                <span className="ml-2 px-1.5 py-0.5 text-xs bg-upwork-600 text-white rounded">
                                  {index + 1}
                                </span>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            {/* Rate Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">Minimum Rate ($/hr)</label>
                <input 
                  type="number" 
                  value={rateMin} 
                  onChange={e => setRateMin(parseInt(e.target.value || '0'))} 
                  className="input"
                  min="1"
                  max="500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">Maximum Rate ($/hr)</label>
                <input 
                  type="number" 
                  value={rateMax} 
                  onChange={e => setRateMax(parseInt(e.target.value || '0'))} 
                  className="input"
                  min="1"
                  max="500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Target Range</label>
                <div className="flex items-center justify-center h-10 bg-upwork-50 border border-upwork-200 rounded-lg">
                  <span className="text-sm font-semibold text-upwork-800">${rateMin} - ${rateMax} / hr</span>
                </div>
              </div>
            </div>

            {/* Additional Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">Score Threshold</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value || '0.6'))}
                  className="input"
                  min="0"
                  max="1"
                />
                <p className="text-xs text-gray-600">Jobs below this score won't trigger alerts</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">Alert Frequency</label>
                <select className="input">
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Every hour</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly summary</option>
                </select>
              </div>
            </div>

            {/* Status Message */}
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.includes('successfully') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button 
                className="btn btn-primary"
                onClick={saveProfile}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
