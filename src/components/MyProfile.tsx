import React, { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../firebase';
import { updateProfile, updatePassword } from 'firebase/auth';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc,
  setDoc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Building, 
  Cpu, 
  Calendar, 
  Clock, 
  Copy, 
  Check, 
  Shield, 
  Lock,
  Camera,
  Activity,
  Trophy,
  Edit2,
  Phone
} from 'lucide-react';
import { ManagedUser, DashboardPanel, LotteryCampaign } from '../types';

interface MyProfileProps {
  theme: 'dark' | 'light';
  setActionError: (msg: string | null) => void;
  setActionSuccess: (msg: string | null) => void;
  user?: ManagedUser;
  panels?: DashboardPanel[];
  campaigns?: LotteryCampaign[];
}

export default function MyProfile({ theme, setActionError, setActionSuccess, user: passedUser, panels = [], campaigns = [] }: MyProfileProps) {
  const authUser = auth.currentUser;
  const isDark = theme === 'dark';
  const isImpersonating = !!passedUser;
  
  const [dbUser, setDbUser] = useState<ManagedUser | null>(passedUser || null);
  const [loadingDb, setLoadingDb] = useState(!passedUser);

  const [displayName, setDisplayName] = useState(passedUser?.name || authUser?.displayName || '');
  const [photoURL, setPhotoURL] = useState(passedUser?.photoURL || authUser?.photoURL || '');
  const [phone, setPhone] = useState(passedUser?.phone || '');
  
  const [copiedUid, setCopiedUid] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    async function fetchDbUser() {
      const uid = passedUser?.id || authUser?.uid;
      if (!uid) {
        setLoadingDb(false);
        return;
      }
      try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await (async () => {
           const q = query(collection(db, 'users'), where('email', '==', passedUser?.email || authUser?.email));
           const snap = await getDocs(q);
           return snap.empty ? null : snap.docs[0];
        })();

        if (docSnap) {
          const userData = docSnap.data();
          setDbUser({ id: docSnap.id, ...userData } as ManagedUser);
          if (userData.name) setDisplayName(userData.name);
          if (userData.photoURL) setPhotoURL(userData.photoURL);
          if (userData.phone) setPhone(userData.phone);
        }
      } catch (err) {
        console.log('Error fetching user database profile:', err);
      } finally {
        setLoadingDb(false);
      }
    }
    fetchDbUser();
  }, [passedUser?.id, authUser?.uid, passedUser?.email, authUser?.email]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isImpersonating) return;

    if (file.size > 2 * 1024 * 1024) {
      setActionError('Image size exceeds 2MB limit.');
      return;
    }

    setUploadingImage(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageData;
      });

      const canvas = document.createElement('canvas');
      const MAX_SIZE = 400; 
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPhotoURL(dataUrl);

      if (authUser) {
        let finalUrl = dataUrl;
        try {
          const storageRef = ref(storage, `profile_images/${authUser.uid}.jpg`);
          const uploadTask = uploadString(storageRef, dataUrl, 'data_url');
          await Promise.race([
            uploadTask,
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
          ]);
          finalUrl = await getDownloadURL(storageRef);
        } catch (storageErr) {
          console.warn("Storage upload failed or timeout, using Data URI:", storageErr);
        }

        try {
          await updateProfile(authUser, { photoURL: finalUrl });
        } catch (e) {
          console.warn("Auth update failed (likely too long):", e);
        }

        await setDoc(doc(db, 'users', authUser.uid), { 
          photoURL: finalUrl,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
        
        setActionSuccess('Profile picture updated successfully.');
        setPhotoURL(finalUrl);
      }
    } catch (err: any) {
      console.error("Profile image update error:", err);
      setActionError('Upload failed: ' + (err.message || 'Unknown error'));
      setPhotoURL(authUser?.photoURL || '');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || isImpersonating) return; 

    // Validate current password with database
    if (currentPassword !== dbUser?.password) {
      setActionError('Current password does not match our records.');
      return;
    }

    // Validate new password and confirm password match
    if (newPassword !== confirmPassword) {
      setActionError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setActionError('Password must be at least 6 characters.');
      return;
    }
    setUpdatingPassword(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await updatePassword(authUser, newPassword);
      await updateDoc(doc(db, 'users', authUser.uid), { password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActionSuccess('Password updated successfully.');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
         setActionError('Please sign out and sign in again before changing your password.');
      } else {
         setActionError(`Password change failed: ${err.message}`);
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleCopyUid = () => {
    const uid = passedUser?.id || authUser?.uid;
    if (uid) {
      navigator.clipboard.writeText(uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleUpdateProfileData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isImpersonating) return;
    if (!authUser) return;
    setSaving(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      if (displayName.trim() !== authUser.displayName) {
        await updateProfile(authUser, { displayName: displayName.trim() });
      }

      await updateDoc(doc(db, 'users', authUser.uid), {
        name: displayName.trim(),
        phone: phone.trim()
      });

      if (dbUser) {
        setDbUser({ ...dbUser, name: displayName.trim(), phone: phone.trim() });
      }
      
      setIsEditMode(false);
      setActionSuccess('Profile updated successfully.');
    } catch (err: any) {
      setActionError(`Failed to update profile: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const providerId = authUser?.providerData[0]?.providerId || 'password';
  const providerLabel = providerId === 'google.com' ? 'Google OAuth 2.0' : 'Email & Password';

  const userRole = dbUser?.role || 'User';
  const userPhone = phone || 'N/A';
  const userStatus = dbUser?.status || 'Active';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      
      {/* 1. Header Banner Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-3xl border ${
          isDark 
            ? 'bg-gradient-to-br from-[#121212] via-[#0d0d0d] to-[#0a0a0a] border-[#222]' 
            : 'bg-white border-gray-200'
        } shadow-lg`}
      >
        <div className={`h-24 md:h-32 w-full ${isDark ? 'bg-gradient-to-r from-amber-500/10 via-amber-700/5 to-[#121212]' : 'bg-gradient-to-r from-amber-100 via-amber-50 to-white'} relative`}>
          {!isImpersonating && (
             <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`absolute top-3 right-3 px-3 py-1 rounded-lg border ${
                isDark ? 'bg-black/40 border-white/10 text-white hover:bg-black/60' : 'bg-white/60 border-gray-200 text-gray-800 hover:bg-white/80'
              } backdrop-blur-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer z-20`}
            >
              {isEditMode ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
              {isEditMode ? 'Finish Editing' : 'Edit Profile'}
            </button>
          )}
        </div>
        
        <div className="px-4 sm:px-5 pb-4 -mt-12 sm:-mt-16 relative z-10 flex flex-col md:flex-row items-center gap-4">
          <div className="relative group">
            <input 
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
              disabled={uploadingImage || isImpersonating}
            />
            <div 
              onClick={() => isEditMode && !uploadingImage && !isImpersonating && fileInputRef.current?.click()}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center shadow-md border-4 ${isDark ? 'border-[#0a0a0a] bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a]' : 'border-white bg-gradient-to-b from-gray-100 to-gray-200'} text-gray-500 text-2xl font-black tracking-wider select-none shrink-0 uppercase transition-all duration-300 relative overflow-hidden ${isEditMode && !isImpersonating ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {photoURL || authUser?.photoURL ? (
                <img 
                  src={photoURL || authUser?.photoURL || ''} 
                  alt="Profile" 
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover rounded-full ${uploadingImage ? 'opacity-50 blur-sm' : ''}`}
                />
              ) : (
                <span className={isDark ? 'text-gray-300' : 'text-gray-500'}>{(displayName || 'A').substring(0, 2).toUpperCase()}</span>
              )}
              
              {isEditMode && !isImpersonating && (
                <div className={`absolute inset-0 rounded-full bg-black/40 flex items-center justify-center transition-opacity backdrop-blur-sm ${uploadingImage ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {uploadingImage ? (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </div>
              )}
            </div>
            
            {isEditMode && !isImpersonating && (
              <button 
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
                className={`absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold shadow-md flex items-center gap-1.5 transition-all w-max z-20 ${
                  isDark ? 'bg-[#1a1a1a] text-gray-300 border border-[#333] hover:bg-[#2a2a2a]' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Camera className="w-3 h-3" />
                {uploadingImage ? 'Uploading...' : 'Update Photo'}
              </button>
            )}
          </div>

          <div className="text-center md:text-left space-y-1 flex-1 pt-4 sm:pt-14">
            <div className="flex flex-col sm:flex-row items-center gap-2 justify-center md:justify-start -mt-2">
              <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {displayName}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-widest shadow-sm">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                {userRole}
              </span>
            </div>

            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium max-w-2xl`}>
              Phone Number: <span className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{userPhone}</span>.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 font-mono text-[10px] text-gray-500">
              <span className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10">
                <Mail className="w-3 h-3 shrink-0" />
                {passedUser?.email || authUser?.email}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 sm:px-5">
        
        {/* PERSONAL INFO */}
        <motion.div 
          whileHover={{ y: -1 }}
          transition={{ duration: 0.2 }}
          className={`rounded-2xl border ${isDark ? 'bg-[#0f172a]/60 backdrop-blur-md border-white/5 shadow-xl shadow-black/10' : 'bg-white border-gray-100 shadow-sm'} p-4 relative`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-extrabold tracking-wider uppercase text-amber-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Personal Information
            </h3>
            {!isImpersonating && (
              <button 
                onClick={() => setIsEditMode(!isEditMode)}
                className={`text-[10px] px-2 py-0.5 rounded border font-semibold flex items-center gap-1 transition-all ${
                  isDark 
                    ? 'border-white/10 hover:bg-white/5 text-gray-300' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {isEditMode ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>

          {isEditMode ? (
            <form onSubmit={handleUpdateProfileData} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Display Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input 
                    type="text" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    className={`w-full pl-8 pr-2.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                      isDark 
                        ? 'bg-[#1e293b]/50 border-white/10 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10'
                    }`} 
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className={`w-full pl-8 pr-2.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                      isDark 
                        ? 'bg-[#1e293b]/50 border-white/10 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10'
                    }`} 
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2.5">
              <div className={`p-2.5 rounded-xl flex items-center justify-between border ${isDark ? 'bg-[#1e293b]/20 border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-bold text-gray-500 leading-none mb-0.5">Display Name</span>
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dbUser?.name}</span>
                  </div>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl flex items-center justify-between border ${isDark ? 'bg-[#1e293b]/20 border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-bold text-gray-500 leading-none mb-0.5">Email Address</span>
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dbUser?.email}</span>
                  </div>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl flex items-center justify-between border ${isDark ? 'bg-[#1e293b]/20 border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-bold text-gray-500 leading-none mb-0.5">Phone Contact</span>
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dbUser?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* ROLE & PERMISSIONS */}
        <motion.div 
          whileHover={{ y: -1 }}
          transition={{ duration: 0.2 }}
          className={`rounded-2xl border ${isDark ? 'bg-[#0f172a]/60 backdrop-blur-md border-white/5 shadow-xl shadow-black/10' : 'bg-white border-gray-100 shadow-sm'} p-4`}
        >
          <h3 className="text-xs font-extrabold tracking-wider uppercase text-amber-500 mb-4 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Role & Permissions
          </h3>
          <div className="space-y-2.5">
            <div className={`p-2.5 rounded-xl flex items-center justify-between border ${isDark ? 'bg-[#1e293b]/20 border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block text-[8px] uppercase font-bold text-gray-400 mb-0.5">System Role</span>
                  <span className={`text-xs font-bold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{dbUser?.role}</span>
                </div>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl flex items-center justify-between border ${isDark ? 'bg-[#1e293b]/20 border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div>
                  <span className="block text-[8px] uppercase font-bold text-gray-400 mb-0.5">Account Status</span>
                  <span className={`text-xs font-bold text-emerald-500`}>{dbUser?.status || 'Active'}</span>
                </div>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl flex items-center justify-between border ${isDark ? 'bg-[#1e293b]/20 border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
              <div className="flex items-center gap-2.5 w-full justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-bold text-gray-400 mb-0.5">Auth UID</span>
                    <span className="font-mono text-[10px] text-gray-400 break-all">{passedUser?.id || authUser?.uid}</span>
                  </div>
                </div>
                <button 
                  onClick={handleCopyUid}
                  className={`p-1 rounded-lg border transition-all cursor-pointer shrink-0 ml-2 ${
                    isDark 
                      ? 'border-white/10 hover:bg-white/5 text-gray-450 hover:text-white' 
                      : 'border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-800'
                  }`}
                  title="Copy UID"
                >
                  {copiedUid ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* SECURITY SETTINGS */}
        <motion.div 
          whileHover={{ y: -1 }}
          transition={{ duration: 0.2 }}
          className={`rounded-2xl border ${isDark ? 'bg-[#0f172a]/60 backdrop-blur-md border-white/5 shadow-xl shadow-black/10' : 'bg-white border-gray-100 shadow-sm'} p-4`}
        >
          <h3 className="text-xs font-extrabold tracking-wider uppercase text-amber-500 mb-4 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Security Settings
          </h3>
          {!isImpersonating ? (
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input 
                    type="password" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    placeholder="Enter current password" 
                    className={`w-full pl-8 pr-2.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                      isDark 
                        ? 'bg-[#1e293b]/50 border-white/10 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 placeholder-gray-650' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 placeholder-gray-400'
                    }`} 
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="At least 6 characters" 
                    className={`w-full pl-8 pr-2.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                      isDark 
                        ? 'bg-[#1e293b]/50 border-white/10 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 placeholder-gray-650' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 placeholder-gray-400'
                    }`} 
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm password" 
                    className={`w-full pl-8 pr-2.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                      isDark 
                        ? 'bg-[#1e293b]/50 border-white/10 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 placeholder-gray-650' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 placeholder-gray-400'
                    }`} 
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={updatingPassword} 
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {updatingPassword ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    Reset Password
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className={`p-3 rounded-xl text-center border ${isDark ? 'bg-red-500/5 border-red-500/10 text-red-400/80' : 'bg-red-50 border-red-100 text-red-600'} text-[11px] font-bold`}>
              Password resets are restricted during user impersonation.
            </div>
          )}
        </motion.div>

        {/* SESSION DETAILS */}
        <motion.div 
          whileHover={{ y: -1 }}
          transition={{ duration: 0.2 }}
          className={`rounded-2xl border ${isDark ? 'bg-[#0f172a]/60 backdrop-blur-md border-white/5 shadow-xl shadow-black/10' : 'bg-white border-gray-100 shadow-sm'} p-4`}
        >
          <h3 className="text-xs font-extrabold tracking-wider uppercase text-amber-500 mb-4 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Session Details
          </h3>
          <div className="space-y-2.5">
            <div className={`p-2.5 rounded-xl flex items-center justify-between border ${isDark ? 'bg-[#1e293b]/20 border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block text-[8px] uppercase font-bold text-gray-450 leading-none mb-0.5">Account Created</span>
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {authUser?.metadata.creationTime ? new Date(authUser.metadata.creationTime).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl flex items-center justify-between border ${isDark ? 'bg-[#1e293b]/20 border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block text-[8px] uppercase font-bold text-gray-450 leading-none mb-0.5">Last Sign-In</span>
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {authUser?.metadata.lastSignInTime ? new Date(authUser.metadata.lastSignInTime).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl flex items-center justify-between border ${isDark ? 'bg-[#1e293b]/20 border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block text-[8px] uppercase font-bold text-gray-450 leading-none mb-0.5">Authentication</span>
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{providerLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* PANEL SUMMARY */}
        <motion.div 
          whileHover={{ y: -1 }}
          transition={{ duration: 0.2 }}
          className={`rounded-2xl border ${isDark ? 'bg-[#0f172a]/60 backdrop-blur-md border-white/5 shadow-xl shadow-black/10' : 'bg-white border-gray-100 shadow-sm'} p-4 col-span-1 md:col-span-2`}
        >
          <h3 className="text-xs font-extrabold tracking-wider uppercase text-amber-500 mb-4 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5" />
            Assigned Panels & Campaigns
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dbUser?.allowedPanelIds?.map(panelId => {
              const panel = panels.find(p => p.id === panelId);
              const campaignCount = campaigns.filter(c => c.panelId === panelId && c.selectedUsers?.includes(dbUser.id)).length;
              return (
                <div 
                  key={panelId} 
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isDark 
                      ? 'bg-[#1e293b]/10 border-white/5 hover:border-amber-500/30 hover:bg-[#1e293b]/20' 
                      : 'bg-gray-50 border-gray-100 hover:border-amber-500/30 hover:bg-gray-100/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                      <Building className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{panel?.name || `Panel: ${panelId}`}</span>
                      <span className="block text-[9px] font-semibold text-gray-500">ID: {panelId}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                    {campaignCount} {campaignCount === 1 ? 'Campaign' : 'Campaigns'}
                  </span>
                </div>
              );
            })}
            {(!dbUser?.allowedPanelIds || dbUser.allowedPanelIds.length === 0) && (
              <div className={`col-span-1 sm:col-span-2 p-5 rounded-xl border text-center text-xs font-bold ${isDark ? 'bg-white/5 border-white/5 text-gray-500' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                No active panels have been assigned to this account.
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
