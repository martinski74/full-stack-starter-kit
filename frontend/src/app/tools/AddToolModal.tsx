
'use client';

import React, { useState, useEffect } from 'react';
import { ApiTool, Option } from './page'; // Import ApiTool and Option types

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (toolData: any) => void;
  categories: Option[];
  roles: Option[];
  toolToEdit: ApiTool | null;
  onUpdateTool: (toolId: number, toolData: any) => void;
}

const AddToolModal: React.FC<AddToolModalProps> = ({ isOpen, onClose, onSave, categories, roles, toolToEdit, onUpdateTool }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [website, setWebsite] = useState('');
  const [documentation, setDocumentation] = useState('');
  const [video, setVideo] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [pricingModel, setPricingModel] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (toolToEdit) {
        setName(toolToEdit.name);
        setDescription(toolToEdit.description || '');
        setCategory(toolToEdit.categories?.[0]?.id.toString() || '');
        setNewCategory('');
        setWebsite(toolToEdit.documentation_url || ''); // Assuming documentation_url is used for website for now
        setDocumentation(toolToEdit.documentation_url || '');
        setVideo(toolToEdit.video_url || '');
        setDifficulty(toolToEdit.difficulty || '');
        // setPricingModel(toolToEdit.pricing_model || ''); // Add this if pricing_model is added to ApiTool type
        // setTags(toolToEdit.tags || []); // Add this if tags is added to ApiTool type
        setSelectedRoles(toolToEdit.roles?.map(role => role.id) || []);
      } else {
        setName('');
        setDescription('');
        setCategory('');
        setNewCategory('');
        setWebsite('');
        setDocumentation('');
        setVideo('');
        setDifficulty('');
        setPricingModel('');
        setTags([]);
        setNewTag('');
        setSelectedRoles([]);
      }
    }
  }, [isOpen, toolToEdit]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleRoleChange = (roleId: number) => {
    setSelectedRoles(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const toolData = {
      name,
      description,
      category_id: category || newCategory ? (category ? Number(category) : newCategory) : null,
      website,
      documentation_url: documentation,
      video_url: video,
      difficulty,
      pricing_model: pricingModel,
      tags,
      role_ids: selectedRoles,
    };

    if (toolToEdit) {
      onUpdateTool(toolToEdit.id, toolData);
    } else {
      onSave(toolData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#514d4d9c] bg-opacity-40 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative p-8 border w-full max-w-2xl md:max-w-3xl shadow-lg rounded-md bg-white">
        <h3 className="text-2xl font-bold mb-4 text-gray-900">{toolToEdit ? 'Редактиране на AI инструмент' : 'Добавяне на нов AI инструмент'}</h3>
        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onClick={onClose}>&times;</button>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Име на инструмента *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                   placeholder="ChatGPT, Midjourney, GitHub Copilot..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Описание *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required
                      placeholder="Кратко описание на инструмента и неговите възможности..." rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Категория</label>
            <div className="mt-1 flex space-x-2">
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900">
                <option value="">Избери категория</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                     placeholder="Нова категория" className="block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900" />
              <button type="button" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">+</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Уебсайт</label>
              <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
                     placeholder="https://..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Документация</label>
              <input type="url" value={documentation} onChange={(e) => setDocumentation(e.target.value)}
                     placeholder="https://..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Видео</label>
              <input type="url" value={video} onChange={(e) => setVideo(e.target.value)}
                     placeholder="https://..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Ниво на трудност</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900">
                <option value="">Начинаещ</option>
                <option value="beginner">Начинаещ</option>
                <option value="intermediate">Средно</option>
                <option value="advanced">Напреднал</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ценови модел</label>
              <select value={pricingModel} onChange={(e) => setPricingModel(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900">
                <option value="">Избери ценови модел</option>
                <option value="free">Безплатен</option>
                <option value="freemium">Freemium</option>
                <option value="paid">Платен</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Тагове</label>
            <div className="mt-1 flex space-x-2">
              <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)}
                     placeholder="Добави таг..." className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900" />
              <button type="button" onClick={handleAddTag} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">+</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 -mr-0.5 h-4 w-4 inline-flex items-center justify-center rounded-full text-indigo-500 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Подходящ за роли</label>
            <div className="mt-2 grid grid-cols-2 gap-y-2 gap-x-4">
              {roles.map(role => (
                <div key={role.id} className="flex items-center">
                  <input id={`role-${role.id}`} type="checkbox" checked={selectedRoles.includes(role.id)} onChange={() => handleRoleChange(role.id)}
                         className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                  <label htmlFor={`role-${role.id}`} className="ml-2 block text-sm text-gray-900">
                    {role.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Отказ</button>
            <button type="submit" className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{toolToEdit ? 'Запази промените' : 'Запази'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToolModal;
