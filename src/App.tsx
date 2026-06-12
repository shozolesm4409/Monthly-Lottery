import { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import LoginUI from './components/LoginUI';
import AdminDashboard from './components/AdminDashboard';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  useEffect(() => {
    // Dynamically listen for authentication changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setPendingError(null);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#050505] text-gray-200' : 'bg-gray-50 text-gray-900'} flex flex-col items-center justify-center p-4 transition-colors duration-300`}>
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <div className="absolute">
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
          </div>
        </div>
        <p className={`mt-4 text-xs font-mono tracking-widest uppercase ${theme === 'dark' ? 'text-gray-550' : 'text-gray-400'}`}>
          Initializing Security Systems...
        </p>
      </div>
    );
  }

  // Choose display view based on session authenticity
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-[#050505] text-[#e0e0e0]' : 'bg-gray-50 text-gray-800'} font-sans antialiased`}>
      {!user ? (
        <LoginUI onSuccess={() => {}} theme={theme} toggleTheme={toggleTheme} externalError={pendingError} />
      ) : (
        <AdminDashboard theme={theme} toggleTheme={toggleTheme} />
      )}
    </div>
  );
}
