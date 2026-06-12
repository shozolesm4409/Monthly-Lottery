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
import { ManagedUser } from '../types';

interface MyProfileProps {
  theme: 'dark' | 'light';
  setActionError: (msg: string | null) => void;
  setActionSuccess: (msg: string | null) => void;
}

export default function MyProfile({ theme, setActionError, setActionSuccess }: MyProfileProps) {
  const user = auth.currentUser;
  const isDark = theme === 'dark';
  
  // Local profile states
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [copiedUid, setCopiedUid] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [phone, setPhone] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Database record state
  const [dbUser, setDbUser] = useState<ManagedUser | null>(null);
  const [loadingDb, setLoadingDb] = useState(true);

  useEffect(() => {
    async function fetchDbUser() {
      if (!user?.uid) {
        setLoadingDb(false);
        return;
      }
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await (async () => {
           // Fallback attempt if exact ID doesn't work (though it should)
           const q = query(collection(db, 'users'), where('email', '==', user.email));
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
  }, [user?.uid, user?.email]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setActionError('Image size exceeds 2MB limit.');
      return;
    }

    setUploadingImage(true);
    setActionError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const img = new Image();
      img.onload = async () => {
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

        try {
          if (user) {
            // Update Auth Profile
            await updateProfile(user, { photoURL: dataUrl });
            // Update Firestore
            await updateDoc(doc(db, 'users', user.uid), { photoURL: dataUrl });
            
            if (dbUser) {
              setDbUser({ ...dbUser, photoURL: dataUrl });
            }
            setActionSuccess('Profile picture updated successfully.');
          }
        } catch (err: any) {
          console.error(err);
          setActionError('Failed to update profile picture: ' + err.message);
        } finally {
          setUploadingImage(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword.length < 6) {
      setActionError('Password must be at least 6 characters.');
      return;
    }
    setUpdatingPassword(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await updatePassword(user, newPassword);
      await updateDoc(doc(db, 'users', user.uid), { password: newPassword });
      setNewPassword('');
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
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleUpdateProfileData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      if (displayName.trim() !== user.displayName) {
        await updateProfile(user, { displayName: displayName.trim() });
      }

      await updateDoc(doc(db, 'users', user.uid), {
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

  const providerId = user?.providerData[0]?.providerId || 'password';
  const providerLabel = providerId === 'google.com' ? 'Google OAuth 2.0' : 'Email & Password';

  const isTargetAdmin = user?.email === 'shozolesm4409@gmail.com' || user?.email?.includes('admin');
  const userRole = dbUser?.role || (isTargetAdmin ? 'Primary Admin' : 'Staff User');
  const userCampus = dbUser?.campus || 'Dhaka Main Campus';
  const userPhone = dbUser?.phone || 'N/A';
  const userStatus = dbUser?.status || 'Active';

  const avatarInitials = (displayName || user?.email || 'A')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

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
        {/* Background Cover */}
        <div className={`h-32 md:h-40 w-full ${isDark ? 'bg-gradient-to-r from-amber-500/10 via-amber-700/5 to-[#121212]' : 'bg-gradient-to-r from-amber-100 via-amber-50 to-white'} relative`}>
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`absolute top-4 right-4 px-4 py-1.5 rounded-lg border ${
              isDark ? 'bg-black/40 border-white/10 text-white hover:bg-black/60' : 'bg-white/60 border-gray-200 text-gray-800 hover:bg-white/80'
            } backdrop-blur-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer z-20`}
          >
            {isEditMode ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
            {isEditMode ? 'Finish Editing' : 'Edit Profile'}
          </button>
        </div>
        
        <div className="px-4 sm:px-6 pb-6 -mt-16 sm:-mt-20 relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <input 
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
            <div 
              onClick={() => isEditMode && !uploadingImage && fileInputRef.current?.click()}
              className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center shadow-xl border-4 ${isDark ? 'border-[#0a0a0a] bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a]' : 'border-white bg-gradient-to-b from-gray-100 to-gray-200'} text-gray-500 text-3xl font-black tracking-wider select-none shrink-0 uppercase transition-all duration-300 relative overflow-hidden ${isEditMode ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {photoURL || user?.photoURL ? (
                <img 
                  src={photoURL || user?.photoURL || ''} 
                  alt="Profile" 
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover rounded-full ${uploadingImage ? 'opacity-50 blur-sm' : ''}`}
                />
              ) : (
                <span className={isDark ? 'text-gray-300' : 'text-gray-500'}>{avatarInitials}</span>
              )}
              
              {/* edit avatar button on hover - only in edit mode */}
              {isEditMode && (
                <div className={`absolute inset-0 rounded-full bg-black/40 flex items-center justify-center transition-opacity backdrop-blur-sm ${uploadingImage ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {uploadingImage ? (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </div>
              )}
            </div>
            {userStatus === 'Active' && (
               <span className={`absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-6 h-6 rounded-full bg-emerald-500 border-4 ${isDark ? 'border-[#0a0a0a]' : 'border-white'} flex items-center justify-center z-10`} title="Active Status">
                 <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
               </span>
            )}
            {isEditMode && (
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

          <div className="text-center md:text-left space-y-2 flex-1 pt-6 sm:pt-16">
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start -mt-2">
              <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {displayName || 'Administrator Details'}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                {userRole}
              </span>
            </div>

            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium max-w-2xl`}>
              Phone Number: <span className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{userPhone}</span>.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 pt-2 font-mono text-[11px] text-gray-500">
              <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-md border border-gray-200 dark:border-white/10">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 2. LEFT GRID PANEL: Editable profile parameters */}
        <div className="lg:col-span-7 space-y-6">
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`border rounded-3xl p-4 sm:p-5 space-y-4 shadow-md ${
            isDark ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div>
              <h3 className={`text-lg font-bold tracking-tight flex items-center gap-2.5 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <User className="w-5 h-5" />
                </div>
                Personal Information
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>Update your account details and how you appear in the system.</p>
            </div>

            <form onSubmit={handleUpdateProfileData} className="space-y-5 font-sans">
              <div>
                <label className={`block text-xs font-bold mb-2 uppercase font-mono tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Display Name</label>
                <input
                  type="text"
                  required
                  readOnly={!isEditMode}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Insert Display Name"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium ${
                    isDark ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900'
                  } ${!isEditMode && 'opacity-60 cursor-default'}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-2 uppercase font-mono tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Phone Number</label>
                <div className="relative">
                  <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  <input
                    type="tel"
                    readOnly={!isEditMode}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className={`w-full border rounded-xl pl-11 pr-4 py-3 text-sm font-medium ${
                      isDark ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    } ${!isEditMode && 'opacity-60 cursor-default'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-2 uppercase font-mono tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Account Email (Locked)</label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  <input
                    type="email"
                    readOnly
                    disabled
                    value={user?.email || 'N/A'}
                    className={`w-full border rounded-xl pl-11 pr-4 py-3 text-sm select-all font-mono font-medium ${
                      isDark ? 'bg-[#0a0a0a]/50 border-[#1a1a1a] text-gray-500 cursor-not-allowed' : 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> Identity verified and tied to this email.
                </p>
              </div>

              {/* Security ID key copyable component */}
              <div>
                <label className={`block text-xs font-bold mb-2 uppercase font-mono tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Session Key ID (Auth UID)</label>
                <div className="flex gap-2">
                  <div className={`relative flex-1 rounded-xl border flex items-center px-4 py-3 font-mono text-[13px] truncate select-all ${
                    isDark ? 'bg-[#0a0a0a]/50 border-[#1a1a1a] text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-600'
                  }`}>
                    {user?.uid}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUid}
                    className={`w-12 rounded-xl border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                      copiedUid 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
                        : isDark ? 'border-[#2a2a2a] bg-[#1a1a1a] text-gray-400 hover:text-white' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800'
                    }`}
                    title="Copy Auth UID"
                  >
                    {copiedUid ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {isEditMode && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 flex justify-end border-t border-dashed border-gray-200 dark:border-gray-800 mt-6"
                  >
                    <button
                      type="submit"
                      disabled={saving || !displayName.trim()}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Check className="w-4 h-4 font-bold" />
                          Update Profile Info
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.section>

          {/* Password Change Section */}
          {(providerId === 'password' || providerId === 'google.com') && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`border rounded-3xl p-4 sm:p-5 space-y-4 shadow-md ${
              isDark ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div>
                <h3 className={`text-lg font-bold tracking-tight flex items-center gap-2.5 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  Security Settings
                </h3>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>Update your password to keep your account secure.</p>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-5 font-sans">
                <div>
                  <label className={`block text-xs font-bold mb-2 uppercase font-mono tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-medium ${
                      isDark ? 'bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>

                <div className="pt-4 flex justify-end border-t border-dashed border-gray-200 dark:border-gray-800 mt-6">
                  <button
                    type="submit"
                    disabled={updatingPassword || newPassword.length < 6}
                    className="px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingPassword ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.section>
          )}
        </div>

        {/* 3. RIGHT GRID PANEL: Static system role metadata details */}
        <div className="lg:col-span-5 space-y-6">
          
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`border rounded-3xl p-4 sm:p-5 space-y-4 shadow-md ${
            isDark ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div>
              <h3 className={`text-lg font-bold tracking-tight flex items-center gap-2.5 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Shield onClick={() => {}} className="w-5 h-5" />
                </div>
                Role & Permissions
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>Your assigned security clearance</p>
            </div>

            <div className="space-y-4 font-sans text-sm">
              <div className={`p-5 border rounded-2xl flex flex-col gap-4 ${
                isDark ? 'bg-[#0a0a0a] border-[#222]' : 'bg-gray-50 border-gray-200'
              }`}>
                
                <div className="flex items-center justify-between border-b pb-3 border-dashed border-gray-300 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                     <ShieldCheck className="w-4 h-4 text-amber-500" />
                     <span className="text-gray-500 dark:text-gray-400 font-mono text-xs uppercase">Phone</span>
                  </div>
                  <span className={`font-bold text-xs bg-amber-500/10 text-amber-600 dark:text-amber-500 px-2.5 py-1 rounded-lg border border-amber-500/20`}>{userPhone}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Lock className="w-4 h-4 text-gray-400" />
                     <span className="text-gray-500 dark:text-gray-400 font-mono text-xs uppercase">Source</span>
                  </div>
                  <span className={`font-medium text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {loadingDb ? 'Detecting...' : dbUser ? 'Firebase Firestore' : 'OAuth Auto-Provision'}
                  </span>
                </div>
              </div>

              {dbUser && (
                <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-500 dark:text-indigo-400 text-xs leading-relaxed flex gap-2.5 items-start">
                  <ShieldCheck className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span className="font-medium">Your email matches a registered staff document in the system. Full access rights are synchronized with local database credentials.</span>
                </div>
              )}
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`border rounded-3xl p-4 sm:p-5 space-y-4 shadow-md ${
            isDark ? 'bg-[#121212] border-[#222]' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div>
              <h3 className={`text-lg font-bold tracking-tight flex items-center gap-2.5 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Cpu className="w-5 h-5" />
                </div>
                Session Details
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>Current authentication context</p>
            </div>

            <div className="space-y-4 font-sans text-xs pt-1">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-[11px] uppercase tracking-wider">Created</span>
                </div>
                <span className={`font-mono text-[11px] truncate ml-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString() : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-[11px] uppercase tracking-wider">Last Sign In</span>
                </div>
                <span className={`font-mono text-[11px] truncate ml-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2.5 text-gray-500 dark:text-gray-400">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-[11px] uppercase tracking-wider">Provider</span>
                </div>
                <span className="text-emerald-500 font-bold uppercase text-[11px] tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded">
                  {providerLabel}
                </span>
              </div>
            </div>
          </motion.section>



        </div>
      </div>
      
    </div>
  );
}
