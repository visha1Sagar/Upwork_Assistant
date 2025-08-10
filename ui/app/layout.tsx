import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Upwork Assistant - Smart Job Matching',
  description: 'AI-powered freelance job scoring and alerts dashboard'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <div className="min-h-screen">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-8">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <h1 className="text-xl font-bold text-upwork-600">Upwork Assistant</h1>
                    </div>
                    <div className="hidden md:block ml-8">
                      <nav className="flex space-x-6">
                        <a href="/" className="text-gray-700 hover:text-upwork-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                          Dashboard
                        </a>
                        <a href="/profile" className="text-gray-700 hover:text-upwork-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                          Profile
                        </a>
                      </nav>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Active</span>
                  </div>
                  <button className="p-2 rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-upwork-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h5m0 0l3 3m-3-3v9" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
