'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AddToolModal from './AddToolModal'; // Import the new modal component
import Link from 'next/link'; // Import Link component
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
import { getCategoryColor } from '../utils/categoryColors';
import { useToast } from '../utils/toast';

export type ApiTool = {
	id: number;
	name: string;
	description?: string | null;
	documentation_url?: string | null;
	video_url?: string | null;
	difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
	categories?: { id: number; name: string }[];
	roles?: { id: number; name: string }[];
	created_at: string;
	user?: { id?: number; name: string };
};

export type Option = { id: number; name: string };

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8201/api';

export default function ToolsPage() {
	const [tools, setTools] = useState<ApiTool[]>([]);
	const [categories, setCategories] = useState<Option[]>([]);
	const [roles, setRoles] = useState<Option[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const router = useRouter();
	const { addToast } = useToast();

	const [searchQuery, setSearchQuery] = useState<string>('');
	const [selectedCategory, setSelectedCategory] = useState<string | number>('');
	const [selectedRole, setSelectedRole] = useState<string | number>('');

	const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
	const [editTool, setEditTool] = useState<ApiTool | null>(null); // State to hold tool being edited
	const [user, setUser] = useState<{ id?: number; name: string; role: string } | null>(null);
	const [nextTempId, setNextTempId] = useState(-1); // For temporary client-side IDs

	const handleLogout = () => {
		localStorage.clear(); // Clear all localStorage items
		router.push('/');
	};

	async function removeTool(id: number) {
		if (!confirm('Изтриване на инструмента?')) return;
		const token = localStorage.getItem('auth_token');
		if (!token) {
			console.error('Няма токен за удостоверяване.');
			addToast('Няма токен за удостоверяване.', 'error');
			return;
		}

		try {
			const response = await fetch(`${API}/tools/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
			if (response.ok) {
				console.log('Инструментът е изтрит успешно!');
				addToast('Инструментът е изтрит успешно.', 'success');
				setTools(prevTools => {
					const updatedTools = prevTools.filter(tool => tool.id !== id);
					localStorage.setItem('tools', JSON.stringify(updatedTools)); // Update cached tools
					return updatedTools;
				});
			} else {
				const errorText = await response.text();
				console.error('Неуспешно изтриване на инструмент:', errorText);
				addToast('Неуспешно изтриване на инструмент.', 'error');
			}
		} catch (error) {
			console.error('Грешка при изтриване на инструмента:', error);
			addToast('Грешка при изтриване на инструмента.', 'error');
		}
	}

	const fetchAllData = useCallback(async (token: string | null) => {
		setLoading(true);
		console.log('fetchAllData called...');
		try {
			const cachedCategories = localStorage.getItem('categories');
			const cachedRoles = localStorage.getItem('roles');
			const cachedTools = localStorage.getItem('tools');

			let categoriesData: Option[] = [];
			let rolesData: Option[] = [];
			let toolsData: ApiTool[] = [];

			let shouldFetchAll = false;

			if (cachedCategories && cachedRoles && cachedTools) {
				categoriesData = JSON.parse(cachedCategories);
				rolesData = JSON.parse(cachedRoles);
				toolsData = JSON.parse(cachedTools);
				setCategories(categoriesData);
				setRoles(rolesData);
				setTools(toolsData);
				setLoading(false);
				console.log('Loaded data from cache:', { categories: categoriesData, roles: rolesData, tools: toolsData });
			} else {
				shouldFetchAll = true;
				console.log('Cache incomplete, fetching from API...');
			}

			if (shouldFetchAll) {
				const [toolsRes, catRes, roleRes] = await Promise.all([
					fetch(`${API}/tools`, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }),
					fetch(`${API}/categories`, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }),
					fetch(`${API}/roles`, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }),
				]);
				const toolsJson = await toolsRes.json();
				setTools(Array.isArray(toolsJson?.data) ? toolsJson.data : toolsJson);
				localStorage.setItem('tools', JSON.stringify(Array.isArray(toolsJson?.data) ? toolsJson.data : toolsJson));
				const catJson = await catRes.json();
				setCategories(catJson);
				localStorage.setItem('categories', JSON.stringify(catJson));
				const roleJson = await roleRes.json();
				setRoles(roleJson);
				localStorage.setItem('roles', JSON.stringify(roleJson));
				setLoading(false);
				console.log('Fetched data from API and cached:', { tools: toolsJson, categories: catJson, roles: roleJson });
			}
			setLoading(false);
		} catch (e) {
			console.error('Неуспешно зареждане на данни.', e);
			setLoading(false);
			addToast('Неуспешно зареждане на инструменти.', 'error');
		} 
	}, [setLoading, setTools, setCategories, setRoles, API, addToast]);

	const handleOpenAddModal = () => {
		setEditTool(null); // Ensure no tool is being edited when opening for add
		setIsModalOpen(true);
	};

	const handleOpenEditModal = (tool: ApiTool) => {
		setEditTool(tool); // Set the tool to be edited
		setIsModalOpen(true); // Open the modal
		console.log('Opening edit modal for tool:', tool);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditTool(null); // Clear the edit tool when modal closes

		// Clear the query parameter when the modal closes
		if (searchParams.get('openAddToolModal') === 'true') {
			router.replace('/tools');
		}
	};

	const handleSaveTool = async (toolData: any) => {
		setIsModalOpen(false);
		const token = localStorage.getItem('auth_token');
		if (!token) {
			console.error('Няма токен за удостоверяване.');
			addToast('Няма токен за удостоверяване.', 'error');
			return;
		}

		// --- Optimistic Update Start ---
		const tempId = nextTempId;
		setNextTempId(prevId => prevId - 1); // Decrement for next temporary ID

		// Create a temporary tool with optimistic data
		const tempTool: ApiTool = {
			id: tempId, // Temporary client-side ID
			name: toolData.name,
			description: toolData.description,
			documentation_url: toolData.documentation_url,
			video_url: toolData.video_url,
			difficulty: toolData.difficulty,
			categories: (toolData.category_id ? [Number(toolData.category_id)] : []).map((catId: number) => categories.find(c => c.id === catId)).filter(Boolean) as {id: number, name: string}[],
			roles: toolData.role_ids.map((id: string | number) => roles.find(r => r.id === Number(id))).filter(Boolean) as {id: number, name: string}[],
			created_at: new Date().toISOString(), // Client-side timestamp
			user: user || undefined, // Use current user if available
		};

		setTools(prevTools => [...prevTools, tempTool]); // Add temporary tool immediately

		try {
			const payload = {
				...toolData,
				category_ids: toolData.category_id ? [Number(toolData.category_id)] : [],
				role_ids: toolData.role_ids.map((id: string | number) => Number(id)),
				new_category_name: toolData.newCategory,
				tags: toolData.tags,
			};

			const response = await fetch(`${API}/tools`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Неуспешно добавяне на инструмент:', errorText);
				addToast('Неуспешно добавяне на инструмента.', 'error');
				setTools(prevTools => prevTools.filter(tool => tool.id !== tempId)); // Remove temp tool on error
			} else {
				console.log('Инструментът е добавен успешно!');
				addToast('Инструментът е добавен успешно.', 'success');
				const newToolResponse = await response.json();

				const populatedCategories = (newToolResponse.categories || []).map((cat: { id: number, name: string } | number) => 
					typeof cat === 'number' ? categories.find(c => c.id === cat) : cat
				).filter(Boolean) || [];
				const populatedRoles = (newToolResponse.roles || []).map((role: { id: number, name: string } | number) => 
					typeof role === 'number' ? roles.find(r => r.id === role) : role
				).filter(Boolean) || [];

				const actualNewTool: ApiTool = {
					...newToolResponse,
					categories: populatedCategories as {id: number, name: string}[],
					roles: populatedRoles as {id: number, name: string}[],
				};
				
				// Replace the temporary tool with the actual tool from the server
				setTools(prevTools => {
					const updatedTools = prevTools.map(tool => 
						tool.id === tempId ? actualNewTool : tool
					);
					localStorage.setItem('tools', JSON.stringify(updatedTools)); // Update cached tools
					return updatedTools;
				});
			}
		} catch (error) {
			console.error('Грешка при изпращане на инструмента:', error);
			addToast('Грешка при добавяне на инструмента.', 'error');
			setTools(prevTools => {
				const updatedTools = prevTools.filter(tool => tool.id !== tempId);
				localStorage.setItem('tools', JSON.stringify(updatedTools)); // Update cached tools on network error
				return updatedTools;
			});
		}
		// --- Optimistic Update End ---
	};

	const handleUpdateTool = async (toolId: number, toolData: any) => {
		setIsModalOpen(false);
		const token = localStorage.getItem('auth_token');
		if (!token) {
			console.error('Няма токен за удостоверяване.');
			addToast('Няма токен за удостоверяване.', 'error');
			return;
		}

		try {
			const payload = {
				...toolData,
				category_ids: toolData.category_id ? [Number(toolData.category_id)] : [],
				role_ids: toolData.role_ids.map((id: string | number) => Number(id)),
				new_category_name: toolData.newCategory,
				tags: toolData.tags,
			};

			const response = await fetch(`${API}/tools/${toolId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Неуспешно актуализиране на инструмента:', errorText);
				addToast('Неуспешно актуализиране на инструмента.', 'error');
			} else {
				console.log('Инструментът е актуализиран успешно!');
				addToast('Инструментът е актуализиран успешно.', 'success');
				const updatedToolResponse = await response.json();

				const populatedCategories = (updatedToolResponse.categories || []).map((cat: { id: number, name: string } | number) => 
					typeof cat === 'number' ? categories.find(c => c.id === cat) : cat
				).filter(Boolean) || [];
				const populatedRoles = (updatedToolResponse.roles || []).map((role: { id: number, name: string } | number) => 
					typeof role === 'number' ? roles.find(r => r.id === role) : role
				).filter(Boolean) || [];

				const updatedTool: ApiTool = {
					...updatedToolResponse,
					categories: populatedCategories as {id: number, name: string}[],
					roles: populatedRoles as {id: number, name: string}[],
				};
				setTools(prevTools => {
					const updatedTools = prevTools.map(t => (t.id === toolId ? updatedTool : t));
					localStorage.setItem('tools', JSON.stringify(updatedTools)); // Update cached tools
					return updatedTools;
				});
			}
		} catch (error) {
			console.error('Грешка при изпращане на актуализацията:', error);
			addToast('Грешка при актуализиране на инструмента.', 'error');
		}
	};

	useEffect(() => {
		const token = localStorage.getItem('auth_token');
		fetchAllData(token);
		return () => {}; // Removed clearInterval(id) as it's no longer needed.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetchAllData]);

	const searchParams = useSearchParams(); // Call useSearchParams in the component body

	useEffect(() => {
		if (searchParams.get('openAddToolModal') === 'true') {
			const timer = setTimeout(() => {
				handleOpenAddModal();
			}, 100); // Small delay to allow page to render

			return () => clearTimeout(timer);
		}
	}, [searchParams, handleOpenAddModal, router]); // Add router to dependencies

	const filteredTools = useMemo(() => {
		return tools.filter(tool => {
			const matchesSearchQuery = searchQuery === '' ||
				tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(tool.description && tool.description.toLowerCase().includes(searchQuery.toLowerCase()));

			const matchesCategory = selectedCategory === '' ||
				(tool.categories && tool.categories.some(cat => cat.id === Number(selectedCategory)));

			const matchesRole = selectedRole === '' ||
				(tool.roles && tool.roles.some(role => role.id === Number(selectedRole)));

			return matchesSearchQuery && matchesCategory && matchesRole;
		});
	}, [tools, searchQuery, selectedCategory, selectedRole]);

	// Fetch user data from localStorage when the component mounts
	useEffect(() => {
		const cachedUser = localStorage.getItem('user');
		if (cachedUser) {
			setUser(JSON.parse(cachedUser));
		}
	}, []);

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
						<Link href="/tools" className="px-3 py-2 font-medium text-sm leading-5 rounded-md text-blue-700 bg-blue-50 focus:outline-none focus:text-blue-800 focus:bg-blue-100 transition duration-150 ease-in-out">AI Инструменти</Link>
					</nav>
				</div>
			</div>

			<div className="p-6 max-w-6xl mx-auto flex flex-col items-stretch justify-start gap-6">
				{/* AI Tools Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-extrabold text-gray-900">AI Инструменти</h1>
						<p className="mt-1 text-gray-600">Открий и сподели AI решения с екипа</p>
					</div>
					<button className="hidden sm:inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-base font-semibold shadow-md"
						style={{ background: 'linear-gradient(90deg,#2563eb,#3b82f6)' }} /* Blue gradient */
						onClick={handleOpenAddModal}> {/* Open modal on click */}
						<span>+ Добави инструмент</span>
					</button>
				</div>

				{/* Search and Filter Bar */}
				<div className="bg-white rounded-2xl shadow-lg p-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
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

				{/* Always visible Add Tool button below filter bar */}
				<div className="w-full flex justify-center md:justify-end block sm:hidden">
					<button className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white text-base font-semibold shadow-md"
						style={{ background: 'linear-gradient(90deg,#2563eb,#3b82f6)' }} /* Blue gradient */
						onClick={handleOpenAddModal}>
						<span>+ Добави инструмент</span>
					</button>
				</div>

				{loading ? (
					<p>Зареждане...</p>
				) : filteredTools.length === 0 ? (
					/* No Tools Found */
					<div className="mt-10 flex flex-col items-center justify-center text-gray-500">
						<span className="text-6xl mb-4">👁️</span>
						<p className="text-xl font-semibold">Няма намерени инструменти</p>
						<p className="mt-2 text-base">Започнете като добавите първия AI инструмент.</p>
						<button className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-base font-semibold shadow-md"
							style={{ background: 'linear-gradient(90deg,#2563eb,#3b82f6)' }} /* Blue gradient */
							onClick={handleOpenAddModal}> {/* Open modal on click */}
							<span>+ Добави инструмент</span>
						</button>
					</div>
				) : (
					<ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
						{filteredTools.map((t) => (
							<li key={t.id} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between border border-gray-200 hover:shadow-xl transition-all duration-200 ease-in-out">
								<div>
									<p className="font-medium text-lg text-gray-900">{t.name}</p>
									<p className="text-sm text-gray-600 mt-2 flex-grow">{t.description}</p>
									<div className="mt-4 flex items-center gap-2 text-xs text-gray-500 flex-wrap">
										{t.categories?.map((c) => (<span key={c.id} className={`px-2 py-0.5 rounded-full ${getCategoryColor(c.id)}`}>{c.name}</span>))}
										{t.roles?.map((r) => (<span key={r.id} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">{r.name}</span>))}
										{t.difficulty && <span className={`px-2 py-0.5 rounded-full ${t.difficulty === 'beginner' ? 'bg-green-100 text-green-800' : t.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{t.difficulty}</span>}
									</div>
								</div>
								<div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
									<div className="flex items-center gap-2">
										<span>{t.user?.name || 'Анонимен'}</span>
										<span>&bull;</span>
										<span>{new Date(t.created_at).toLocaleDateString()}</span>
									</div>
									<div className="flex items-center gap-2">
										<button onClick={() => handleOpenEditModal(t)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Редактирай</button>
										<button onClick={() => removeTool(t.id)} className="text-red-600 hover:text-red-700 text-sm font-medium">Изтрий</button>
									</div>
								</div>
							</li>
						))}
					</ul>
				)}

			</div>
			{/* Add Tool Modal */}
			<AddToolModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				onSave={handleSaveTool}
				categories={categories}
				roles={roles}
				toolToEdit={editTool}
				onUpdateTool={handleUpdateTool}
			/>
		</div>
	);
}


