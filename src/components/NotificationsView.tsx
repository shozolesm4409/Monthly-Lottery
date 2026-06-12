import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { AppNotification } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  AlertCircle,
  Inbox
} from 'lucide-react';

interface NotificationsViewProps {
  theme: 'dark' | 'light';
  userEmail: string;
  activePanelId?: string;
  campaigns?: any[];
}

export default function NotificationsView({ 
  theme, 
  userEmail,
  activePanelId = 'default',
  campaigns = []
}: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter notifications by target active panel campaign
  const displayedNotifications = notifications.filter(n => {
    if (!activePanelId || activePanelId === 'default') {
      if (!n.campaignId) return true;
      const campaign = campaigns.find(c => c.id === n.campaignId);
      return !campaign || !campaign.panelId || campaign.panelId === 'default';
    } else {
      if (!n.campaignId) return false;
      const campaign = campaigns.find(c => c.id === n.campaignId);
      return campaign && campaign.panelId === activePanelId;
    }
  });

  useEffect(() => {
    if (!userEmail) return;

    // FIRESTORE INDEX WORKAROUND:
    // We remove the 'orderBy' clause from the Firestore query to avoid requiring 
    // a composite index for 'userId' + 'createdAt'. We instead fetch the latest 
    // notifications and sort them client-side for better performance without 
    // manual index management.
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userEmail),
      limit(100) // Limit to latest 100 to keep client-side sorting fast
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AppNotification);
      });
      
      // Sort client-side to avoid composite index requirement
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setNotifications(list);
      setLoading(false);
    }, (error) => {
      console.error('Notifications listener failed:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userEmail]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-amber-500 font-mono text-[10px] tracking-wider uppercase font-bold mb-1">
            <Bell className="w-4 h-4" />
            <span>Alert Center</span>
          </div>
          <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Notifications
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Stay updated with draw results and winning alerts.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            disabled={displayedNotifications.filter(n => !n.read).length === 0}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
              theme === 'dark' 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20' 
                : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Mark all read
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs text-gray-500 font-mono">Syncing updates...</p>
        </div>
      ) : displayedNotifications.length === 0 ? (
        <div className={`p-16 text-center rounded-[32px] border border-dashed ${
          theme === 'dark' ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="w-16 h-16 rounded-3xl bg-gray-500/5 flex items-center justify-center text-gray-500 mx-auto mb-4">
            <Inbox className="w-8 h-8 opacity-20" />
          </div>
          <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
            Quiet as a library
          </h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 leading-relaxed">
            You don't have any notifications or victory alerts yet on this panel. Keep participating in campaigns!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {displayedNotifications.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-4 rounded-3xl border group relative transition-all duration-300 ${
                  n.read 
                    ? theme === 'dark' ? 'bg-[#080808] border-[#161616] opacity-60' : 'bg-gray-50/50 border-gray-150 opacity-70'
                    : theme === 'dark' ? 'bg-[#0d0d0d] border-[#222] shadow-lg shadow-black/20' : 'bg-white border-gray-200 shadow-sm'
                }`}
                onClick={() => !n.read && markAsRead(n.id)}
              >
                {!n.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                )}
                
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center ${
                    n.type === 'victory' 
                      ? 'bg-amber-500/10 text-amber-500' 
                      : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {n.type === 'victory' ? <Trophy className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  
                  <div className="grow">
                    <div className="flex items-center justify-between gap-2">
                       <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} leading-none`}>
                        {n.title}
                      </h4>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 transition-all text-gray-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <p className={`text-xs mt-1.5 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {n.message}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-gray-500 uppercase tracking-tighter">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(n.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      {n.campaignId && (
                        <div className="px-2 py-0.5 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-[9px] text-indigo-400 font-mono font-bold">
                          CAMPAIGN REF
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
