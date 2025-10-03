import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { toast } from 'sonner';

const AdminPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  console.log('AdminPage loaded - User:', user?.email, 'Role:', user?.role);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tours', label: 'Turlar', icon: '🚌' },
    { id: 'users', label: 'Kullanıcılar', icon: '👥' },
    { id: 'locations', label: 'Lokasyonlar', icon: '📍' },
    { id: 'categories', label: 'Kategoriler', icon: '🏷️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Paneli</h1>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-xl p-2 shadow-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          <p>İçerik burada görünecek...</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;