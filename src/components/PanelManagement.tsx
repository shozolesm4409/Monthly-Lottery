import React, { useState } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sliders, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Layout, 
  Info, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { DashboardPanel } from '../types';
import { PanelIconMap } from './admin/AdminSidebar';

interface PanelManagementProps {
  theme: 'dark' | 'light';
  panels: DashboardPanel[];
  activePanelId: string;
  setActivePanelId: (id: string) => void;
}

const AVAILABLE_ICONS = [
  'trophy',
  'activity',
  'star',
  'award',
  'crown',
  'flame',
  'sparkles',
  'globe',
  'compass',
  'heart',
  'gift',
  'coins',
  'target',
  'zap',
  'smile',
  'briefcase',
  'gamepad',
  'folder',
  'calendar',
  'dollarsign',
  'megaphone',
  'layout',
  'sliders'
];

export default function PanelManagement({
  theme,
  panels,
  activePanelId,
  setActivePanelId
}: PanelManagementProps) {
  const [newPanelName, setNewPanelName] = useState('');
  const [newPanelDesc, setNewPanelDesc] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Edit mode state
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIcon, setEditIcon] = useState('');
  
  // Feedback status
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionProcessing, setActionProcessing] = useState(false);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setStatus({ type, text });
    setTimeout(() => setStatus(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPanelName.trim()) {
      showFeedback('error', 'Panel name cannot be empty.');
      return;
    }
    
    setActionProcessing(true);
    const newId = 'panel-' + Math.random().toString(36).substring(2, 11);
    const panelObj: DashboardPanel = {
      id: newId,
      name: newPanelName.trim(),
      description: newPanelDesc.trim() || 'Custom Dashboard Panel',
      createdAt: new Date().toISOString(),
      icon: selectedIcon || ''
    };

    try {
      await setDoc(doc(db, 'panels', newId), panelObj);
      showFeedback('success', `Panel "${panelObj.name}" created successfully.`);
      setNewPanelName('');
      setNewPanelDesc('');
      setSelectedIcon('');
      setIsCreating(false);
    } catch (err: any) {
      console.error('Error creating panel:', err);
      showFeedback('error', `Failed to create panel: ${err.message || err}`);
    } finally {
      setActionProcessing(false);
    }
  };

  const handleUpdate = async (panelId: string) => {
    if (!editName.trim()) {
      showFeedback('error', 'Panel name cannot be empty.');
      return;
    }

    setActionProcessing(true);
    try {
      const existing = panels.find(p => p.id === panelId);
      const createdAtVal = existing?.createdAt || new Date(2026, 0, 1).toISOString();
      
      const docRef = doc(db, 'panels', panelId);
      await setDoc(docRef, {
        name: editName.trim(),
        description: editDesc.trim(),
        icon: editIcon || '',
        createdAt: createdAtVal
      }, { merge: true });
      showFeedback('success', `Panel updated successfully.`);
      setEditingPanelId(null);
    } catch (err: any) {
      console.error('Error updating panel:', err);
      showFeedback('error', `Failed to update panel: ${err.message || err}`);
    } finally {
      setActionProcessing(false);
    }
  };

  const handleDelete = async (panelId: string, panelName: string) => {
    if (panelId === 'default') {
      showFeedback('error', 'The Main Platform Panel is default and cannot be deleted.');
      return;
    }

    if (!window.confirm(`Are you absolutely sure you want to delete the panel "${panelName}"?`)) {
      return;
    }

    setActionProcessing(true);
    try {
      await deleteDoc(doc(db, 'panels', panelId));
      showFeedback('success', `Panel "${panelName}" has been successfully removed.`);
      if (activePanelId === panelId) {
        setActivePanelId('default');
      }
    } catch (err: any) {
      console.error('Error deleting panel:', err);
      showFeedback('error', `Failed to delete panel: ${err.message || err}`);
    } finally {
      setActionProcessing(false);
    }
  };

  const startEdit = (p: DashboardPanel) => {
    setEditingPanelId(p.id);
    setEditName(p.name);
    setEditDesc(p.description || '');
    setEditIcon(p.icon || '');
  };

  return (
    <div className="space-y-6 transition-colors duration-300">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-amber-500 font-mono text-[10px] tracking-wider uppercase font-bold">
          <Sliders className="w-4 h-4 text-amber-500" />
          <span>Core Infrastructure</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-sans`}>
            Panel Management
          </h2>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isCreating ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {isCreating ? 'Cancel' : 'Create Panel'}
          </button>
        </div>
      </div>

      {/* Operation Feedback */}
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-2.5 p-3 text-xs rounded-xl border ${
              status.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/15'
            }`}
          >
            <span>{status.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create New Panel Form Panel */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreate} className={`p-5 rounded-2xl border space-y-4 ${
              theme === 'dark' ? 'bg-[#080808] border-[#181818]' : 'bg-gray-55/80 border-gray-150'
            }`}>
              <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Create Dashboard Panel
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase text-gray-400 font-sans">Panel Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asia Pacific Sector"
                    value={newPanelName}
                    onChange={(e) => setNewPanelName(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all ${
                      theme === 'dark'
                        ? 'bg-[#121212] border-[#222] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase text-gray-400 font-sans">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Standard layout for targeted users and drawings"
                    value={newPanelDesc}
                    onChange={(e) => setNewPanelDesc(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all ${
                      theme === 'dark'
                        ? 'bg-[#121212] border-[#222] text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                </div>

                {/* ICON PICKER SELECTION CONTAINER */}
                <div className="space-y-1.5 col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-gray-400 font-sans">Select Panel Icon</label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-dashed border-gray-200 dark:border-[#222] bg-gray-50/50 dark:bg-black/20">
                    {/* Option for Text Initials */}
                    <button
                      type="button"
                      onClick={() => setSelectedIcon('')}
                      className={`px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                        selectedIcon === ''
                          ? 'bg-amber-500 text-black border-amber-500 font-black'
                          : theme === 'dark'
                            ? 'bg-[#141414] border-[#252525] text-gray-400 hover:text-white'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Text Initials
                    </button>
                    {AVAILABLE_ICONS.map((iconName) => {
                      const IconComponent = PanelIconMap[iconName];
                      if (!IconComponent) return null;
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setSelectedIcon(iconName)}
                          className={`w-9 h-9 items-center justify-center flex rounded-lg border transition-all cursor-pointer ${
                            selectedIcon === iconName
                              ? 'bg-amber-500 text-black border-amber-500'
                              : theme === 'dark'
                                ? 'bg-[#141414] border-[#252525] text-gray-400 hover:text-white hover:bg-[#1c1c1c]'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                          title={iconName}
                        >
                          <IconComponent className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className={`px-3 py-1.5 text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                    theme === 'dark' ? 'border-[#222] text-gray-400 hover:text-white hover:bg-[#121212]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionProcessing}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl shadow cursor-pointer disabled:opacity-50"
                >
                  Confirm Creation
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panels Lists Layout */}
      <div className={`p-4 rounded-2xl border ${
        theme === 'dark' ? 'bg-[#080808] border-[#181818]' : 'bg-gray-50/80 border-gray-150'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Layout className="w-4 h-4 text-emerald-500 shrink-0" />
          <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Registered Panels ({panels.length})
          </h4>
        </div>

        <div className="space-y-3">
          {panels.map((p) => {
            const isEditing = editingPanelId === p.id;
            const isDefault = p.id === 'default';
            const isActive = p.id === activePanelId;
            const CustomIcon = p.icon ? PanelIconMap[p.icon.toLowerCase()] : null;

            return (
              <div
                key={p.id}
                className={`flex flex-col items-stretch p-3.5 rounded-xl border transition-all duration-300 gap-3 ${
                  isActive 
                    ? theme === 'dark'
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : 'bg-amber-500/5 border-amber-500/20'
                    : theme === 'dark'
                      ? 'bg-[#101010] border-[#1e1e1e] hover:border-[#2a2a2a]'
                      : 'bg-white border-gray-200 hover:bg-gray-50/50'
                }`}
              >
                {isEditing ? (
                  <div className="w-full space-y-3.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400">Panel Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className={`w-full px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold ${
                            theme === 'dark' ? 'bg-[#161616] border-[#222] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                          }`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400">Description</label>
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className={`w-full px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                            theme === 'dark' ? 'bg-[#161616] border-[#222] text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                          }`}
                        />
                      </div>

                      {/* EDIT MODE ICON PICKER SELECTION CONTAINER */}
                      <div className="space-y-1 col-span-1 md:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Select Panel Icon</label>
                        <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-gray-200 dark:border-[#222] bg-[#0c0c0c]/10">
                          {/* Option for Text Initials */}
                          <button
                            type="button"
                            onClick={() => setEditIcon('')}
                            className={`px-2 py-1 rounded text-[10px] font-semibold cursor-pointer transition-all ${
                              editIcon === ''
                                ? 'bg-amber-500 text-black font-bold'
                                : theme === 'dark'
                                  ? 'bg-[#141414] text-gray-400 hover:text-white'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Initials
                          </button>
                          {AVAILABLE_ICONS.map((iconName) => {
                            const IconComponent = PanelIconMap[iconName];
                            if (!IconComponent) return null;
                            return (
                              <button
                                key={iconName}
                                type="button"
                                onClick={() => setEditIcon(iconName)}
                                className={`w-7 h-7 items-center justify-center flex rounded border transition-all cursor-pointer ${
                                  editIcon === iconName
                                    ? 'bg-amber-500 text-black border-amber-500'
                                    : theme === 'dark'
                                      ? 'bg-[#141414] border-[#1e1e1e] text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                                title={iconName}
                              >
                                <IconComponent className="w-3.5 h-3.5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1 border-t border-dashed border-gray-200 dark:border-[#1e1e1e]">
                      <button
                        type="button"
                        onClick={() => setEditingPanelId(null)}
                        className={`p-1 px-2.5 text-[10px] font-bold rounded flex items-center gap-1 border ${
                          theme === 'dark' ? 'border-[#222] text-gray-400 hover:text-white hover:bg-[#121212]' : 'border-gray-200 text-gray-500'
                        }`}
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate(p.id)}
                        className="p-1 px-2.5 text-[10px] bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border uppercase ${
                        isActive
                          ? 'bg-amber-500 text-black border-amber-400'
                          : theme === 'dark'
                            ? 'bg-[#151515] text-amber-500 border-amber-500/15'
                            : 'bg-amber-500/10 text-amber-600 border-amber-400/20'
                      }`}>
                        {CustomIcon ? (
                          <CustomIcon className="w-4 h-4" />
                        ) : (
                          p.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold leading-none ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                            {p.name}
                          </span>
                          {isDefault && (
                            <span className="text-[8px] font-mono py-0.2 px-1 rounded-sm tracking-wider uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 font-bold">
                              Platform default
                            </span>
                          )}
                          {isActive && (
                            <span className="text-[8px] font-mono py-0.2 px-1 rounded-sm tracking-wider uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">
                              Current target
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-lg font-sans">
                          {p.description || 'No custom description provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                      <button
                        onClick={() => setActivePanelId(p.id)}
                        disabled={isActive}
                        className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/15' 
                            : theme === 'dark' ? 'border-[#222] text-gray-400 hover:text-white hover:bg-[#121212]' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {isActive ? 'Active' : 'Select'}
                      </button>
                      <button
                        onClick={() => startEdit(p)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          theme === 'dark' ? 'bg-[#151515] border-[#252525] hover:border-amber-500/20 text-gray-400 hover:text-amber-500' : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-amber-500 hover:bg-gray-100'
                        }`}
                        title="Edit Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={isDefault}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-30 ${
                          theme === 'dark' ? 'bg-[#151515] border-[#252525] hover:border-rose-500/20 text-gray-400 hover:text-rose-500' : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-rose-500 hover:bg-gray-100'
                        }`}
                        title="Remove Panel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
