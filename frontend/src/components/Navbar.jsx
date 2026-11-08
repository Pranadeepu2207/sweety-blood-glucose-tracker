import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, LayoutDashboard, FileBarChart, LogOut, User } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-brand-primary flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-brand-dark leading-none block">
                Sweety
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 hidden xs:block">
                Glucose Tracker
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'reports'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <FileBarChart className="w-4 h-4" />
              <span>Reports</span>
            </button>
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[130px]">
                {user?.name || 'Patient'}
              </span>
              <span className="text-[11px] text-gray-500">
                Patient Account
              </span>
            </div>

            <button
              onClick={logout}
              title="Log out of account"
              className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-brand-crimson transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
