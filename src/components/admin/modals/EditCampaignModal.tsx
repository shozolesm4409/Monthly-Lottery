import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Layers, Type, MessageSquare, Users2, CalendarDays } from 'lucide-react';
import { ManagedUser, DashboardPanel } from '../../../types';

interface EditCampaignModalProps {
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  theme: 'light' | 'dark';
  handleEditCampaign: (e: React.FormEvent) => void;
  editCampaignTitle: string;
  setEditCampaignTitle: (val: string) => void;
  editCampaignDesc: string;
  setEditCampaignDesc: (val: string) => void;
  isEditUsersDropdownOpen: boolean;
  setIsEditUsersDropdownOpen: (val: boolean) => void;
  editSelectedUsers: string[];
  setEditSelectedUsers: (val: string[]) => void;
  availableUsers: ManagedUser[];
  editMonthlyAmount: number;
  setEditMonthlyAmount: (val: number) => void;
  editMonthlyDrawDate: string;
  setEditMonthlyDrawDate: (val: string) => void;
  editTotalMonths: number;
  setEditTotalMonths: (val: number) => void;
  editWinnersPerDraw: number;
  setEditWinnersPerDraw: (val: number) => void;
  processing: boolean;
  panels?: DashboardPanel[];
  editPanelId?: string;
  setEditPanelId?: (val: string) => void;
  isSuperAdmin?: boolean;
}

export default function EditCampaignModal({
  showEditModal,
  setShowEditModal,
  theme,
  handleEditCampaign,
  editCampaignTitle,
  setEditCampaignTitle,
  editCampaignDesc,
  setEditCampaignDesc,
  isEditUsersDropdownOpen,
  setIsEditUsersDropdownOpen,
  editSelectedUsers,
  setEditSelectedUsers,
  availableUsers,
  editMonthlyAmount,
  setEditMonthlyAmount,
  editMonthlyDrawDate,
  setEditMonthlyDrawDate,
  editTotalMonths,
  setEditTotalMonths,
  editWinnersPerDraw,
  setEditWinnersPerDraw,
  processing,
  panels = [],
  editPanelId = 'default',
  setEditPanelId,
  isSuperAdmin = false,
}: EditCampaignModalProps) {
  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'U';
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };
  const filteredPanelUsers = React.useMemo(() => {
    return availableUsers.filter(u => {
      const userPanel = u.panelId || 'default';
      const targetPanel = editPanelId || 'default';
      const isSuperAdmin = (u.role || '').toLowerCase() === 'super admin' || (u.role || '').toLowerCase() === 'superadmin';
      return u.status === 'Active' && (isSuperAdmin || userPanel === targetPanel);
    });
  }, [availableUsers, editPanelId]);

  React.useEffect(() => {
    const winners = Number(editWinnersPerDraw) || 1;
    if (editSelectedUsers.length > 0 && winners >= 1) {
      const computed = Math.ceil(editSelectedUsers.length / winners);
      setEditTotalMonths(computed);
    }
  }, [editSelectedUsers.length, editWinnersPerDraw, setEditTotalMonths]);

  // Sync edit selected list on panel selection changes to prevent mixed panels
  React.useEffect(() => {
    const validSelected = editSelectedUsers.filter(uid => {
      const user = availableUsers.find(u => u.id === uid);
      if (!user) return false;
      const userPanel = user.panelId || 'default';
      const targetPanel = editPanelId || 'default';
      const isSuperAdmin = (user.role || '').toLowerCase() === 'super admin' || (user.role || '').toLowerCase() === 'superadmin';
      return isSuperAdmin || userPanel === targetPanel;
    });
    if (validSelected.length !== editSelectedUsers.length) {
      setEditSelectedUsers(validSelected);
    }
  }, [editPanelId, availableUsers, editSelectedUsers, setEditSelectedUsers]);

  return (
    <AnimatePresence>
      {showEditModal && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`border rounded-2xl p-3.5 sm:p-4 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto ${
              theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a] text-white' : 'bg-[#F9FAFB] border-gray-100 text-gray-900'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-bold flex items-center gap-1.5 font-sans">
                <Trophy className="w-5 h-5 text-amber-500" />
                Edit Campaign
              </h4>
              <button
                onClick={() => setShowEditModal(false)}
                className={`p-1 px-3 border rounded-full text-xs transition-colors cursor-pointer ${
                  theme === 'dark' ? 'bg-[#161616] hover:bg-[#202020] border-[#262626] text-gray-400 hover:text-white' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900'
                }`}
              >
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="h-1.5 bg-amber-200/60 dark:bg-amber-500/40 rounded-full"></div>
              <div className="h-1.5 bg-amber-100 dark:bg-amber-500/20 rounded-full"></div>
              <div className="h-1.5 bg-amber-100 dark:bg-amber-500/20 rounded-full"></div>
            </div>

            <form onSubmit={handleEditCampaign} className="space-y-4">
              {/* SECTION 1: Top info */}
              <div>
                <h5 className="font-bold font-sans text-sm mb-2.5">Edit Campaign Details</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-3">
                    {panels.length > 0 && (
                      <div>
                        <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1 font-sans flex items-center gap-1">
                          <Layers className="w-3 h-3 text-gray-400" />
                          Target Panel
                        </label>
                        <select
                          disabled={!isSuperAdmin}
                          value={editPanelId}
                          onChange={(e) => setEditPanelId && setEditPanelId(e.target.value)}
                          className={`w-full border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 ${
                            !isSuperAdmin ? 'opacity-60 cursor-not-allowed bg-gray-100/50 dark:bg-[#111]' : 'cursor-pointer'
                          } ${
                            theme === 'dark' ? 'bg-[#161616] border-[#262626] text-amber-500' : 'bg-white border-gray-200 text-gray-900'
                          }`}
                        >
                          {panels.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1 font-sans flex items-center gap-1">
                        <Type className="w-3 h-3 text-gray-400" />
                        Campaign Title
                      </label>
                      <input
                        type="text"
                        required
                        value={editCampaignTitle}
                        onChange={(e) => setEditCampaignTitle(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 ${
                          theme === 'dark' ? 'bg-[#161616] border-[#262626] text-white' : 'bg-white border-gray-200 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1 font-sans flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-gray-400" />
                      Campaign Description
                    </label>
                    <textarea
                      value={editCampaignDesc}
                      onChange={(e) => setEditCampaignDesc(e.target.value)}
                      className={`w-full h-[105px] border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none font-sans ${
                        theme === 'dark' ? 'bg-[#161616] border-[#262626] text-white' : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Select Users & Financials */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-3">
                  <h5 className="font-bold font-sans text-sm">Select Users</h5>
                  <div className="relative">
                    <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1 font-sans">Select Users</label>
                    <button
                      type="button"
                      onClick={() => setIsEditUsersDropdownOpen(!isEditUsersDropdownOpen)}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 flex items-center justify-between text-left ${
                        theme === 'dark' 
                          ? 'bg-[#161616] border-[#262626] text-white' 
                          : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    >
                      <span>
                        {editSelectedUsers.length === 0
                          ? 'Select users...'
                          : `${editSelectedUsers.length} user(s) selected`}
                      </span>
                      <div className="flex items-center gap-2">
                        {editSelectedUsers.length > 0 && (
                          <span 
                            onClick={(e) => { e.stopPropagation(); setEditSelectedUsers([]); }}
                            className="text-gray-400 hover:text-gray-600 font-bold"
                          >
                            ✕
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500 font-mono">
                          {isEditUsersDropdownOpen ? '▲' : '▼'}
                        </span>
                      </div>
                    </button>

                    {isEditUsersDropdownOpen && (
                      <div className={`absolute left-0 right-0 mt-1.5 p-2 rounded-xl border shadow-xl z-20 max-h-52 overflow-y-auto ${
                        theme === 'dark' 
                          ? 'bg-[#121212] border-[#262626] text-white' 
                          : 'bg-white border-gray-200 text-gray-900'
                      }`}>
                        <div className="flex items-center justify-between gap-2 px-2 pb-2 mb-1.5 border-b border-gray-100 dark:border-[#222]">
                          <button
                            type="button"
                            onClick={() => {
                              const activeIds = filteredPanelUsers.map(u => u.id);
                              setEditSelectedUsers(activeIds);
                            }}
                            className="text-[10px] font-bold text-amber-500 hover:text-amber-450 uppercase cursor-pointer"
                          >
                            ✓ Select All
                          </button>
                        </div>
                        {filteredPanelUsers.map(user => (
                          <label key={user.id} className="flex items-center justify-between w-full p-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-xl cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                              {user.photoURL ? (
                                <img
                                  src={user.photoURL}
                                  referrerPolicy="no-referrer"
                                  alt={user.name}
                                  className="w-7 h-7 rounded-full object-cover border border-amber-500/20"
                                />
                              ) : (
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border ${
                                  theme === 'dark' ? 'bg-[#1e1e1e] border-gray-800 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-750'
                                }`}>
                                  {getInitials(user.name || 'User')}
                                </div>
                              )}
                              <span className="text-xs font-medium">{user.name}</span>
                            </div>
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded text-black bg-white border-gray-300"
                              style={{ accentColor: theme === 'dark' ? '#fff' : '#111' }}
                              checked={editSelectedUsers.includes(user.id)}
                              onChange={() => {
                                if (editSelectedUsers.includes(user.id)) {
                                  setEditSelectedUsers(editSelectedUsers.filter(id => id !== user.id));
                                } else {
                                  setEditSelectedUsers([...editSelectedUsers, user.id]);
                                }
                              }}
                            />
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Monthly Amount (from mock's left column duplicate) */}
                  <div>
                    <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1 font-sans">Monthly Amount</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editMonthlyAmount}
                      onChange={(e) => setEditMonthlyAmount(Number(e.target.value))}
                      placeholder="0"
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 ${
                        theme === 'dark' ? 'bg-[#161616] border-[#262626] text-white' : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="font-bold font-sans text-sm">Campaign Finanicals</h5>
                  
                  <div>
                    <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1 font-sans">Monthly Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-gray-500">৳</span>
                      <input
                        type="number"
                        required
                        min="1"
                        value={editMonthlyAmount}
                        onChange={(e) => setEditMonthlyAmount(Number(e.target.value))}
                        placeholder="0"
                        className={`w-full border rounded-xl pl-7 pr-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 ${
                          theme === 'dark' ? 'bg-[#161616] border-[#262626] text-white' : 'bg-white border-gray-200 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1 font-sans flex items-center gap-1">
                      Monthly Draw Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={editMonthlyDrawDate}
                        onChange={(e) => setEditMonthlyDrawDate(e.target.value)}
                        className={`w-full border rounded-xl pr-10 pl-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 [color-scheme:light] dark:[color-scheme:dark] ${
                          theme === 'dark' ? 'bg-[#161616] border-[#262626] text-white' : 'bg-white border-gray-200 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Bottom info block */}
              <div className={`p-3 rounded-xl border grid grid-cols-[1fr_1fr_auto] gap-3 items-end mt-2 ${
                theme === 'dark' ? 'bg-amber-900/10 border-amber-900/40 text-white' : 'bg-[#FFF8F1] border-amber-100 text-gray-900'
              }`}>
                <div>
                  <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1 font-sans">Multi-Winner</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editWinnersPerDraw}
                    onChange={(e) => setEditWinnersPerDraw(Number(e.target.value))}
                    placeholder="1"
                    className={`w-full border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 ${
                      theme === 'dark' ? 'bg-[#161616] border-[#262626] text-white' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1 font-sans">Total Months</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editTotalMonths}
                    onChange={(e) => setEditTotalMonths(Number(e.target.value))}
                    placeholder="e.g. 12"
                    className={`w-full border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 ${
                      theme === 'dark' ? 'bg-[#161616] border-[#262626] text-white' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
                <div className="flex flex-col text-right pb-1">
                  <span className="text-[11px] text-gray-800 dark:text-gray-300 font-sans font-medium">Monthly Total:</span>
                  <span className="text-xl font-bold text-[#F59E0B]">
                    {editSelectedUsers.length * editMonthlyAmount} ৳
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 cursor-pointer shadow-md"
              >
                {processing ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
