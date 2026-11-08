import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { Activity } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-brand-primary flex items-center justify-center text-white mx-auto mb-3 animate-pulse shadow-sm">
            <Activity className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-sm font-semibold text-brand-dark">Loading Sweety...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authMode === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthMode('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthMode('register')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col antialiased">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 w-full">
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'reports' && <ReportsPage />}
      </main>
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        Sweety Blood Glucose Tracker &middot; Patient Portal
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
