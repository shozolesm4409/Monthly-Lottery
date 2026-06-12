import React, { useState, useRef } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  AlertCircle,
  Sun,
  Moon,
  User,
  Phone,
  Upload,
  CheckCircle2
} from 'lucide-react';

interface LoginUIProps {
  onSuccess?: () => void;
  theme?: 'dark' | 'light';
  toggleTheme?: () => void;
  externalError?: string | null;
}

export default function LoginUI({ onSuccess, theme = 'dark', toggleTheme, externalError }: LoginUIProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState<File | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(externalError || null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (mode === 'signup') {
      if (!fullName || !email || !password) {
        setError('Please fill in all required fields.');
        return;
      }
      setLoading(true);
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        
        await updateProfile(cred.user, { displayName: fullName });
        
        const userData = {
          id: cred.user.uid,
          name: fullName.trim(),
          email: email.trim(),
          password: password, // Explicitly storing password as requested by user
          phone: '',
          photoURL: '',
          role: 'User',
          permission: 'user',
          status: 'Pending',
          createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', cred.user.uid), userData);

        setSuccessMsg('Registration successful! Your account is pending admin approval.');
        setTimeout(() => {
          onSuccess?.();
        }, 500);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error creating account.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setLoading(true);

    let resolvedEmail = email.trim();

    // If input is not an email (does not contain '@'), resolve it from Firestore users collection
    if (!resolvedEmail.includes('@')) {
      try {
        const usersRef = collection(db, 'users');
        const qByUserId = query(usersRef, where('userId', '==', resolvedEmail));
        const snapByUserId = await getDocs(qByUserId);

        if (!snapByUserId.empty) {
          const matchedDoc = snapByUserId.docs[0].data();
          if (matchedDoc.email) {
            resolvedEmail = matchedDoc.email;
          }
        } else {
          // Attempt match by name as secondary User ID fallback
          const qByName = query(usersRef, where('name', '==', resolvedEmail));
          const snapByName = await getDocs(qByName);
          if (!snapByName.empty) {
            const matchedDoc = snapByName.docs[0].data();
            if (matchedDoc.email) {
              resolvedEmail = matchedDoc.email;
            }
          } else {
            setError(`User ID / Username "${resolvedEmail}" was not found in our directory.`);
            setLoading(false);
            return;
          }
        }
      } catch (dbErr: any) {
        console.error('User ID resolution search error:', dbErr);
        setError('Error connecting to directory server.');
        setLoading(false);
        return;
      }
    }

    try {
      await signInWithEmailAndPassword(auth, resolvedEmail, password);
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      let localizedError = 'An error occurred. Please check your credentials.';
      if (err.code === 'auth/invalid-credential') localizedError = 'Incorrect User ID, Email, or Password.';
      else if (err.code === 'auth/invalid-email') localizedError = 'Please provide a valid email format or existing User ID.';
      
      setError(localizedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#050505] text-[#e0e0e0]' : 'bg-gray-50 text-gray-800'} p-4 relative overflow-hidden select-none transition-colors duration-300`}>
      {/* Theme Toggle Button */}
      <button
        id="theme-toggle-btn"
        type="button"
        onClick={toggleTheme}
        className={`absolute top-6 right-6 p-2 rounded-xl border ${
          theme === 'dark' 
            ? 'border-[#262626] bg-[#0d0d0d] hover:bg-[#161616] text-amber-500 hover:text-amber-400' 
            : 'border-gray-200 bg-white hover:bg-gray-100 text-amber-600 hover:text-amber-700 shadow-sm'
        } transition-all cursor-pointer z-50 flex items-center justify-center`}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Dynamic Background Accents */}
      <div className={`absolute top-0 left-0 w-96 h-96 ${theme === 'dark' ? 'bg-amber-500/5' : 'bg-amber-500/10'} rounded-full blur-3xl -translate-x-12 -translate-y-12`}></div>
      <div className={`absolute bottom-0 right-0 w-96 h-96 ${theme === 'dark' ? 'bg-yellow-500/5' : 'bg-yellow-500/10'} rounded-full blur-3xl translate-x-12 translate-y-12`}></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`w-full ${mode === 'signup' ? 'max-w-[600px]' : 'max-w-[400px]'} ${
          theme === 'dark' 
            ? 'bg-[#0d0d0d] border border-[#222]' 
            : 'bg-white border border-gray-200 shadow-xl'
        } rounded-2xl p-8 backdrop-blur-md relative z-10 flex flex-col transition-all duration-300`}
      >
        {/* Banner with Icon */}
        <div className="flex flex-col items-center justify-center mb-6 text-center">
          <div className={`w-14 h-14 bg-gradient-to-tr ${
            theme === 'dark' 
              ? 'from-amber-500 to-yellow-300 shadow-[0_0_30px_rgba(245,158,11,0.2)]' 
              : 'from-amber-600 to-yellow-400 shadow-[0_0_20px_rgba(217,119,6,0.15)]'
          } rounded-2xl mb-5 flex items-center justify-center rotate-3`}>
            <Sparkles className={`w-7 h-7 ${theme === 'dark' ? 'text-black' : 'text-white'} animate-pulse`} />
          </div>
          <h1 className={`text-xl font-bold font-display ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1.5 tracking-tight`}>
            Lottery Dashboard
          </h1>
          <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} font-mono uppercase tracking-widest`}>
            Secure admin portal
          </p>
        </div>

        {/* Messages */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs p-3.5 rounded-xl mb-5 flex items-start gap-2 overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs p-3.5 rounded-xl mb-5 flex items-start gap-2 overflow-hidden"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className={`block text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-widest mb-1.5 ml-1`}>
                Full Name
              </label>
              <div className="relative">
                <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 ${theme === 'dark' ? 'text-gray-650' : 'text-gray-400'}`} />
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className={`w-full ${
                    theme === 'dark' 
                      ? 'bg-[#161616] border border-[#262626] text-white placeholder-gray-600 focus:border-amber-500/50 focus:ring-amber-500/35' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-405 focus:border-amber-600/50 focus:ring-amber-600/35'
                  } rounded-xl pl-11 pr-4 py-3 text-sm transition-all`}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className={(mode === 'signup' && false) ? "grid grid-cols-2 gap-4" : ""}>
            <div>
              <label className={`block text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-widest mb-1.5 ml-1`}>
                Email Address {mode === 'login' && 'or User ID'}
              </label>
              <div className="relative">
                <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 ${theme === 'dark' ? 'text-gray-650' : 'text-gray-400'}`} />
                <input 
                  id="email-input"
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'login' ? "user_123 or admin@money-lottery.app" : "name@example.com"}
                  className={`w-full ${
                    theme === 'dark' 
                      ? 'bg-[#161616] border border-[#262626] text-white placeholder-gray-600 focus:border-amber-500/50 focus:ring-amber-500/35' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-405 focus:border-amber-600/50 focus:ring-amber-600/35'
                  } rounded-xl pl-11 pr-4 py-3 text-sm transition-all`}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-widest mb-1.5 ml-1`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 ${theme === 'dark' ? 'text-gray-650' : 'text-gray-400'}`} />
                <input 
                  id="password-input"
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full ${
                    theme === 'dark' 
                      ? 'bg-[#161616] border border-[#262626] text-white placeholder-gray-600 focus:border-amber-500/50 focus:ring-amber-500/35' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-405 focus:border-amber-600/50 focus:ring-amber-600/35'
                  } rounded-xl pl-11 pr-11 py-3 text-sm transition-all`}
                  disabled={loading}
                />
                <button 
                  id="toggle-password"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 ${
                    theme === 'dark' 
                      ? 'text-gray-500 hover:text-gray-300' 
                      : 'text-gray-400 hover:text-gray-600'
                  } transition-colors`}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {false && mode === 'signup' && (
            <div>
              <label className={`block text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-widest mb-1.5 ml-1`}>
                Profile Image (Optional)
              </label>
              <div 
                className={`relative flex items-center gap-3 p-3 rounded-xl border-2 border-dashed ${
                  theme === 'dark' ? 'border-[#262626] bg-[#161616]' : 'border-gray-200 bg-gray-50'
                }`}
              >
                {image ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-gray-800">
                    <img 
                      src={URL.createObjectURL(image)} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ) : (
                  <div className={`p-4 rounded-lg flex flex-col items-center justify-center gap-1 ${theme === 'dark' ? 'bg-[#222]' : 'bg-gray-100'} shrink-0`}>
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-gray-400 truncate">
                    {image ? image.name : 'Click to select image...'}
                  </p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImage(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className={`w-full ${
              theme === 'dark' 
                ? 'bg-amber-550 hover:bg-amber-400 active:bg-amber-600 text-black shadow-amber-500/10 hover:shadow-amber-500/20' 
                : 'bg-amber-605 hover:bg-amber-550 active:bg-amber-700 text-black font-semibold shadow-amber-600/15 hover:shadow-amber-600/25'
            } font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg text-xs uppercase tracking-wider`}
          >
            {loading ? (
              <div className={`w-4 h-4 border-2 ${theme === 'dark' ? 'border-black' : 'border-white'} border-t-transparent rounded-full animate-spin`}></div>
            ) : (
              <>
                {mode === 'login' ? 'Authorize Dashboard' : 'Register Account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'} transition-colors`}
          >
            {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
