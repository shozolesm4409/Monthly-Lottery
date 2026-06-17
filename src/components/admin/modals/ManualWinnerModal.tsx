import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Trophy, Gift, Check, ShieldCheck, HelpCircle, X, RefreshCw } from 'lucide-react';
import { LotteryCampaign, ManagedUser } from '../../../types';

interface ManualWinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: LotteryCampaign;
  availableUsers: ManagedUser[];
  onDrawCompleted: (winners: { id: string; name: string; email: string; prizeAmount: number }[]) => Promise<void>;
  theme?: 'dark' | 'light';
}

export default function ManualWinnerModal({
  isOpen,
  onClose,
  campaign,
  availableUsers,
  onDrawCompleted,
  theme = 'dark'
}: ManualWinnerModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const limit = campaign.winnersPerDraw || 1;

  // Calculate base prize parameters
  const eligibleUserCount = campaign.selectedUsers?.length || 0;
  const basePrize = eligibleUserCount * (campaign.monthlyAmount || 0);
  const prizePerWinner = limit > 0 ? basePrize / limit : basePrize;

  // Determine eligible candidates (participating users who haven't won in this campaign yet)
  const eligibleCandidates = useMemo(() => {
    if (!campaign || !isOpen) return [];

    const alreadyWonIds: string[] = [];
    const draws = campaign.monthlyDraws || [];
    draws.forEach(d => {
      if (d.status === 'completed') {
        if (d.winnerId) {
          d.winnerId.split(',').forEach(id => {
            const trimmed = id.trim();
            if (trimmed && !alreadyWonIds.includes(trimmed)) {
              alreadyWonIds.push(trimmed);
            }
          });
        }
        if (d.winners) {
          d.winners.forEach(w => {
            if (w.id && !alreadyWonIds.includes(w.id)) {
              alreadyWonIds.push(w.id);
            }
          });
        }
      }
    });

    const participantIds = campaign.selectedUsers || [];
    return availableUsers.filter(
      u => participantIds.includes(u.id) && !alreadyWonIds.includes(u.id)
    );
  }, [campaign, isOpen, availableUsers]);

  // Find current round name
  const currentDraw = campaign.monthlyDraws?.find(d => d.status === 'pending');
  const roundName = currentDraw ? `Round #${currentDraw.monthNumber}` : 'Next Round';

  // Selected details
  const selectedDetails = useMemo(() => {
    return availableUsers.filter(u => selectedUserIds.includes(u.id));
  }, [selectedUserIds, availableUsers]);

  // Reset local state on open
  useEffect(() => {
    if (isOpen) {
      setSelectedUserIds([]);
      setSearchTerm('');
      setErrorLocal(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCandidates = eligibleCandidates.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.phone && u.phone.includes(searchTerm))
  );

  const handleToggleSelect = (userId: string) => {
    setErrorLocal(null);
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      if (prev.length >= limit) {
        if (limit === 1) {
          return [userId]; // Replace in single winner mode
        }
        setErrorLocal(`You can select a maximum of ${limit} winner(s).`);
        return prev;
      }
      return [...prev, userId];
    });
  };

  const handleSubmit = async () => {
    if (selectedUserIds.length === 0) {
      setErrorLocal('Please select at least one winner.');
      return;
    }

    if (selectedUserIds.length !== limit && eligibleCandidates.length >= limit) {
      setErrorLocal(`Please select exactly ${limit} winner(s).`);
      return;
    }

    setSubmitting(true);
    setErrorLocal(null);

    try {
      const winnersData = selectedDetails.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        prizeAmount: prizePerWinner
      }));

      await onDrawCompleted(winnersData);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorLocal(err.message || 'Error executing manual draw entry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`relative w-full max-w-lg border rounded-3xl overflow-hidden shadow-2xl flex flex-col ${
            isDark ? 'bg-[#0a0a0a] border-neutral-800 text-white' : 'bg-white border-gray-100 text-gray-900'
          }`}
        >
          {/* Header */}
          <div className={`p-5 pb-4 border-b flex items-center justify-between ${
            isDark ? 'border-neutral-800/80 bg-neutral-900/10' : 'border-gray-100 bg-gray-50/40'
          }`}>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500 animate-bounce-subtle" />
              <div>
                <h3 className="text-sm font-black tracking-tight uppercase font-sans">
                  Manual Winner Entry
                </h3>
                <p className="text-[10px] text-gray-500 font-mono">
                  {campaign.title} &bull; {roundName}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isDark ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-400' : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-500'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-5 space-y-4 max-h-[460px] overflow-y-auto">
            {/* Draw stats overview banner */}
            <div className={`p-4 rounded-2xl flex items-center justify-between gap-4 border ${
              isDark ? 'bg-[#121212]/30 border-amber-500/10' : 'bg-amber-500/[0.02] border-amber-500/15'
            }`}>
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-amber-500 font-mono tracking-wider">Configure Draw Reward</span>
                <p className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Target: <span className="text-amber-500 font-mono font-bold">{limit} winner(s)</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-emerald-500 font-mono tracking-wider">Prize Per Account</span>
                <p className="text-sm font-black text-emerald-500 font-mono">
                  ৳ {prizePerWinner.toLocaleString()} BDT
                </p>
              </div>
            </div>

            {/* Selection instructions */}
            <div className="space-y-1">
              <label className="block text-[11px] uppercase tracking-wider font-extrabold text-gray-400 font-mono flex items-center justify-between">
                <span>Select Candidate(s)</span>
                <span className="text-[10px] text-amber-500 font-bold lowercase normal-case flex items-center gap-1 font-sans">
                  Selected {selectedUserIds.length} of {limit} required
                </span>
              </label>

              {/* Local Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search and filter candidates name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full py-2 pl-9 pr-3 text-xs rounded-xl border focus:outline-none transition-all ${
                    isDark
                      ? 'bg-neutral-900 border-neutral-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white'
                      : 'bg-white border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-gray-800'
                  }`}
                />
              </div>
            </div>

            {/* Error notifications */}
            {errorLocal && (
              <div className="py-2.5 px-3.5 bg-rose-500/10 border border-rose-500/15 rounded-xl text-rose-500 text-[11px] font-semibold">
                {errorLocal}
              </div>
            )}

            {/* Candidates Table List */}
            <div className={`border rounded-2xl overflow-hidden max-h-[220px] overflow-y-auto ${
              isDark ? 'bg-[#0d0d0d]/80 border-neutral-850' : 'bg-gray-50/50 border-gray-150'
            }`}>
              {filteredCandidates.length === 0 ? (
                <div className="py-12 text-center text-gray-500 font-mono text-xs">
                  <Users className="w-8 h-8 opacity-40 mx-auto mb-2" />
                  No available candidates found.
                </div>
              ) : (
                <div className="divide-y divide-neutral-900 dark:divide-neutral-900/40">
                  {filteredCandidates.map((cand) => {
                    const isSelected = selectedUserIds.includes(cand.id);
                    return (
                      <div
                        key={cand.id}
                        onClick={() => handleToggleSelect(cand.id)}
                        className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-amber-500/5 hover:bg-amber-500/10' 
                            : 'hover:bg-neutral-900/10 dark:hover:bg-neutral-900/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Checkbox circle indicator */}
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${
                            isSelected 
                              ? 'bg-amber-500 border-amber-500 text-black' 
                              : isDark ? 'border-neutral-700' : 'border-gray-200'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                          </div>

                          {/* Profile Image/Avatar */}
                          <div className={`w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center border ${
                            isDark ? 'bg-neutral-800 border-neutral-700/60' : 'bg-gray-150 border-gray-200/80'
                          }`}>
                            {cand.photoURL ? (
                              <img 
                                src={cand.photoURL} 
                                alt={cand.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className={`text-[10px] font-black uppercase ${isDark ? 'text-amber-500' : 'text-emerald-600'}`}>
                                {cand.name ? cand.name.slice(0, 2) : 'US'}
                              </span>
                            )}
                          </div>

                          <div>
                            <p className={`text-xs font-bold leading-none ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{cand.name}</p>
                            <p className="text-[10px] text-gray-500 font-mono mt-1">{cand.email}</p>
                          </div>
                        </div>

                        {cand.phone && cand.phone !== 'N/A' && (
                          <div className="text-[10px] font-mono text-gray-400 bg-neutral-900/20 border border-neutral-800/10 dark:border-neutral-800/80 px-2 py-0.5 rounded-lg">
                            {cand.phone}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className={`p-4 border-t flex items-center justify-between gap-4 ${
            isDark ? 'border-neutral-800/80 bg-neutral-950/20' : 'border-gray-100 bg-gray-50/50'
          }`}>
            <span className="text-[10px] text-gray-500 font-semibold font-mono">
              Mode: MANUAL CONFIRMATION
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  isDark
                    ? 'border-neutral-800 text-gray-400 hover:text-white hover:bg-neutral-900'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || selectedUserIds.length === 0}
                className="cursor-pointer px-4.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-xl transition-all font-sans text-black flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Confirm Winners
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
