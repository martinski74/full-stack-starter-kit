'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCategoryColor } from '../utils/categoryColors';
import { useToast } from '../utils/toast';

interface UserData {
  name: string;
  role: string;
  id?: number;
  email?: string;
}

export type AdminApiTool = {
  id: number;
  name: string;
  description?: string | null;
  documentation_url?: string | null;
  video_url?: string | null;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
  categories?: { id: number; name: string }[];
  roles?: { id: number; name: string }[];
  created_at: string;
  user?: { id?: number; name: string; email?: string };
  status: 'pending' | 'approved' | 'rejected';
};

export type Option = { id: number; name: string };

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8201/api';

export default function AdminPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { addToast } = useToast();

  const [tools, setTools] = useState<AdminApiTool[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [roles, setRoles] = useState<Option[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | number>('');
  const [selectedStatus, setSelectedStatus] = useState<'' | 'pending' | 'approved' | 'rejected'>('');
  const [selectedRole, setSelectedRole] = useState<string | number>('');

  const fetchAllData = useCallback(async (token: string | null) => {
    setLoadingData(true);
    try {
      const [toolsRes, catRes, roleRes] = await Promise.all([
        fetch(`${API}/tools`, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }),
        fetch(`${API}/categories`, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }),
        fetch(`${API}/roles`, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }),
      ]);

      const toolsJson = await toolsRes.json();
      setTools(Array.isArray(toolsJson?.data) ? toolsJson.data : toolsJson);

      const catJson = await catRes.json();
      setCategories(catJson);

      const roleJson = await roleRes.json();
      setRoles(roleJson);

      setLoadingData(false);
    } catch (e) {
      console.error('Неуспешно зареждане на данни.', e);
      addToast('Неуспешно зареждане на данни за админ панел.', 'error');
      setLoadingData(false);
    }
  }, [addToast, API]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/');
      return;
    }

    const fetchUserData = async () => {
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        setUser(parsedUser);
        setLoadingUser(false);
        if (parsedUser.role !== 'owner') {
          router.push('/dashboard');
        } else {
          fetchAllData(token);
        }
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
            if (data.role !== 'owner') {
              router.push('/dashboard');
            } else {
              fetchAllData(token);
            }
          } else {
            setError(data.message || 'Failed to fetch user data.');
          }
        } catch (err) {
          setError('Network error or server unavailable.');
          console.error('Error fetching user data:', err);
        } finally {
          setLoadingUser(false);
        }
      }
    };

    fetchUserData();
  }, [router, fetchAllData]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearchQuery = searchQuery === '' ||
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tool.description && tool.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tool.user?.name && tool.user.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === '' ||
        (tool.categories && tool.categories.some(cat => cat.id === Number(selectedCategory)));

      const matchesStatus = selectedStatus === '' || tool.status === selectedStatus;

      const matchesRole = selectedRole === '' ||
        (tool.roles && tool.roles.some(role => role.id === Number(selectedRole)));

      return matchesSearchQuery && matchesCategory && matchesStatus && matchesRole;
    });
  }, [tools, searchQuery, selectedCategory, selectedStatus, selectedRole]);

  const totalTools = filteredTools.length;
  const pendingTools = filteredTools.filter(tool => tool.status === 'pending').length;
  const approvedTools = filteredTools.filter(tool => tool.status === 'approved').length;
  const rejectedTools = filteredTools.filter(tool => tool.status === 'rejected').length;

  const handleApproveTool = async (toolId: number) => {
    if (!confirm('Сигурни ли сте, че искате да одобрите този инструмент?')) return;
    await updateToolStatus(toolId, 'approved');
  };

  const handleRejectTool = async (toolId: number) => {
    if (!confirm('Сигурни ли сте, че искате да отхвърлите този инструмент?')) return;
    await updateToolStatus(toolId, 'rejected');
  };

  const handleDeleteTool = async (toolId: number) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете този инструмент?')) return;
    const token = localStorage.getItem('auth_token');
    if (!token) {
      addToast('Няма токен за удостоверяване.', 'error');
      return;
    }
    try {
      const response = await fetch(`${API}/tools/${toolId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        addToast('Инструментът е изтрит успешно!', 'success');
        setTools(prevTools => prevTools.filter(tool => tool.id !== toolId));
      } else {
        const errorText = await response.text();
        console.error('Неуспешно изтриване на инструмент:', errorText);
        addToast('Неуспешно изтриване на инструмент.', 'error');
      }
    } catch (error) {
      console.error('Грешка при изтриване на инструмента:', error);
      addToast('Грешка при изтриване на инструмента.', 'error');
    }
  };

  const updateToolStatus = async (toolId: number, newStatus: 'pending' | 'approved' | 'rejected') => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      addToast('Няма токен за удостоверяване.', 'error');
      return;
    }

    try {
      console.time('API Status Update'); // Start timer
      const response = await fetch(`${API}/tools/${toolId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      console.timeEnd('API Status Update'); // End timer

      if (response.ok) {
        addToast(`Инструментът е ${newStatus === 'approved' ? 'одобрен' : 'отхвърлен'} успешно!`, 'success');
        setTools(prevTools =>
          prevTools.map(tool => (tool.id === toolId ? { ...tool, status: newStatus } : tool))
        );
      } else {
        const errorText = await response.text();
        console.error('Неуспешно актуализиране на статуса:', errorText);
        addToast('Неуспешно актуализиране на статуса.', 'error');
      }
    } catch (error) {
      console.error('Грешка при актуализиране на статуса:', error);
      addToast('Грешка при актуализиране на статуса.', 'error');
    }
  };

  if (loadingUser || loadingData) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">Зареждане на админ панел...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-600">Error: {error}</div>;
  }

  // Redirect if user is not an owner (redundant check, but good for safety)
  if (user?.role !== 'owner') {
    return null; // Should have already redirected
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
            <Link href="/dashboard" className="px-3 py-2 font-medium text-sm leading-5 rounded-md text-gray-600 hover:text-blue-700 hover:bg-blue-50 focus:outline-none focus:text-blue-700 focus:bg-blue-50 transition duration-150 ease-in-out">Табло</Link>
            <Link href="/tools" className="px-3 py-2 font-medium text-sm leading-5 rounded-md text-gray-600 hover:text-blue-700 hover:bg-blue-50 focus:outline-none focus:text-blue-700 focus:bg-blue-50 transition duration-150 ease-in-out">AI Инструменти</Link>
            {user?.role === 'owner' && (
              <Link href="/admin" className="px-3 py-2 font-medium text-sm leading-5 rounded-md text-blue-700 bg-blue-50 focus:outline-none focus:text-blue-800 focus:bg-blue-100 transition duration-150 ease-in-out">Админ</Link>
            )}
          </nav>
        </div>
      </div>

      {/* Admin Panel Content */}
      <div className="max-w-6xl mx-auto p-6 flex flex-col items-stretch justify-start gap-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Админ панел</h1>
        <p className="mt-1 text-gray-600">Управление на AI инструменти и одобрения</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mt-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl">👁️</div>
            <div>
              <p className="text-gray-500 text-sm">Общо инструменти</p>
              <p className="text-gray-900 text-2xl font-bold">{totalTools}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xl">🕒</div>
            <div>
              <p className="text-gray-500 text-sm">Чакат одобрение</p>
              <p className="text-gray-900 text-2xl font-bold">{pendingTools}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl">✅</div>
            <div>
              <p className="text-gray-500 text-sm">Одобрени</p>
              <p className="text-gray-900 text-2xl font-bold">{approvedTools}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl">❌</div>
            <div>
              <p className="text-gray-500 text-sm">Отхвърлени</p>
              <p className="text-gray-900 text-2xl font-bold">{rejectedTools}</p>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div className="relative col-span-1 sm:col-span-2">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">🔍</span>
            <input type="text" placeholder="Търси инструменти..." className="w-full border border-gray-300 rounded-lg py-2 pl-10 pr-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="relative">
            <select className="block w-full border border-gray-300 rounded-lg py-2 px-3 pr-8 text-gray-700 sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">Всички категории</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <div className="relative">
            <select className="block w-full border border-gray-300 rounded-lg py-2 px-3 pr-8 text-gray-700 sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="">Всички статуси</option>
              <option value="pending">Чака одобрение</option>
              <option value="approved">Одобрени</option>
              <option value="rejected">Отхвърлени</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <div className="relative">
            <select className="block w-full border border-gray-300 rounded-lg py-2 px-3 pr-8 text-gray-700 sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
              <option value="">Всички роли</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 sm:col-span-1 justify-end">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            <span>{filteredTools.length} от {tools.length} инструмента</span>
          </div>
        </div>

        {/* Tools List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Инструмент</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Създател</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Категория</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Conditional rendering for filtered tools */}
              {filteredTools.length === 0 && !loadingData ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">Няма намерени инструменти, отговарящи на критериите.</td>
                </tr>
              ) : (
                filteredTools.map((tool) => (
                  <tr key={tool.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                      <div className="text-sm text-gray-500">{tool.description}</div>
                      <div className="mt-1">
                        {tool.difficulty && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tool.difficulty === 'beginner' ? 'bg-green-100 text-green-800' : tool.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {tool.difficulty === 'beginner' && 'Начинаещ'}
                          {tool.difficulty === 'intermediate' && 'Средно напреднал'}
                          {tool.difficulty === 'advanced' && 'Напреднал'}
                        </span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tool.user?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{tool.user?.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tool.status === 'pending' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Чака одобрение</span>}
                      {tool.status === 'approved' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Одобрен</span>}
                      {tool.status === 'rejected' && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Отхвърлен</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tool.categories?.map(cat => (
                        <span key={cat.id} className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(cat.id)}`}>{cat.name}</span>
                      ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tool.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {tool.status === 'pending' && (
                        <>
                          <button onClick={() => handleApproveTool(tool.id)} className="text-green-600 hover:text-green-900 mr-3">✅</button>
                          <button onClick={() => handleRejectTool(tool.id)} className="text-red-600 hover:text-red-900 mr-3">❌</button>
                        </>
                      )}
                      <button onClick={() => handleDeleteTool(tool.id)} className="text-gray-600 hover:text-gray-900">🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
