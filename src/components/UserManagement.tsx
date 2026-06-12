import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy 
} from 'firebase/firestore';
import { db, firebaseConfig } from '../firebase';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { ManagedUser, DashboardPanel } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  ShieldCheck, 
  UserX, 
  Mail, 
  Lock, 
  UserCheck, 
  Eye, 
  EyeOff,
  Search,
  Shield,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import Swal from 'sweetalert2';

interface UserManagementProps {
  theme: 'dark' | 'light';
  setActionError: (msg: string | null) => void;
  setActionSuccess: (msg: string | null) => void;
  panels?: DashboardPanel[];
  activePanelId?: string;
  isSuperAdmin?: boolean;
  viewMode?: 'users' | 'approve';
}

export default function UserManagement({ 
  theme, 
  setActionError, 
  setActionSuccess,
  panels = [],
  activePanelId = 'default',
  isSuperAdmin = false,
  viewMode = 'users'
}: UserManagementProps) {

  const [users, setUsers] = useState<ManagedUser[]>(() => {
    const cached = localStorage.getItem('cached_users_mgmt');
    try {
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    return !localStorage.getItem('cached_users_mgmt');
  });
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [configNotice, setConfigNotice] = useState<string | null>(null);

  // Modal / Form states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('Admin');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive' | 'Pending'>('Active');
  const [formPhone, setFormPhone] = useState('');
  const [formPanelId, setFormPanelId] = useState('default');

  // To toggle password visibility for individual rows
  const [showPlainPasswordId, setShowPlainPasswordId] = useState<string | null>(null);
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Subscribe to real-time updates from Firestore users collection
  useEffect(() => {
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const allUsers = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          // Ensure these fields exist at least as empty strings for display
          photoURL: data.photoURL || '',
          phone: data.phone || '',
          password: data.password || ''
        } as ManagedUser;
      });
      setUsers(allUsers);
      localStorage.setItem('cached_users_mgmt', JSON.stringify(allUsers));
      setLoading(false);
    }, (error) => {
      console.error("User management subscription error:", error);
      setLoading(false);
    });

    return () => unsubscribeUsers();
  }, []);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('Admin');
    setFormStatus('Active');
    setFormPhone('');
    setFormPanelId(activePanelId || 'default');
    setShowFormPassword(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (user: ManagedUser) => {
    if (!isSuperAdmin && (user.role?.toLowerCase() === 'super admin' || user.role?.toLowerCase() === 'superadmin')) {
      setActionError('Only Super Admins can edit Super Admin accounts.');
      return;
    }
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword(user.password || '');
    setFormRole(user.role || 'Admin');
    setFormStatus(user.status || 'Active');
    setFormPhone(user.phone || '');
    setFormPanelId(user.panelId || 'default');
    setShowFormPassword(false);
    setShowModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      setActionError('Please fill out the Name and Email fields.');
      return;
    }
    if (!editingUser && (!formPassword || formPassword.length < 6)) {
      setActionError('Password is required for new users and must be at least 6 characters.');
      return;
    }

    setProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const payload: Partial<ManagedUser> = {
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword,
        campus: '',
        role: formRole,
        status: formStatus,
        permission: 'Full Access',
        phone: formPhone.trim(),
        panelId: formPanelId,
      };

      if (editingUser) {
        await updateDoc(doc(db, 'users', editingUser.id), payload);
        setActionSuccess(`User "${formName}" updated successfully.`);
      } else {
        // Authenticate creation via secondary client app initialization
        let uid = '';
        try {
          const secondaryApp = getApps().find(app => app.name === 'secondary') || initializeApp(firebaseConfig, 'secondary');
          const secondaryAuth = getAuth(secondaryApp);
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formEmail.trim(), formPassword);
          uid = userCredential.user.uid;

          // Set displayName on authentication profile
          await updateProfile(userCredential.user, {
            displayName: formName.trim()
          });

          // Terminate secondary session
          await signOut(secondaryAuth);
        } catch (authErr: any) {
          console.log('Auth accounts save error:', authErr.message);
          if (authErr.code === 'auth/email-already-in-use') {
            throw new Error(`Email "${formEmail}" is already registered in Firebase Authentication.`);
          } else if (authErr.code === 'auth/weak-password') {
            throw new Error(`The password is too weak. Please choose at least 6 characters.`);
          } else if (authErr.code === 'auth/invalid-email') {
            throw new Error(`The email address is invalid.`);
          } else {
            throw new Error(`Firebase Auth Error: ${authErr.message || authErr}`);
          }
        }

        // Successfully created Auth account. Now record into synchronized Firestore users table
        await setDoc(doc(db, 'users', uid), {
          id: uid,
          ...payload,
          createdAt: new Date().toISOString()
        });
        setActionSuccess(`New user "${formName}" created successfully both in Authentication and Database.`);
      }
      setShowModal(false);
    } catch (err: any) {
      console.log('Save user error:', err.message);
      setActionError(`Error saving user: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async (user: ManagedUser) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you really want to delete user "${user.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#1a1a1a',
      confirmButtonText: 'Yes, delete it!',
      background: theme === 'dark' ? '#0d0d0d' : '#fff',
      color: theme === 'dark' ? '#fff' : '#000',
      customClass: {
        popup: 'rounded-2xl border border-gray-800'
      }
    });

    if (result.isConfirmed) {
      setProcessing(true);
      setActionError(null);
      setActionSuccess(null);
      try {
        await deleteDoc(doc(db, 'users', user.id));
        // Also try deleting from pending in case
        try { await deleteDoc(doc(db, 'pending_registrations', user.id)); } catch {}
        
        Swal.fire({
          title: 'Deleted!',
          text: 'User has been removed from the system.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: theme === 'dark' ? '#0d0d0d' : '#fff',
          color: theme === 'dark' ? '#fff' : '#000',
        });
        setActionSuccess(`User "${user.name}" deleted successfully.`);
      } catch (err: any) {
        console.log('Delete user error:', err.message);
        setActionError(`Could not delete user: ${err.message}`);
        Swal.fire('Error!', err.message, 'error');
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleApproveUser = async (user: ManagedUser) => {
    setProcessing(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      // Update status to Active in the users collection
      await updateDoc(doc(db, 'users', user.id), { status: 'Active' });
      setActionSuccess(`User "${user.name}" approved successfully.`);
    } catch (e: any) {
      setActionError(`Error approving user: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateUserField = async (userId: string, field: string, value: string) => {
    setProcessing(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await updateDoc(doc(db, 'users', userId), { [field]: value });
      setActionSuccess(`User updated successfully.`);
    } catch (err: any) {
      console.error("Update field error:", err);
      setActionError(`Update failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // KPI count statistics
  const currentPanelUsers = users.filter(u => {
    if (!u.status || u.status === 'Pending' || u.status === 'pending') return true;
    const isSuperAdminUser = (u.role || '').toLowerCase() === 'super admin' || (u.role || '').toLowerCase() === 'superadmin';
    return isSuperAdminUser || (u.panelId || 'default') === (activePanelId || 'default');
  });


  // Filtered users search box
  const filteredUsers = currentPanelUsers.filter(user => {
    // Tab filter
    const status = user.status ? user.status.trim() : '';
    if (viewMode === 'users' && (!status || status === 'Pending' || status === 'pending')) return false;
    if (viewMode === 'approve' && (status && status !== 'Pending' && status !== 'pending')) return false;

    const term = searchTerm.toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(term) ||
      (user.email || '').toLowerCase().includes(term) ||
      (user.role || '').toLowerCase().includes(term) ||
      (user.phone || '').toLowerCase().includes(term)
    );
  });

  const totalUsersCount = currentPanelUsers.filter(u => u.status && u.status !== 'Pending' && u.status !== 'pending').length;
  const activeUsersCount = currentPanelUsers.filter(u => u.status === 'Active' || u.status === 'active').length;
  const inactiveUsersCount = currentPanelUsers.filter(u => u.status === 'Inactive' || u.status === 'inactive').length;
  const pendingUsersCount = currentPanelUsers.filter(u => !u.status || u.status === 'Pending' || u.status === 'pending').length;
  const adminUsersCount = currentPanelUsers.filter(u => (u.role === 'Admin' || u.role === 'Super Admin') && u.status && u.status !== 'Pending' && u.status !== 'pending').length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Configuration Notice Alert */}
      {configNotice && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-amber-200 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-300">Firebase Setup Recommendation</h4>
            <p className="mt-0.5 text-amber-200/90 font-sans text-xs">
              {configNotice} Please ensure your <code className="font-mono text-white bg-black/40 px-1 py-0.5 rounded text-[11px]">firestore.rules</code> file includes rules authorizing reads and writes for the <code className="font-mono text-white bg-black/40 px-1 py-0.5 rounded text-[11px]">/databases/$(database)/documents/users</code> path, then select "Deploy Firebase" to persist your rules.
            </p>
          </div>
        </div>
      )}

      {/* 1. Statistics Cards Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className={`${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-white border-gray-200 shadow-sm'} border p-5 rounded-2xl flex items-center justify-between`}>
          <div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} font-mono uppercase tracking-wider`}>Total Users</p>
            <h3 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mt-1`}>{totalUsersCount}</h3>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Total System Users</p>
          </div>
          <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-[#161616] border-[#262626] text-amber-500' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className={`${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-white border-gray-200 shadow-sm'} border p-5 rounded-2xl flex items-center justify-between`}>
          <div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} font-mono uppercase tracking-wider`}>Active Users</p>
            <h3 className="text-2xl font-bold tracking-tight text-emerald-500 mt-1">{activeUsersCount}</h3>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Active Staff members</p>
          </div>
          <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-[#161616] border-[#262626] text-emerald-500' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className={`${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-white border-gray-200 shadow-sm'} border p-5 rounded-2xl flex items-center justify-between`}>
          <div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} font-mono uppercase tracking-wider`}>Inactive Users</p>
            <h3 className="text-2xl font-bold tracking-tight text-rose-500 mt-1">{inactiveUsersCount}</h3>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Inactive Suspended accounts</p>
          </div>
          <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-[#161616] border-[#262626] text-rose-500' : 'bg-[#fff5f5] text-rose-600 border-rose-200'}`}>
            <UserX className="w-6 h-6" />
          </div>
        </div>

        <div className={`${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-white border-gray-200 shadow-sm'} border p-5 rounded-2xl flex items-center justify-between`}>
          <div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} font-mono uppercase tracking-wider`}>Pending Users</p>
            <h3 className="text-2xl font-bold tracking-tight text-amber-500 mt-1">{pendingUsersCount}</h3>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Awaiting Approval</p>
          </div>
          <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-[#161616] border-[#262626] text-amber-500' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Main Title Control Panel & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} tracking-tight`}>
              {viewMode === 'approve' ? 'Pending Approval Requests' : 'User Management Panel'}
            </h3>
            {viewMode !== 'approve' && (
              <span className="text-[9px] font-mono uppercase tracking-wider py-0.5 px-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full font-extrabold animate-pulse">
                {panels.find(p => p.id === activePanelId)?.name || 'Main Panel'}
              </span>
            )}
          </div>
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
            {viewMode === 'approve' 
              ? 'Review pending registrations and assign them to an active system panel.'
              : 'View, add, edit, or delete active administrators and access profiles in real-time under the active panel'}
          </p>
        </div>
        {viewMode !== 'approve' && (
          <button
            id="add-user-btn"
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-1.5 px-4.5 py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-amber-500/10 transition-all font-sans shrink-0 uppercase tracking-wide"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Search users by name, email, role, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${
              theme === 'dark' 
                ? 'bg-[#0d0d0d] border-[#1a1a1a] text-white placeholder-gray-600 focus:border-amber-500/50' 
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-amber-500/50 shadow-xs'
            } rounded-xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/35 transition-all outline-none`}
          />
        </div>
      </div>

      {/* 3. Manage User Table */}
      {loading ? (
        <div className={`p-12 text-center border rounded-2xl ${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-white border-gray-200'}`}>
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-gray-550 font-mono">Loading users list...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className={`p-12 text-center text-xs text-gray-500 border border-dashed rounded-2xl ${theme === 'dark' ? 'bg-[#0d0d0d] border-dashed border-[#1a1a1a]' : 'bg-white border-gray-200 shadow-sm'}`}>
          No user records found. Click "Add User" to register a new operator profile.
        </div>
      ) : (
        <div className={`overflow-auto max-h-[380px] rounded-2xl border ${theme === 'dark' ? 'border-[#1a1a1a]/80 bg-[#0d0d0d]' : 'border-gray-200 bg-white shadow-sm'}`}>
          <table className="w-full text-left text-sm font-sans border-collapse">
            <thead>
              <tr className={`${theme === 'dark' ? 'bg-[#060606] text-gray-400 border-b border-[#1a1a1a]' : 'bg-gray-50 text-gray-500 border-b border-gray-200'} text-xs font-mono uppercase tracking-wider`}>
                <th className="py-1 px-1.5 text-center font-bold">SL</th>
                <th className="py-1 px-1.5 text-center font-bold">Photo</th>
                <th className="py-1 px-1.5 text-left">Name</th>
                <th className="py-1 px-1.5 text-left">Email</th>
                <th className="py-1 px-1.5 text-left">Password</th>
                <th className="py-1 px-1.5 text-left">Role</th>
                <th className="py-1 px-1.5 text-center">Status</th>
                <th className="py-1 px-1.5 text-left">Panel</th>
                <th className="py-1 px-1.5 text-left">Phone Number</th>
                <th className="py-1 px-1.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#1a1a1a]/60 text-gray-300' : 'divide-gray-150 text-gray-700'} text-xs`}>
              {filteredUsers.map((user, idx) => (
                <tr key={user.id} className={`${theme === 'dark' ? 'hover:bg-[#161616]/40' : 'hover:bg-gray-50/70'} transition-all`}>
                  <td className="py-0.5 px-1.5 text-center font-mono font-medium text-gray-550">
                    {idx + 1}
                  </td>
                  <td className="py-0.5 px-1.5">
                    <div className="flex items-center justify-center">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover border border-amber-500/30" />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-[#161616] text-gray-500' : 'bg-gray-100 text-gray-400'} border border-dashed border-gray-500/30 font-mono text-[10px]`}>
                          N/A
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-0.5 px-1.5">
                    <div className="font-semibold text-amber-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {user.name}
                    </div>
                  </td>
                  <td className="py-0.5 px-1.5 font-mono text-xs">
                    {user.email}
                  </td>
                  <td className="py-0.5 px-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs tracking-wider bg-black/10 dark:bg-black/30 px-2 py-0.5 rounded leading-none text-gray-400 max-w-[110px] truncate">
                        {showPlainPasswordId === user.id ? (user.password || 'N/A') : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPlainPasswordId(showPlainPasswordId === user.id ? null : user.id)}
                        className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
                        title="Show/Hide Password"
                      >
                        {showPlainPasswordId === user.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="py-0.5 px-1.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      user.role === 'Super Admin'
                        ? 'bg-rose-500/10 text-rose-450 border border-rose-500/15'
                        : user.role === 'Admin'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15'
                        : user.role === 'Editor'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/15'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                    }`}>
                      {user.role || 'User'}
                    </span>
                  </td>
                  <td className="py-0.5 px-1.5 text-center">
                    {viewMode === 'approve' ? (
                      <select
                        value={user.status || 'Pending'}
                        onChange={(e) => handleUpdateUserField(user.id, 'status', e.target.value)}
                        className={`text-[10px] font-bold border rounded-full px-2 py-0.5 outline-none cursor-pointer transition-all ${
                          user.status === 'Active' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : user.status === 'Pending'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        user.status === 'Active' 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                          : user.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : user.status === 'Pending' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                        {user.status || 'Active'}
                      </span>
                    )}
                  </td>
                  <td className="py-0.5 px-1.5">
                    {viewMode === 'approve' ? (
                      <select
                        value={user.panelId || 'default'}
                        onChange={(e) => handleUpdateUserField(user.id, 'panelId', e.target.value)}
                        className={`w-full py-1 text-[10px] font-mono font-bold bg-transparent border-none focus:ring-0 ${theme === 'dark' ? 'text-amber-500' : 'text-amber-600'} cursor-pointer`}
                      >
                        {panels.length > 0 ? (
                          panels.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))
                        ) : (
                          <option value="default">Main Panel</option>
                        )}
                      </select>
                    ) : (
                      <span className={`font-semibold font-mono text-xs ${theme === 'dark' ? 'text-amber-500' : 'text-amber-600'}`}>
                        {panels.find(p => p.id === (user.panelId || 'default'))?.name || 'Main Panel'}
                      </span>
                    )}
                  </td>
                  <td className="py-0.5 px-1.5 font-mono text-xs text-gray-500">
                    {user.phone || 'N/A'}
                  </td>
                  <td className="py-0.5 px-1.5">
                    <div className="flex items-center justify-center gap-1.5">
                      {viewMode === 'approve' && (
                        <button
                          onClick={() => handleApproveUser(user)}
                          className={`p-1.5 rounded-lg border ${
                            theme === 'dark' 
                              ? 'bg-[#161616] border-[#222] hover:bg-emerald-500/15 text-emerald-505' 
                              : 'bg-white border-gray-200 hover:bg-emerald-50 text-emerald-600 shadow-sm'
                          } transition-colors cursor-pointer`}
                          title="Approve user"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {viewMode !== 'approve' && (
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className={`p-1.5 rounded-lg border ${
                            theme === 'dark' 
                              ? 'bg-[#161616] border-[#222] hover:bg-amber-500/15 text-amber-505' 
                              : 'bg-white border-gray-200 hover:bg-amber-50 text-amber-600 shadow-sm'
                          } transition-colors cursor-pointer`}
                          title="Edit user"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className={`p-1.5 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-[#161616] border-[#222] hover:bg-rose-500/15 text-rose-505' 
                            : 'bg-white border-gray-200 hover:bg-rose-50 text-rose-600 shadow-sm'
                        } transition-colors cursor-pointer`}
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Interactive Create/Edit User Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={`${
                theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a] text-white' : 'bg-white border-gray-200 text-gray-900'
              } border rounded-2xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto`}
            >
              <div className={`flex items-center justify-between mb-4 pb-3 border-b ${theme === 'dark' ? 'border-[#1a1a1a]' : 'border-gray-200'}`}>
                <h4 className="text-sm font-bold flex items-center gap-1.5 font-sans uppercase tracking-tight">
                  <Shield className="w-4.5 h-4.5 text-amber-550 animate-pulse" />
                  {editingUser ? 'Edit User Profile' : 'Add New User'}
                </h4>
                <button
                  onClick={() => setShowModal(false)}
                  className={`p-1 px-2.5 ${theme === 'dark' ? 'bg-[#161616] border-[#262626] text-gray-400 hover:text-white' : 'bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-805'} border rounded-lg text-xs transition-colors cursor-pointer`}
                >
                  Close ✕
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4 text-xs font-sans">
                {/* 1. Name Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Full Name *</label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className={`w-full ${
                        theme === 'dark' ? 'bg-[#161616] border-[#262626] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                      } border rounded-xl pl-11 pr-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500`}
                    />
                  </div>
                </div>

                {/* 2. Email Address Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. admin@money-lottery.app"
                      className={`w-full ${
                        theme === 'dark' ? 'bg-[#161616] border-[#262626] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                      } border rounded-xl pl-11 pr-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500`}
                    />
                  </div>
                </div>

                {/* 3. Password Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showFormPassword ? "text" : "password"}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="•••••••• (Min 6 characters)"
                      className={`w-full ${
                        theme === 'dark' ? 'bg-[#161616] border-[#262626] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                      } border rounded-xl pl-11 pr-11 py-3 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 4. Role Combo Selection */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Access Role</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className={`w-full ${
                        theme === 'dark' ? 'bg-[#161616] border-[#262626] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                      } border rounded-xl px-3.5 py-3 focus:outline-none focus:ring-1 focus:ring-amber-500`}
                    >
                      <option value="User">User</option>
                      <option value="Editor">Editor</option>
                      <option value="Admin">Admin</option>
                      <option disabled={!isSuperAdmin} value="Super Admin">Super Admin</option>
                    </select>
                  </div>

                  {/* 5. Status Selection */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">System Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'Active' | 'Inactive' | 'Pending')}
                      className={`w-full ${
                        theme === 'dark' ? 'bg-[#161616] border-[#262626] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                      } border rounded-xl px-3.5 py-3 focus:outline-none focus:ring-1 focus:ring-amber-500`}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

                {/* 7. Phone Number Box */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. 017XXXXXXXX"
                    className={`w-full ${
                      theme === 'dark' ? 'bg-[#161616] border-[#262626] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    } border rounded-xl px-3.5 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500`}
                  />
                </div>

                {/* 8. Panel Selection Assignment */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Assigned Dashboard Panel</label>
                  <select
                    value={formPanelId}
                    onChange={(e) => setFormPanelId(e.target.value)}
                    className={`w-full ${
                      theme === 'dark' ? 'bg-[#161616] border-[#262626] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    } border rounded-xl px-3.5 py-3 focus:outline-none focus:ring-1 focus:ring-amber-500`}
                  >
                    {panels && panels.length > 0 ? (
                      panels.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))
                    ) : (
                      <option value="default">Main Platform Panel</option>
                    )}
                  </select>
                </div>

                {/* Modal actions buttons row */}
                <div className={`pt-4 flex items-center justify-end gap-3 border-t ${theme === 'dark' ? 'border-[#1a1a1a]' : 'border-gray-200'}`}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`px-4 py-2.5 ${theme === 'dark' ? 'bg-[#161616] border-[#262626]' : 'bg-gray-105 border-gray-200'} border text-xs rounded-xl cursor-pointer`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/10 text-black font-sans"
                  >
                    {processing ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
