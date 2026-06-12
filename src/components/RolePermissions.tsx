import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Layout, 
  User, 
  Trophy, 
  Bell,
  Users, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface RolePermissionsProps {
  theme: 'dark' | 'light';
  activePanelName?: string;
}

export interface RolePermissionConfig {
  id: string; // 'user' | 'editor' | 'admin' | 'superadmin'
  dashboard: boolean;
  profile: boolean;
  campaigns: boolean;
  users: boolean;
  permissions: boolean;
  history: boolean;
  achievements: boolean;
  notifications: boolean;
  panels: boolean;
}

const DEFAULT_PERMISSIONS: Record<string, Omit<RolePermissionConfig, 'id'>> = {
  user: {
    dashboard: true,
    profile: true,
    campaigns: false,
    users: false,
    permissions: false,
    history: true,
    achievements: true,
    notifications: true,
    panels: false,
  },
  editor: {
    dashboard: true,
    profile: true,
    campaigns: true,
    users: false,
    permissions: false,
    history: true,
    achievements: true,
    notifications: true,
    panels: false,
  },
  admin: {
    dashboard: true,
    profile: true,
    campaigns: true,
    users: true,
    permissions: false,
    history: true,
    achievements: true,
    notifications: true,
    panels: true,
  },
  superadmin: {
    dashboard: true,
    profile: true,
    campaigns: true,
    users: true,
    permissions: true,
    history: true,
    achievements: true,
    notifications: true,
    panels: true,
  },
};

export default function RolePermissions({ theme, activePanelName }: RolePermissionsProps) {
  const [selectedRole, setSelectedRole] = useState<'user' | 'editor' | 'admin' | 'superadmin'>('user');
  const [permissions, setPermissions] = useState<Record<string, RolePermissionConfig>>(() => {
    const cached = localStorage.getItem('cached_role_permissions_comp');
    try {
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });
  const [loading, setLoading] = useState(() => {
    return !localStorage.getItem('cached_role_permissions_comp');
  });
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync role permissions from Firestore
  useEffect(() => {
    const colRef = collection(db, 'role_permissions');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const dataMap: Record<string, RolePermissionConfig> = {};
      snapshot.forEach((snapshotDoc) => {
        dataMap[snapshotDoc.id] = { id: snapshotDoc.id, ...snapshotDoc.data() } as RolePermissionConfig;
      });

      // Fill in defaults if any role configurations are missing from database
      const mergedMap: Record<string, RolePermissionConfig> = {};
      Object.keys(DEFAULT_PERMISSIONS).forEach((roleId) => {
        if (dataMap[roleId]) {
          mergedMap[roleId] = dataMap[roleId];
        } else {
          mergedMap[roleId] = {
            id: roleId,
            ...DEFAULT_PERMISSIONS[roleId],
          };
          // Try to write the default config to Firestore for stability
          setDoc(doc(db, 'role_permissions', roleId), DEFAULT_PERMISSIONS[roleId]).catch((e) => {
            console.warn(`Could not seed default permissions for ${roleId}:`, e);
          });
        }
      });

      setPermissions(mergedMap);
      localStorage.setItem('cached_role_permissions_comp', JSON.stringify(mergedMap));
      setLoading(false);
    }, (error) => {
      console.error('Role Permissions listener failed:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggle = async (menuKey: keyof Omit<RolePermissionConfig, 'id'>) => {
    if (!permissions[selectedRole]) return;
    
    setSaving(true);
    setStatusMsg(null);
    const updatedRolePerm = {
      ...permissions[selectedRole],
      [menuKey]: !permissions[selectedRole][menuKey],
    };

    // Optimistic UI update
    setPermissions((prev) => ({
      ...prev,
      [selectedRole]: updatedRolePerm,
    }));

    try {
      const { id, ...dataToSave } = updatedRolePerm;
      await setDoc(doc(db, 'role_permissions', selectedRole), dataToSave);
      
      setStatusMsg({
        type: 'success',
        text: `Permissions for ${selectedRole.toUpperCase()} successfully updated.`,
      });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error('Error saving permission toggle:', err);
      setStatusMsg({
        type: 'error',
        text: `Failed to save changes: ${err.message || err}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const currentConfig = permissions[selectedRole] || {
    id: selectedRole,
    ...DEFAULT_PERMISSIONS[selectedRole]
  };

  const menuItems = [
    { key: 'dashboard' as const, label: 'Dashboard', desc: 'Allows access to create and manage lottery campaigns.', icon: Layout },
    { key: 'profile' as const, label: 'Profile', desc: 'View and edit profile information.', icon: User },
    { key: 'campaigns' as const, label: 'Lottery Campaigns', desc: 'Allows access to participating lottery view.', icon: Trophy },
    { key: 'achievements' as const, label: 'My Achievements', desc: 'Displays won draw records and rewards history.', icon: Trophy },
    { key: 'notifications' as const, label: 'Notifications', desc: 'Receive real-time alerts about draws and winnings.', icon: Bell },
    { key: 'users' as const, label: 'User Management', desc: 'View, edit and create authorized local system user profiles.', icon: Users },
    { key: 'permissions' as const, label: 'Role Permissions', desc: 'Modify menu visibility scopes and security controls.', icon: ShieldCheck },
    { key: 'history' as const, label: 'Draw History', desc: 'View complete details and logs of all drawn lottery rounds.', icon: Trophy },
    { key: 'panels' as const, label: 'Panel Management', desc: 'Allows full command setup and dynamic routing over custom dashboard panels.', icon: Layout },
  ];

  return (
    <div className="space-y-6 transition-colors duration-300">
      {/* Page Header matching image style */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-emerald-500 font-mono text-[10px] tracking-wider uppercase font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Master Security Hub</span>
        </div>
        <div className="flex items-center gap-3">
          <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-sans`}>
            Role Permissions
          </h2>
          {activePanelName && (
            <span className="text-[9px] font-mono py-0.5 px-2 bg-amber-500/10 text-amber-500 border border-amber-500/15 rounded-full font-extrabold uppercase animate-pulse">
              {activePanelName}
            </span>
          )}
        </div>
      </div>

      {/* Role Selection Tabs with absolute styling matching the image */}
      <div className={`inline-flex p-1 rounded-xl border ${theme === 'dark' ? 'bg-[#121212] border-[#222]' : 'bg-gray-100 border-gray-200'}`}>
        {(['user', 'editor', 'admin', 'superadmin'] as const).map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              selectedRole === role
                ? theme === 'dark'
                  ? 'bg-amber-500 text-black shadow-md font-extrabold'
                  : 'bg-white text-emerald-600 border border-gray-200 shadow-sm font-extrabold'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center font-sans">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-gray-400 font-mono">Loading Security Matrix...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status Alert feedback */}
          <AnimatePresence>
            {statusMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center gap-2 p-3 text-xs rounded-xl border ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/15'
                }`}
              >
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                )}
                <span>{statusMsg.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar Visibility Panel */}
          <div className={`p-4 rounded-2xl border ${
            theme === 'dark' ? 'bg-[#080808] border-[#181818]' : 'bg-gray-50/80 border-gray-150'
          }`}>
            <div className="flex items-center gap-2.5 mb-5 border-b pb-3 border-dashed dark:border-[#1d1d1d] border-gray-200">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/15 text-indigo-400">
                <Layout className="w-4 h-4" />
              </span>
              <div>
                <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Sidebar Visibility
                </h4>
                <p className="text-[10px] text-gray-500 font-sans">Toggle which navigation options are visible to {selectedRole.toUpperCase()} accounts</p>
              </div>
            </div>

            <div className="space-y-3">
              {menuItems.map((item) => {
                const MenuIcon = item.icon;
                const isEnabled = !!currentConfig[item.key];
                return (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 ${
                      theme === 'dark'
                        ? 'bg-[#101010] border-[#1e1e1e] hover:border-[#2a2a2a]'
                        : 'bg-white border-gray-200 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                        isEnabled
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/25'
                          : 'bg-gray-500/5 text-gray-500 border-gray-200/40 dark:border-gray-800/40'
                      }`}>
                        <MenuIcon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className={`text-xs font-bold font-sans ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                          {item.label}
                        </span>
                        <p className="text-[10px] text-gray-400 font-sans">{item.desc}</p>
                      </div>
                    </div>

                    {/* Styled Toggle Switch matching premium look */}
                    <button
                      onClick={() => handleToggle(item.key)}
                      disabled={saving}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-amber-500' : 'bg-gray-300 dark:bg-[#202020]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
