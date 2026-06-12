import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Activity, 
  Users, 
  User, 
  ShieldCheck, 
  LogOut,
  History,
  Bell,
  Layout,
  Sliders,
  // Picker icons
  Star,
  Award,
  Crown,
  Flame,
  Sparkles,
  Globe,
  Compass,
  Heart,
  Gift,
  Coins,
  Target,
  Zap,
  Smile,
  Briefcase,
  Gamepad,
  Folder,
  Calendar,
  DollarSign,
  Megaphone
} from 'lucide-react';
import { ManagedUser } from '../../types';

import { DashboardPanel } from '../../types';

export const PanelIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  activity: Activity,
  star: Star,
  award: Award,
  crown: Crown,
  flame: Flame,
  sparkles: Sparkles,
  globe: Globe,
  compass: Compass,
  heart: Heart,
  gift: Gift,
  coins: Coins,
  target: Target,
  zap: Zap,
  smile: Smile,
  briefcase: Briefcase,
  gamepad: Gamepad,
  folder: Folder,
  calendar: Calendar,
  dollarsign: DollarSign,
  megaphone: Megaphone,
  layout: Layout,
  sliders: Sliders,
};

interface AdminSidebarProps {
  theme: 'dark' | 'light';
  activeTab: string;
  setActiveTab: (tab: any) => void;
  hasVisibility: (menuKey: 'dashboard' | 'profile' | 'history' | 'users' | 'permissions' | 'achievements' | 'notifications' | 'panels') => boolean;
  user: any;
  handleSignOut: () => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  panels?: DashboardPanel[];
  activePanelId?: string;
  setActivePanelId?: (id: string) => void;
  setShowCreatePanelModal?: (show: boolean) => void;
  isSuperAdmin?: boolean;
  userRole?: string;
  dbUser?: ManagedUser | null;
}

export default function AdminSidebar({
  theme,
  activeTab,
  setActiveTab,
  hasVisibility,
  user,
  handleSignOut,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  panels = [],
  activePanelId = 'default',
  setActivePanelId,
  setShowCreatePanelModal,
  isSuperAdmin = false,
  userRole = 'superadmin',
  dbUser = null
}: AdminSidebarProps) {
  const showIconbar = userRole === 'superadmin';

  const displayName = dbUser?.name || user?.displayName || user?.email?.split('@')[0] || 'User';
  const displayEmail = dbUser?.email || user?.email || '';
  const displayPhoto = dbUser?.photoURL || user?.photoURL || '';

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'U';
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };
  const initials = getInitials(displayName);

  return (
    <>
      {/* 1. SIDEBAR - Desktop Persistent with Integrated Icon bar on Left */}
      <aside className={`${showIconbar ? 'w-80' : 'w-[264px]'} max-lg:hidden fixed inset-y-0 left-0 border-r flex flex-row z-30 transition-all duration-300 ${
        theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a] text-gray-200' : 'bg-white border-gray-200 text-gray-700 shadow-sm'
      }`}>
        {/* LEFT COLUMN: Panel Icon Strip (Covers the red marked area in uploaded graphic) */}
        {showIconbar && (
          <div className={`w-14 shrink-0 flex flex-col items-center justify-between py-4 border-r ${
            theme === 'dark' ? 'bg-[#060606] border-[#161616]' : 'bg-gray-50 border-gray-150'
          }`}>
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Top decorative badge */}
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 font-black text-xs" title="Panel Core Switcher">
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>

            <div className="w-8 h-[1px] bg-gray-250 dark:bg-gray-800 my-0.5" />

            {/* Vertically scrollable list of dashboard panels as visual icon circles */}
            <div className="flex flex-col gap-2.5 w-full items-center overflow-y-auto max-h-[60vh] py-1 [scrollbar-width:none] [-ms-overflow-style:none]">
              {panels.map((p) => {
                const isActive = p.id === activePanelId;
                const initials = p.name ? p.name.slice(0, 2).toUpperCase() : 'P';
                
                // Lookup configured icon or fallback to initials
                const CustomIcon = p.icon ? PanelIconMap[p.icon.toLowerCase()] : null;
                
                return (
                  <div key={p.id} className="relative group flex items-center justify-center w-full">
                    {/* Selected Active side accent bar */}
                    <div className={`absolute left-0 w-1 rounded-r-full transition-all duration-300 ${
                      isActive ? 'h-6 bg-amber-500' : 'h-0 bg-transparent group-hover:h-3 group-hover:bg-amber-500/50'
                    }`} />

                    {/* Circular panel click button */}
                    <button
                      onClick={() => setActivePanelId && setActivePanelId(p.id)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[10px] tracking-tight transition-all duration-300 shadow-xs cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-black rounded-[12px] font-black'
                          : theme === 'dark'
                            ? 'bg-[#151515] text-gray-400 hover:bg-[#202020] hover:text-white hover:rounded-[12px] border border-[#222]'
                            : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:rounded-[12px] border border-gray-200'
                      }`}
                      title={p.name}
                    >
                      {CustomIcon ? (
                        <CustomIcon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-current'}`} />
                      ) : (
                        initials
                      )}
                    </button>

                    {/* Left popover hover tooltip labels */}
                    <div className="absolute left-14 px-2.5 py-1.5 rounded-lg bg-gray-950 text-white text-[9px] font-bold uppercase tracking-wider whitespace-nowrap opacity-0 scale-95 origin-left pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 shadow-xl z-55">
                      {p.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom logout on the Panel Strip for high ergonomics */}
          <div className="relative group">
            <button
              onClick={handleSignOut}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                theme === 'dark' ? 'bg-rose-500/5 hover:bg-rose-500/15 text-rose-450' : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
              }`}
              title="Logout Systems"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
            <div className="absolute left-14 bottom-2 px-2.5 py-1.5 rounded-lg bg-gray-950 text-white text-[9px] font-bold uppercase tracking-wider whitespace-nowrap opacity-0 scale-95 origin-left pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 shadow-xl z-55">
              Logout
            </div>
          </div>
        </div>
        )}

        {/* RIGHT COLUMN: Standard Menu Links List (covers the elements of the central column) */}
        <div className="flex-1 flex flex-col justify-between h-full min-w-0">
          <div className="p-4 space-y-5 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none]">
            {/* Logo Header */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg border border-amber-400/20 shrink-0">
                <Trophy className="w-5 h-5 text-black" />
              </div>
              <div className="min-w-0">
                <h2 className={`font-bold tracking-tight text-xs ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase truncate`}>
                  Monthly Lottery
                </h2>
                <span className="inline-block text-[9px] font-mono py-0.2 px-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/15 rounded-full font-medium">
                  Admin Control
                </span>
              </div>
            </div>

            {/* Primary Action Buttons Menu links block */}
            <nav className="space-y-1">
              {hasVisibility('dashboard') && (
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'campaigns'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
                      : theme === 'dark' ? 'hover:bg-[#161616] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-200'
                  }`}
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  Campaign Control
                </button>
              )}

              {hasVisibility('dashboard') && (
                <button
                  onClick={() => setActiveTab('all_campaigns')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'all_campaigns'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
                      : theme === 'dark' ? 'hover:bg-[#161616] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-200'
                  }`}
                >
                  <Trophy className="w-4 h-4 shrink-0" />
                  Lottery Campaigns
                </button>
              )}

              {hasVisibility('users') && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'users'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
                      : theme === 'dark' ? 'hover:bg-[#161616] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-200'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  User Management
                </button>
              )}

              {hasVisibility('panels') && (
                <button
                  id="tab-panels-management"
                  onClick={() => setActiveTab('panels')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'panels'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10 font-bold'
                      : theme === 'dark' ? 'hover:bg-[#161616] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-200'
                  }`}
                >
                  <Sliders className="w-4 h-4 shrink-0" />
                  Panel Management
                </button>
              )}

              {hasVisibility('profile') && (
                <button
                  id="tab-my-profile"
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'profile'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
                      : theme === 'dark' ? 'hover:bg-[#161616] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-200'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  My Profile
                </button>
              )}

              {hasVisibility('achievements') && (
                <button
                  id="tab-my-achievements"
                  onClick={() => setActiveTab('achievements')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'achievements'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
                      : theme === 'dark' ? 'hover:bg-[#161616] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-200'
                  }`}
                >
                  <Trophy className="w-4 h-4 shrink-0" />
                  My Achievements
                </button>
              )}

              {hasVisibility('notifications') && (
                <button
                  id="tab-notifications"
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'notifications'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
                      : theme === 'dark' ? 'hover:bg-[#161616] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-200'
                  }`}
                >
                  <Bell className="w-4 h-4 shrink-0" />
                  Notifications
                </button>
              )}

              {hasVisibility('permissions') && (
                <button
                  id="tab-role-permissions"
                  onClick={() => setActiveTab('permissions')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'permissions'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
                      : theme === 'dark' ? 'hover:bg-[#161616] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Role Permissions
                </button>
              )}

              {hasVisibility('history') && (
                <button
                  id="tab-draw-history"
                  onClick={() => setActiveTab('history')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'history'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
                      : theme === 'dark' ? 'hover:bg-[#161616] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-200'
                  }`}
                >
                  <History className="w-4 h-4 shrink-0" />
                  Draw History
                </button>
              )}
            </nav>
          </div>

          {/* Footer containing User credentials */}
          <div className={`p-4 border-t ${theme === 'dark' ? 'border-[#1a1a1a] bg-[#060606]' : 'border-gray-200 bg-gray-50'} space-y-3 shrink-0`}>
            {/* User Profile Block */}
            <div className="flex items-center gap-3">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  referrerPolicy="no-referrer"
                  alt="Profile"
                  className="w-10 h-10 rounded-xl object-cover shrink-0 border border-amber-500/20 shadow-xs"
                />
              ) : (
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold tracking-wider shrink-0 shadow-xs ${
                  theme === 'dark' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}>
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold tracking-tight truncate leading-tight ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {displayName}
                </p>
                <p className={`text-xs truncate ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                } font-normal mt-0.5`}>
                  {displayEmail}
                </p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/15 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <div 
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[55] lg:hidden"
            />
            <motion.aside 
              initial={{ x: showIconbar ? -320 : -264 }}
              animate={{ x: 0 }}
              exit={{ x: showIconbar ? -320 : -264 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed inset-y-0 left-0 ${showIconbar ? 'w-80' : 'w-[264px]'} border-r flex flex-row z-[60] lg:hidden shadow-2xl ${
                theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-white border-gray-200'
              }`}
            >
              {/* MOBILE LEFT COLUMN: Panel Icon Strip */}
              {showIconbar && (
                <div className={`w-14 shrink-0 flex flex-col items-center justify-between py-4 border-r ${
                  theme === 'dark' ? 'bg-[#060606] border-[#161616]' : 'bg-gray-50 border-gray-150'
                }`}>
                  <div className="flex flex-col items-center gap-4 w-full">
                    {/* Top decorative badge */}
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 font-black text-xs" title="Panel Core Switcher">
                      <Trophy className="w-4 h-4 text-amber-500" />
                    </div>

                    <div className="w-8 h-[1px] bg-gray-250 dark:bg-gray-800 my-0.5" />

                    {/* Vertically scrollable list of dashboard panels as visual icon circles */}
                    <div className="flex flex-col gap-2.5 w-full items-center overflow-y-auto max-h-[60vh] py-1 [scrollbar-width:none] [-ms-overflow-style:none]">
                      {panels.map((p) => {
                        const isActive = p.id === activePanelId;
                        const initials = p.name ? p.name.slice(0, 2).toUpperCase() : 'P';
                        
                        // Lookup configured icon or fallback to initials
                        const CustomIcon = p.icon ? PanelIconMap[p.icon.toLowerCase()] : null;
                        
                        return (
                          <div key={p.id} className="relative group flex items-center justify-center w-full">
                            {/* Selected Active side accent bar */}
                            <div className={`absolute left-0 w-1 rounded-r-full transition-all duration-300 ${
                              isActive ? 'h-6 bg-amber-500' : 'h-0 bg-transparent'
                            }`} />

                            {/* Circular panel click button */}
                            <button
                              onClick={() => {
                                setActivePanelId && setActivePanelId(p.id);
                                setMobileSidebarOpen(false);
                              }}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[10px] tracking-tight transition-all duration-300 shadow-xs cursor-pointer ${
                                isActive
                                  ? 'bg-amber-500 text-black rounded-[12px] font-black'
                                  : theme === 'dark'
                                    ? 'bg-[#151515] text-gray-400 hover:bg-[#202020] hover:text-white hover:rounded-[12px] border border-[#222]'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:rounded-[12px] border border-gray-200'
                              }`}
                              title={p.name}
                            >
                              {CustomIcon ? (
                                <CustomIcon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-current'}`} />
                              ) : (
                                initials
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile logout bottom icon */}
                  <div className="relative group">
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        theme === 'dark' ? 'bg-rose-50/5 hover:bg-rose-500/15 text-rose-500' : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                      }`}
                      title="Logout"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* MOBILE RIGHT COLUMN: Standard Menu Links */}
              <div className="flex-1 flex flex-col justify-between h-full min-w-0">
                <div className="p-4 space-y-5 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg border border-amber-400/20 shrink-0">
                        <Trophy className="w-5 h-5 text-black" />
                      </div>
                      <div className="min-w-0">
                        <h2 className={`font-bold tracking-tight text-xs ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase truncate`}>
                          Monthly Lottery
                        </h2>
                        <span className="inline-block text-[9px] font-mono py-0.2 px-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/15 rounded-full font-medium">
                          Admin Control
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setMobileSidebarOpen(false)} 
                      className={`p-1 px-2 transition-colors rounded-lg ${theme === 'dark' ? 'text-gray-500 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-black/5'}`}
                    >
                      ✕
                    </button>
                  </div>

                  <nav className="space-y-1 pt-3">
                    {hasVisibility('dashboard') && (
                      <button
                        onClick={() => { setActiveTab('campaigns'); setMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                          activeTab === 'campaigns' ? 'bg-amber-500 text-black' : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Activity className="w-4 h-4 shrink-0" />
                        Campaign Control
                      </button>
                    )}

                    {hasVisibility('dashboard') && (
                      <button
                        onClick={() => { setActiveTab('all_campaigns'); setMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                          activeTab === 'all_campaigns' ? 'bg-amber-500 text-black' : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Trophy className="w-4 h-4 shrink-0" />
                        Lottery Campaigns
                      </button>
                    )}

                    {hasVisibility('users') && (
                      <button
                        onClick={() => { setActiveTab('users'); setMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                          activeTab === 'users' ? 'bg-amber-500 text-black' : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Users className="w-4 h-4 shrink-0" />
                        User Management
                      </button>
                    )}

                    {hasVisibility('panels') && (
                      <button
                        onClick={() => { setActiveTab('panels'); setMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                          activeTab === 'panels' ? 'bg-amber-500 text-black font-bold' : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Sliders className="w-4 h-4 shrink-0" />
                        Panel Management
                      </button>
                    )}

                    {hasVisibility('profile') && (
                      <button
                        onClick={() => { setActiveTab('profile'); setMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                          activeTab === 'profile' ? 'bg-amber-500 text-black' : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <User className="w-4 h-4 shrink-0" />
                        My Profile
                      </button>
                    )}

                    {hasVisibility('achievements') && (
                      <button
                        onClick={() => { setActiveTab('achievements'); setMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                          activeTab === 'achievements' ? 'bg-amber-500 text-black' : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Trophy className="w-4 h-4 shrink-0" />
                        My Achievements
                      </button>
                    )}

                    {hasVisibility('notifications') && (
                      <button
                        onClick={() => { setActiveTab('notifications'); setMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                          activeTab === 'notifications' ? 'bg-amber-500 text-black' : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Bell className="w-4 h-4 shrink-0" />
                        Notifications
                      </button>
                    )}

                    {hasVisibility('permissions') && (
                      <button
                        onClick={() => { setActiveTab('permissions'); setMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                          activeTab === 'permissions' ? 'bg-amber-500 text-black' : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        Role Permissions
                      </button>
                    )}

                    {hasVisibility('history') && (
                      <button
                        onClick={() => { setActiveTab('history'); setMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                          activeTab === 'history' ? 'bg-amber-500 text-black' : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <History className="w-4 h-4 shrink-0" />
                        Draw History
                      </button>
                    )}
                  </nav>
                </div>

                <div className={`p-4 border-t ${theme === 'dark' ? 'border-[#1a1a1a] bg-[#060606]' : 'border-gray-200 bg-gray-50'} space-y-3`}>
                  {/* User Profile Block */}
                  <div className="flex items-center gap-3">
                    {displayPhoto ? (
                      <img
                        src={displayPhoto}
                        referrerPolicy="no-referrer"
                        alt="Profile"
                        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-amber-500/20 shadow-xs"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold tracking-wider shrink-0 shadow-xs ${
                        theme === 'dark' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold tracking-tight truncate leading-tight ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {displayName}
                      </p>
                      <p className={`text-xs truncate ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      } font-normal mt-0.5`}>
                        {displayEmail}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileSidebarOpen(false);
                    }}
                    className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/15 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
