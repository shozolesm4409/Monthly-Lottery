import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { LotteryCampaign } from '../../../types';

interface DeleteConfirmModalProps {
  campaign: LotteryCampaign | null;
  onConfirm: () => void;
  onClose: () => void;
  theme?: 'dark' | 'light';
  processing?: boolean;
}

export default function DeleteConfirmModal({ campaign, onConfirm, onClose, theme, processing }: DeleteConfirmModalProps) {
  if (!campaign) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`border rounded-2xl p-6 w-full max-w-sm shadow-2xl relative ${
            theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a] text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-rose-500/10 text-rose-500">
                <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold font-sans">Delete Campaign?</h4>
          </div>
          
          <p className="text-sm text-gray-400 mb-6">
            Are you sure you want to delete <span className="font-bold text-rose-500">{campaign.title}</span>? This will permanently delete the campaign and all associated tickets. This action cannot be undone.
          </p>
          
          <div className="flex gap-3">
            <button
                onClick={onClose}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold ${
                    theme === 'dark' ? 'bg-[#161616] hover:bg-[#202020] text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
            >
                Cancel
            </button>
            <button
                onClick={onConfirm}
                disabled={processing}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold bg-rose-500 text-white hover:bg-rose-600`}
            >
                {processing ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
