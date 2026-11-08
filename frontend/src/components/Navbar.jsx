import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, LayoutDashboard, FileBarChart, LogOut, User } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-brand-primary flex items-center justify-center text-white shadow-sm">
              <Activity className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-brand-dark">Sweety</span>
              <span className="block text-xs font-medium text-gray-500">Blood Glucose Tracker</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-gray-900 leading-tight">
                {user?.name || 'Patient'}
              </span>
              <span className="text-xs text-gray-500 capitalize">
                {user?.role || 'Patient'}
              </span>
            </div>

            <button
              onClick={logout}
              title="Log out"
              className="flex items-center space-x-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-brand-crimson transition-colors"
            >
              <LogOut className="w-4 h-4 text-gray-500" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
