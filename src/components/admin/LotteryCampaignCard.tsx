import React from 'react';
import { Edit2, RotateCcw, Trash2, Play, UserCheck } from 'lucide-react';
import { LotteryCampaign } from '../../types';

interface LotteryCampaignCardProps {
  key?: string;
  camp: LotteryCampaign;
  theme: 'dark' | 'light';
  isUserAdmin: boolean;
  isSuperAdmin?: boolean;
  currentUserId?: string;
  currentUserEmail?: string;
  processing: boolean;
  handleOpenEditModal: (camp: LotteryCampaign) => void;
  handleResetCampaign: (id: string) => void;
  handleDeleteCampaign: (id: string) => void;
  handleDrawWinner: (id: string) => void;
  setRoadmapCampaign: (camp: LotteryCampaign) => void;
  setRecentlyDrawnMonth: (val: number | null) => void;
  setActiveTab: (val: any) => void;
  handleOpenManualEntryModal: (camp: LotteryCampaign) => void;
  handleOpenHistoryWithFilter: (campaignId: string) => void;
}

export default function LotteryCampaignCard({
  camp,
  theme,
  isUserAdmin,
  isSuperAdmin = false,
  currentUserId = '',
  currentUserEmail = '',
  processing,
  handleOpenEditModal,
  handleResetCampaign,
  handleDeleteCampaign,
  handleDrawWinner,
  setRoadmapCampaign,
  setRecentlyDrawnMonth,
  setActiveTab,
  handleOpenManualEntryModal,
  handleOpenHistoryWithFilter
}: LotteryCampaignCardProps) {
  const drawType = camp.drawType || 'Super Admin';
  
  const completedDraws = camp.monthlyDraws?.filter(d => d.status === 'completed') || [];
  let isLatestWinner = false;
  if (completedDraws.length > 0) {
    const latestDraw = completedDraws.reduce((prev, current) => {
      return (Number(prev.monthNumber) > Number(current.monthNumber)) ? prev : current;
    });
    
    isLatestWinner = latestDraw.winnerId === currentUserId || 
                     latestDraw.winnerEmail === currentUserEmail ||
                     latestDraw.winners?.some((w: any) => w.userId === currentUserId || w.userEmail === currentUserEmail) || false;
  }
  
  const isWinner = isLatestWinner || (!completedDraws.length && (camp.winnerEmail === currentUserEmail || camp.winnerTicket === currentUserId));

  let shouldShowDrawButton = false;
  if (drawType === 'Super Admin') {
    shouldShowDrawButton = isSuperAdmin;
  } else if (drawType === 'Admin/Super Admin') {
    shouldShowDrawButton = isSuperAdmin || isUserAdmin;
  } else if (drawType === 'Winner') {
    shouldShowDrawButton = isSuperAdmin || isWinner;
  }
  return (
    <div 
      className={`border rounded-2xl overflow-hidden shadow-md flex flex-col justify-between ${
        camp.status === 'drawn' 
          ? 'border-indigo-500/20 bg-indigo-500/[0.02]' 
          : theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-white border-gray-200 shadow-xs'
      }`}
    >
      {/* Header bar and badges */}
      <div className="p-5 space-y-3 pb-3">
        <div className="flex items-center justify-between gap-2.5">
          <span className={`text-[10px] font-mono font-bold tracking-widest px-2.5 py-1 rounded-full border ${
            camp.status === 'active' 
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/15' 
              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15'
          }`}>
            {camp.status === 'active' ? 'ACTIVE' : 'COMPLETED (DRAWN)'}
          </span>
          
          {isUserAdmin && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenManualEntryModal(camp)}
                className={`p-1.5 border hover:bg-amber-500/10 hover:text-amber-500 text-amber-500/80 rounded-lg transition-colors cursor-pointer ${
                  theme === 'dark' ? 'bg-[#161616] border-[#1a1a1a]' : 'bg-white border-gray-200'
                }`}
                title="Manual Winner Entry"
                disabled={processing}
              >
                <UserCheck className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleOpenEditModal(camp)}
                className={`p-1.5 border hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 rounded-lg transition-colors cursor-pointer ${
                  theme === 'dark' ? 'bg-[#161616] border-[#1a1a1a]' : 'bg-white border-gray-200'
                }`}
                title="Edit campaign"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                id={`reset-camp-${camp.id}`}
                onClick={() => handleResetCampaign(camp.id)}
                className={`p-1.5 border hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 rounded-lg transition-colors cursor-pointer ${
                  theme === 'dark' ? 'bg-[#161616] border-[#1a1a1a]' : 'bg-white border-gray-200'
                }`}
                title="Reset campaign"
                disabled={processing}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                id={`del-camp-${camp.id}`}
                onClick={() => handleDeleteCampaign(camp.id)}
                className={`p-1.5 border hover:bg-rose-500/10 hover:text-rose-500 text-gray-400 rounded-lg transition-colors cursor-pointer ${
                  theme === 'dark' ? 'bg-[#161616] border-[#1a1a1a]' : 'bg-white border-gray-200'
                }`}
                title="Delete campaign"
                disabled={processing}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h4 className={`text-base font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{camp.title}</h4>
          <p className="text-xs text-gray-450 line-clamp-2">{camp.description}</p>
        </div>
      </div>

      {/* Content area: stats */}
      <div className={`px-5 py-2 grid grid-cols-2 gap-x-4 gap-y-4 border-t pt-4 ${theme === 'dark' ? 'border-[#1a1a1a]' : 'border-gray-200'}`}>
        <div>
          <label className="block text-[10px] uppercase font-mono text-gray-500">Monthly Amount</label>
          <div className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{camp.monthlyAmount?.toLocaleString() || 0} ৳</div>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-mono text-gray-500">Monthly Draw Date</label>
          <div className={`text-sm font-bold font-mono ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{camp.monthlyDrawDate || 'N/A'}</div>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-mono text-gray-500">Total Users (Months)</label>
          <div className={`text-sm font-bold ${theme === 'dark' ? 'text-amber-500' : 'text-amber-600'}`}>{camp.totalUsers || 0} ({camp.totalMonths || 0}m)</div>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-mono text-gray-500">Total Amount</label>
          <div className={`text-sm font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{camp.totalAmount?.toLocaleString() || 0} ৳</div>
        </div>
      </div>
      
      {/* Bottom Action bar */}
      <div className={`px-5 py-4 mt-auto border-t ${
        theme === 'dark' ? 'bg-[#0a0a0a]/60 border-[#1a1a1a]' : 'bg-gray-55/80 border-gray-200'
      }`}>
        {(() => {
          const nextDraw = camp.monthlyDraws?.find(d => d.status === 'pending');
          const today = new Date().toISOString().split('T')[0];
          const targetDate = nextDraw?.drawDate || camp.monthlyDrawDate?.split('T')[0] || '';
          const isDrawDisabled = !targetDate || today < targetDate;
          
          return (
            <div className="flex items-center gap-2 w-full">
              {shouldShowDrawButton && (
                <button
                  id={`draw-btn-${camp.id}`}
                  onClick={() => handleDrawWinner(camp.id)}
                  disabled={processing || isDrawDisabled}
                  className={`flex-1 py-2 rounded-xl text-[10px] sm:text-[11px] font-bold font-sans flex items-center justify-center gap-1 transition-all select-none border ${
                    isDrawDisabled
                      ? 'bg-gray-200 text-gray-450 border-gray-300 dark:bg-neutral-900 dark:text-neutral-600 dark:border-neutral-850 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-400 border-amber-600/30 text-black shadow-md cursor-pointer'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  Draw Winner
                </button>
              )}

              <button
                onClick={() => { setRoadmapCampaign(camp); setRecentlyDrawnMonth(null); setActiveTab('roadmap'); }}
                className="flex-1 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold text-amber-500 hover:text-amber-400 border border-amber-500/20 rounded-xl transition-colors hover:bg-amber-500/5 cursor-pointer text-center"
              >
                Roadmap
              </button>
              
              <button
                onClick={() => handleOpenHistoryWithFilter(camp.id)}
                className="flex-1 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold text-blue-500 hover:text-blue-400 border border-blue-500/20 rounded-xl transition-colors hover:bg-blue-500/5 cursor-pointer text-center"
              >
                History
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
