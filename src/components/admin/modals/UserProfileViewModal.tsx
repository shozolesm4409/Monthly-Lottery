import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Shield, Check, X, Building, Tag } from 'lucide-react';
import { ManagedUser, DashboardPanel, LotteryCampaign } from '../../../types';

interface UserProfileViewModalProps {
  user: ManagedUser;
  onClose: () => void;
  theme: 'dark' | 'light';
  panels: DashboardPanel[];
  campaigns: LotteryCampaign[];
}

export default function UserProfileViewModal({ user, onClose, theme, panels, campaigns }: UserProfileViewModalProps) {
  const isDark = theme === 'dark';

  const assignedPanels = panels.filter(p => user.allowedPanelIds?.includes(p.id));

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`${
          isDark ? 'bg-[#0d0d0d] border-[#1a1a1a] text-white' : 'bg-white border-gray-200 text-gray-900'
        } border rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto`}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-500" />
            {user.name} Profile
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161616] border-[#1a1a1a]' : 'bg-gray-50 border-gray-200'}`}>
                <p className="text-[10px] uppercase text-gray-500">Email</p>
                <p className="text-sm font-semibold">{user.email}</p>
            </div>
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161616] border-[#1a1a1a]' : 'bg-gray-50 border-gray-200'}`}>
                <p className="text-[10px] uppercase text-gray-500">Role</p>
                <p className="text-sm font-semibold">{user.role}</p>
            </div>
        </div>

        <h3 className="text-sm font-bold mb-4">Summary</h3>
        
        <div className="space-y-4">
            {assignedPanels.length > 0 ? assignedPanels.map(panel => {
                const campaignCount = campaigns.filter(c => c.panelId === panel.id && c.selectedUsers?.includes(user.id)).length;
                return (
                    <div key={panel.id} className={`p-4 rounded-xl border ${isDark ? 'border-[#1a1a1a]' : 'border-gray-200'} flex items-center justify-between`}>
                        <div className='flex items-center gap-2'>
                            <Building className='w-4 h-4 text-amber-500' />
                            <span className="text-sm font-medium">{panel.name}</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
                            {campaignCount} Campaign{campaignCount !== 1 ? 's' : ''}
                        </div>
                    </div>
                );
            }) : (
                <p className="text-sm text-gray-500">No panels assigned.</p>
            )}
        </div>
      </motion.div>
    </div>
  );
}
