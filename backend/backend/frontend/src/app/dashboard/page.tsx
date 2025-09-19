'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link component

interface UserData {
  name: string;
  role: string;
  id?: number;
  email?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8201/api';

const DashboardPage = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<string>('');
  const [toolsCount, setToolsCount] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('No authentication token found. Redirecting to login...');
        router.push('/');
        return;
      }

      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
        setLoading(false);
      } else {
        try {
          const response = await fetch('http://localhost:8201/api/user', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.ok) {
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
          } else {
            setError(data.message || 'Failed to fetch user data.');
          }
        } catch (err) {
          setError('Network error or server unavailable. Check console for details.');
          console.error('Error fetching user data:', err);
        } finally {
          setLoading(false);
        }
      }

      // Tools count from cache or API
      try {
        const cachedTools = localStorage.getItem('tools');
        if (cachedTools) {
          const parsed = JSON.parse(cachedTools);
          setToolsCount(Array.isArray(parsed?.data) ? parsed.data.length : parsed.length);
        } else {
          const res = await fetch(`${API}/tools`, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
          const json = await res.json();
          const list = Array.isArray(json?.data) ? json.data : json;
          setToolsCount(Array.isArray(list) ? list.length : 0);
        }
      } catch (e) {
        console.error('Failed to fetch tools count', e);
      }
    };

    fetchUserData();
  }, [router]);

  // Realtime clock for header (bg-BG)
  useEffect(() => {
    const update = () => {
      const fmt = new Intl.DateTimeFormat('bg-BG', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      setNow(fmt.format(new Date()));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    localStorage.clear(); // Clear all localStorage items
    router.push('/');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="w-full sticky top-0 z-10 bg-white shadow-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-blue-700 font-semibold text-xl flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Tools Platform
            </span>
          </div>
          
          
          <div className="flex items-center gap-3">
            <span className="text-base text-gray-800 font-medium">{user?.name}</span>
            <button onClick={handleLogout} className="text-sm bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-md transition duration-150 ease-in-out">Изход</button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4 py-2 border-t border-gray-100">
            <Link href="#" className="px-3 py-2 font-medium text-sm leading-5 rounded-md text-blue-700 bg-blue-50 focus:outline-none focus:text-blue-800 focus:bg-blue-100 transition duration-150 ease-in-out">Табло</Link>
            <Link href="/tools" className="px-3 py-2 font-medium text-sm leading-5 rounded-md text-gray-600 hover:text-blue-700 hover:bg-blue-50 focus:outline-none focus:text-blue-700 focus:bg-blue-50 transition duration-150 ease-in-out">AI Инструменти</Link>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6 flex flex-col items-stretch justify-start gap-6">
        {/* Gradient Welcome Card */}
        <div className="relative w-full rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 overflow-hidden" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 50%, #2563EB 100%)' }}>
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
          <div className="pointer-events-none absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
          <div className="flex items-start justify-between gap-6">
            <div className="text-white">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-snug">
                Добре дошъл, {user?.name}! Ти си с роля: {user?.role}.
              </h1>
              <div className="mt-2 text-white/90 text-sm sm:text-base">
                Използвай платформата за да откриеш и споделиш AI инструменти с останалите екипи.
              </div>
            </div>
            <div className="shrink-0 h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white text-2xl shadow-inner">
              <span>👤</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
              <span>🛠️</span>
            </div>
            <div>
              <p className="text-gray-500 text-sm">AI Инструменти</p>
              <p className="text-gray-900 text-2xl font-bold">{toolsCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl">
              <span>👥</span>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Активни потребители</p>
              <p className="text-gray-900 text-2xl font-bold">6</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xl">
              <span>📊</span>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Категории</p>
              <p className="text-gray-900 text-2xl font-bold">5</p>
            </div>
          </div>
        </div>

        {/* Available Functions Section */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900">Налични функции за твоята роля</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
            <Link href="/tools" className="block bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
                  <span>🛠️</span>
                </div>
                <div>
                  <p className="text-gray-900 text-lg font-semibold">Разглеждай инструменти</p>
                  <p className="text-gray-500 text-sm">Открий нови AI решения</p>
                </div>
              </div>
            </Link>
            <Link href="/tools?openAddToolModal=true" className="block bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 text-green-600 flex.items-center justify-center text-xl">
                  <span>⚙️</span>
                </div>
                <div>
                  <p className="text-gray-900 text-lg font-semibold">Добави инструмент</p>
                  <p className="text-gray-500 text-sm">Сподели ново AI решение</p>
                </div>
              </div>
            </Link>
          </div>
        </div>


        </div>
      </div>
  );
};

export default DashboardPage;
