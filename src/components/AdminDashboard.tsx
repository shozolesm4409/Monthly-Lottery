import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  orderBy,
  where,
  getDocs,
  arrayUnion,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError } from '../firebase';
import { LotteryCampaign, RaffleTicket, OperationType, ManagedUser, DashboardPanel } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { showSuccessAlert, showErrorAlert } from '../utils/alerts';
import UserManagement from './UserManagement';
import MyProfile from './MyProfile';
import RolePermissions from './RolePermissions';
import PanelManagement from './PanelManagement';
import AdminSidebar, { PanelIconMap } from './admin/AdminSidebar';
import NotificationsView from './NotificationsView';
import LotteryCampaignCard from './admin/LotteryCampaignCard';
import RoadmapView from './admin/RoadmapView';
import DrawHistory from './admin/DrawHistory';
import CreateCampaignModal from './admin/modals/CreateCampaignModal';
import EditCampaignModal from './admin/modals/EditCampaignModal';
import DeleteConfirmModal from './admin/modals/DeleteConfirmModal';
import SpinWheelModal from './admin/modals/SpinWheelModal';
import { 
  Trophy, 
  Ticket, 
  Users, 
  Plus, 
  LogOut, 
  Activity, 
  DollarSign, 
  Cpu, 
  CheckCircle2, 
  Calendar, 
  Trash2, 
  AlertTriangle,
  Play,
  RotateCcw,
  Check,
  ShieldCheck,
  Menu,
  Sun,
  Moon,
  User,
  Edit2,
  History,
  Bell
} from 'lucide-react';

interface AdminDashboardProps {
  theme?: 'dark' | 'light';
  toggleTheme?: () => void;
}

export default function AdminDashboard({ theme = 'dark', toggleTheme }: AdminDashboardProps) {
  const [campaigns, setCampaigns] = useState<LotteryCampaign[]>(() => {
    const cached = localStorage.getItem('cached_lotteries');
    try {
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [tickets, setTickets] = useState<RaffleTicket[]>(() => {
    const cached = localStorage.getItem('cached_tickets');
    try {
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loadingCampaigns, setLoadingCampaigns] = useState(() => {
    return !localStorage.getItem('cached_lotteries');
  });
  const [loadingTickets, setLoadingTickets] = useState(() => {
    return !localStorage.getItem('cached_tickets');
  });

  // Panel States
  const [panels, setPanels] = useState<DashboardPanel[]>([]);
  const [activePanelId, setActivePanelId] = useState<string>(() => {
    return localStorage.getItem('active_panel_id') || 'default';
  });
  const [campaignPanelId, setCampaignPanelId] = useState<string>('default');
  const [editPanelId, setEditPanelId] = useState<string>('default');
  const [showCreatePanelModal, setShowCreatePanelModal] = useState(false);
  const [newPanelName, setNewPanelName] = useState('');
  const [newPanelDesc, setNewPanelDesc] = useState('');
  const [newPanelIcon, setNewPanelIcon] = useState('');

  useEffect(() => {
    localStorage.setItem('active_panel_id', activePanelId);
    setCampaignPanelId(activePanelId);
  }, [activePanelId]);

  // Form states for creating a new Campaign
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignDesc, setCampaignDesc] = useState('');
  const [totalMonthsInput, setTotalMonthsInput] = useState<string>('');
  const [newWinnersPerDraw, setNewWinnersPerDraw] = useState<string>('1');
  
  // Real active users for multi-checkbox dropdown
  const [availableUsers, setAvailableUsers] = useState<ManagedUser[]>(() => {
    const cached = localStorage.getItem('cached_users');
    try {
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [selectedCampaignUsers, setSelectedCampaignUsers] = useState<string[]>([]);
  const [monthlyAmount, setMonthlyAmount] = useState<number>(0);
  const [monthlyDrawDate, setMonthlyDrawDate] = useState<string>('');
  const [isUsersDropdownOpen, setIsUsersDropdownOpen] = useState(false);

  // Form states for buying/simulating ticket purchase
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [simulatedCountValue, setSimulatedCountValue] = useState(1);

  // Selected Campaign for details modal or filter
  const [activeFilterId, setActiveFilterId] = useState<string>('all');
  const [actionError, setActionErrorState] = useState<string | null>(null);
  const [actionSuccess, setActionSuccessState] = useState<string | null>(null);

  const setActionError = (msg: string | null) => {
    setActionErrorState(msg);
    if (msg) {
      showErrorAlert(msg, theme === 'dark');
    }
  };

  const setActionSuccess = (msg: string | null) => {
    setActionSuccessState(msg);
    if (msg) {
      showSuccessAlert(msg, theme === 'dark');
    }
  };

  const [processing, setProcessing] = useState(false);

  // Edit Campaign States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCampaignId, setEditCampaignId] = useState<string>('');
  const [editCampaignTitle, setEditCampaignTitle] = useState('');
  const [editCampaignDesc, setEditCampaignDesc] = useState('');
  const [editSelectedUsers, setEditSelectedUsers] = useState<string[]>([]);
  const [editMonthlyAmount, setEditMonthlyAmount] = useState<number>(0);
  const [editMonthlyDrawDate, setEditMonthlyDrawDate] = useState<string>('');
  const [editTotalMonths, setEditTotalMonths] = useState<number>(0);
  const [editWinnersPerDraw, setEditWinnersPerDraw] = useState<number>(1);
  const [isEditUsersDropdownOpen, setIsEditUsersDropdownOpen] = useState(false);

  // Roadmap States
  const [roadmapCampaign, setRoadmapCampaign] = useState<LotteryCampaign | null>(null);
  const [deleteCampaign, setDeleteCampaign] = useState<LotteryCampaign | null>(null);

  // Layout and Sidebar active view
  const [activeTab, setActiveTab] = useState<'campaigns' | 'users' | 'approve' | 'tickets' | 'profile' | 'permissions' | 'all_campaigns' | 'roadmap' | 'history' | 'spin_wheel' | 'achievements' | 'notifications'>('campaigns');
  const [recentlyDrawnMonth, setRecentlyDrawnMonth] = useState<number | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showSpinWheelModal, setShowSpinWheelModal] = useState(false);
  const [spinCampaignTarget, setSpinCampaignTarget] = useState<LotteryCampaign | null>(null);

  const mainScrollRef = useRef<HTMLElement | null>(null);

  // Scroll to top whenever tab changes
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Fetch campaigns
  useEffect(() => {
    const q = query(
      collection(db, 'lotteries'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: LotteryCampaign[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as LotteryCampaign);
      });
      setCampaigns(list);
      localStorage.setItem('cached_lotteries', JSON.stringify(list));
      setLoadingCampaigns(false);
    }, (error) => {
      setLoadingCampaigns(false);
      console.log('Lottery subscription status:', error.message);
    });

    return () => unsubscribe();
  }, []);

  // Fetch panels
  useEffect(() => {
    const q = query(collection(db, 'panels'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DashboardPanel[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as DashboardPanel);
      });
      
      const defaultFound = list.some(p => p.id === 'default');
      const finalPanels = defaultFound 
        ? list 
        : [
            { id: 'default', name: 'Main Platform Panel', description: 'The default dashboard panel for core campaigns', createdAt: new Date(2026, 0, 1).toISOString() },
            ...list
          ];
      setPanels(finalPanels);
    }, (error) => {
      console.log('Panels subscribe error:', error);
      setPanels([
        { id: 'default', name: 'Main Platform Panel', description: 'The default dashboard panel for core campaigns', createdAt: new Date(2026, 0, 1).toISOString() }
      ]);
    });
    return () => unsubscribe();
  }, []);

  const handleCreatePanel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPanelName.trim()) {
      setActionError('Please enter a panel name.');
      return;
    }
    setProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    const newId = 'panel-' + Math.random().toString(36).substring(2, 11);
    const panelObj: DashboardPanel = {
      id: newId,
      name: newPanelName.trim(),
      description: newPanelDesc.trim() || 'Custom Dashboard Panel',
      createdAt: new Date().toISOString(),
      icon: newPanelIcon || ''
    };

    try {
      await setDoc(doc(db, 'panels', newId), panelObj);
      setActionSuccess(`Panel "${newPanelName.trim()}" created successfully!`);
      setActivePanelId(newId);
      setNewPanelName('');
      setNewPanelDesc('');
      setNewPanelIcon('');
      setShowCreatePanelModal(false);
    } catch (err: any) {
      console.log('Panel creation error:', err);
      setActionError(`Could not create panel: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Fetch all users for Select User dropdown
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ManagedUser[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ManagedUser);
      });
      setAvailableUsers(list);
      localStorage.setItem('cached_users', JSON.stringify(list));
    }, (error) => {
      console.log('Users load error in AdminDashboard:', error);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Tickets
  useEffect(() => {
    const q = query(
      collection(db, 'tickets'),
       orderBy('purchasedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: RaffleTicket[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as RaffleTicket);
      });
      setTickets(list);
      localStorage.setItem('cached_tickets', JSON.stringify(list));
      setLoadingTickets(false);
    }, (error) => {
      setLoadingTickets(false);
      console.log('Ticket subscription status:', error.message);
    });

    return () => unsubscribe();
  }, []);

  // Pre-fill simulator email/name if logged in
  useEffect(() => {
    if (auth.currentUser) {
      setBuyerEmail(auth.currentUser.email || '');
      setBuyerName(auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Customer');
    }
  }, [auth.currentUser]);

  // Logout handler
  const handleSignOut = () => {
    auth.signOut();
  };

  // Check if current user email matches our target primary email
  const user = auth.currentUser;
  const isTargetAdmin = user?.email === 'shozolesm4409@gmail.com' || user?.email?.includes('admin');

  // Database record state for log-in user
  const [dbUser, setDbUser] = useState<ManagedUser | null>(() => {
    const cached = localStorage.getItem('cached_db_user');
    try {
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loadingDb, setLoadingDb] = useState(() => {
    return !localStorage.getItem('cached_db_user');
  });
  const [rolePermissions, setRolePermissions] = useState<Record<string, any>>(() => {
    const cached = localStorage.getItem('cached_role_permissions');
    try {
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  // Fetch real-time role permissions from Firestore
  useEffect(() => {
    const colRef = collection(db, 'role_permissions');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const perms: Record<string, any> = {};
      snapshot.forEach(docSnap => {
        perms[docSnap.id] = docSnap.data();
      });
      setRolePermissions(perms);
      localStorage.setItem('cached_role_permissions', JSON.stringify(perms));
    }, (error) => {
      console.log("Error loading real-time role configurations:", error);
    });
    return () => unsubscribe();
  }, []);

  // Resolved role ID for system checks ('user', 'editor', 'admin', 'superadmin')
  const resolvedRole = isTargetAdmin 
    ? 'superadmin' 
    : (dbUser?.role?.toLowerCase() === 'admin' 
      ? 'admin' 
      : (dbUser?.role?.toLowerCase() === 'editor' 
        ? 'editor' 
        : 'user'));

  // Visibility status system helper
  const hasVisibility = (menuKey: 'dashboard' | 'profile' | 'campaigns' | 'users' | 'approve' | 'permissions' | 'history' | 'achievements' | 'notifications' | 'panels') => {
    if (isTargetAdmin) return true;
    
    const activePermConfig = rolePermissions[resolvedRole];
    if (activePermConfig && typeof activePermConfig[menuKey] === 'boolean') {
      return activePermConfig[menuKey];
    }
    
    // Default fallback hardcoded list if database isn't synced
    const fallbacks: Record<string, Record<string, boolean>> = {
      user: { dashboard: true, profile: true, campaigns: false, users: false, approve: false, permissions: false, history: true, achievements: true, notifications: true, panels: false },
      editor: { dashboard: true, profile: true, campaigns: true, users: false, approve: false, permissions: false, history: true, achievements: true, notifications: true, panels: false },
      admin: { dashboard: true, profile: true, campaigns: true, users: true, approve: false, permissions: false, history: true, achievements: true, notifications: true, panels: true },
      superadmin: { dashboard: true, profile: true, campaigns: true, users: true, approve: true, permissions: true, history: true, achievements: true, notifications: true, panels: true }
    };
    return fallbacks[resolvedRole]?.[menuKey] ?? false;
  };

  // Fetch corresponding ManagedUser document in Firestore if exists to verify Access Role - Use real-time listener
  useEffect(() => {
    if (!user?.uid) {
      setLoadingDb(false);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const fetchedUser = { id: docSnap.id, ...docSnap.data() } as ManagedUser;
        setDbUser(fetchedUser);
        localStorage.setItem('cached_db_user', JSON.stringify(fetchedUser));
        if (fetchedUser.panelId) {
          setActivePanelId(prev => prev === fetchedUser.panelId ? prev : (fetchedUser.panelId || 'default'));
        }
        setLoadingDb(false);
      } else {
        // Migration/Creation logic if user doesn't exist yet but is logged in
        const autoSync = async () => {
          const defaultRole = isTargetAdmin ? 'Admin' : 'User';
          const defaultPerm = isTargetAdmin ? 'Full Access' : 'User Limited Access';
          const newDocData = {
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'Staff User',
            email: user.email || '',
            password: 'N/A (Registration Required)',
            campus: 'Main Hub',
            role: defaultRole,
            status: 'Pending',
            permission: defaultPerm,
            photoURL: user.photoURL || '',
            phone: 'N/A (Check Registration)',
            createdAt: new Date().toISOString()
          };
          try {
            await setDoc(doc(db, 'users', user.uid), newDocData);
          } catch(e) {
            console.error("Auto-sync error:", e);
          }
        };
        autoSync();
      }
    }, (error) => {
      console.log("Error fetching user database profile in dashboard:", error);
      setLoadingDb(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const isUserAdmin = isTargetAdmin || (dbUser && (dbUser.role === 'Admin' || dbUser.role === 'admin'));

  // Campaign create handler
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitle.trim()) {
      setActionError('Please provide a campaign title.');
      return;
    }
    if (selectedCampaignUsers.length === 0) {
      setActionError('Please select at least one active user.');
      return;
    }
    if (monthlyAmount <= 0) {
      setActionError('Monthly Amount must be greater than 0.');
      return;
    }
    if (!monthlyDrawDate) {
      setActionError('Please select a Monthly Draw Date.');
      return;
    }

    setProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    const winnersCount = Number(newWinnersPerDraw) || 1;
    const totalUsers = selectedCampaignUsers.length;
    // Calculate total months based on winners count or custom input
    const totalMonths = Number(totalMonthsInput) || Math.ceil(totalUsers / winnersCount) || 1;
    const monthlyTotalAmount = totalUsers * monthlyAmount;
    const computedTotalAmount = totalUsers * monthlyAmount * totalMonths;

    // Generate monthly draws list
    const initialDraws = [];
    const baseDate = new Date(monthlyDrawDate);
    for (let m = 1; m <= totalMonths; m++) {
      const mDate = new Date(baseDate);
      mDate.setMonth(baseDate.getMonth() + (m - 1));
      initialDraws.push({
        monthNumber: m,
        drawDate: mDate.toISOString().split('T')[0],
        winnerId: '',
        winnerName: '',
        winnerEmail: '',
        status: 'pending' as const,
        winners: []
      });
    }

    const newId = 'camp-' + Math.random().toString(36).substring(2, 11);
    const campaignData: LotteryCampaign = {
      id: newId,
      title: campaignTitle.trim(),
      description: campaignDesc.trim() || 'No description provided.',
      // Map to old fields to pass the firesore.rules validation limits (isValidLottery)
      prizePool: computedTotalAmount,
      ticketPrice: monthlyAmount,
      totalTickets: totalUsers,
      soldTickets: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      
      // New specific fields
      selectedUsers: selectedCampaignUsers,
      totalUsers: totalUsers,
      totalMonths: totalMonths,
      monthlyAmount: monthlyAmount,
      monthlyDrawDate: monthlyDrawDate,
      monthlyTotalAmount: monthlyTotalAmount,
      totalAmount: computedTotalAmount,
      winnersPerDraw: winnersCount,
      monthlyDraws: initialDraws,
      panelId: campaignPanelId
    };

    try {
      await setDoc(doc(db, 'lotteries', newId), campaignData);
      setActionSuccess(`Campaign "${campaignTitle}" has been created successfully!`);
      // Reset form
      setCampaignTitle('');
      setCampaignDesc('');
      setSelectedCampaignUsers([]);
      setMonthlyAmount(0);
      setMonthlyDrawDate('');
      setTotalMonthsInput('');
      setNewWinnersPerDraw('1');
      setShowCreateModal(false);
    } catch (error: any) {
      console.log('Campaign save error:', error.message);
      setActionError('Permission denied to create campaign. Are you set up as an administrator?');
    } finally {
      setProcessing(false);
    }
  };

  // Simulated ticket purchase
  const handleBuyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const campId = selectedCampaignId || (campaigns.length > 0 ? campaigns[0].id : '');
    if (!campId) {
      setActionError('Please select a lottery campaign.');
      return;
    }

    const campaign = campaigns.find(c => c.id === campId);
    if (!campaign) return;

    if (campaign.status !== 'active') {
      setActionError('The selected campaign is drawn or inactive.');
      return;
    }

    if (campaign.soldTickets + Number(simulatedCountValue) > campaign.totalTickets) {
      setActionError('Sorry, there are not enough remaining tickets.');
      return;
    }

    setProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      // Simulate bulk purchase
      for (let i = 0; i < Number(simulatedCountValue); i++) {
        const ticketId = 'tkt-' + Math.random().toString(36).substring(2, 11);
        const randNum = (campaign.soldTickets + i + 1).toString().padStart(4, '0');
        const ticketData: RaffleTicket = {
          id: ticketId,
          lotteryId: campaign.id,
          lotteryTitle: campaign.title,
          ticketNumber: `L-${randNum}`,
          buyerName: buyerName.trim() || 'Guest Buyer',
          buyerEmail: buyerEmail.trim() || 'guest@lottery.com',
          purchasedAt: new Date().toISOString(),
          status: 'pending'
        };

        await setDoc(doc(db, 'tickets', ticketId), ticketData);
      }

      // Update Campaign Sold Tickets count
      const updatedSoldVal = campaign.soldTickets + Number(simulatedCountValue);
      await updateDoc(doc(db, 'lotteries', campaign.id), {
        soldTickets: updatedSoldVal
      });

      setActionSuccess(`Successfully purchased ${simulatedCountValue} ticket(s) for "${campaign.title}"!`);
    } catch (error: any) {
      console.log('Ticket buy simulated error:', error.message);
      setActionError('An error occurred during ticket purchase. Verify Firestore rules.');
    } finally {
      setProcessing(false);
    }
  };

  // Draw winner random trigger
  const handleDrawWinner = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    // Find the first pending draw
    const pendingDraw = campaign.monthlyDraws?.find(d => d.status === 'pending');

    if (!pendingDraw) {
      setActionError('All draws for this campaign are already completed.');
      return;
    }

    setSpinCampaignTarget(campaign);
    setActiveTab('spin_wheel');
  };

  // Draw winner for a specific month
  const handleDrawMonthWinner = async (
    campaignId: string, 
    monthNumber: number,
    presetWinners?: { id: string; name: string; email: string; prizeAmount: number }[]
  ) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    setProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const draws = campaign.monthlyDraws ? [...campaign.monthlyDraws] : [];
      // Find the specific month draw
      const drawIdx = draws.findIndex(d => d.monthNumber === monthNumber);
      if (drawIdx === -1) {
        setActionError('Month draw not found in campaign roadmap.');
        setProcessing(false);
        return;
      }

      if (draws[drawIdx].status === 'completed') {
        setActionError('This month has already been drawn.');
        setProcessing(false);
        return;
      }

      let roundWinners: { id: string; name: string; email: string; prizeAmount: number }[] = [];

      if (presetWinners && presetWinners.length > 0) {
        roundWinners = presetWinners;
      } else {
        // Find users selected in this campaign
        const selectedUserIds = campaign.selectedUsers || [];
        if (selectedUserIds.length === 0) {
          setActionError('No selected users mapped to this campaign.');
          setProcessing(false);
          return;
        }

        // Gather IDs of users who already won this campaign
        const alreadyWonIds: string[] = [];
        draws.forEach(d => {
          if (d.status === 'completed') {
            if (d.winnerId) {
              d.winnerId.split(',').forEach(id => {
                const trimmedId = id.trim();
                if (trimmedId && !alreadyWonIds.includes(trimmedId)) {
                  alreadyWonIds.push(trimmedId);
                }
              });
            }
            if (d.winners) {
              d.winners.forEach(w => {
                if (w.id && !alreadyWonIds.includes(w.id)) {
                  alreadyWonIds.push(w.id);
                }
              });
            }
          }
        });

        // Remaining users who haven't won
        const remainingUserIds = selectedUserIds.filter(uid => !alreadyWonIds.includes(uid));

        if (remainingUserIds.length === 0) {
          setActionError('All participating users have already won once. No eligible candidates left for this draw.');
          setProcessing(false);
          return;
        }
        
        const winnersPerDraw = campaign.winnersPerDraw || 1;
        const winnersToDrawCount = Math.min(winnersPerDraw, remainingUserIds.length);

        const chosenUserIds: string[] = [];
        const remainingCandidates = [...remainingUserIds];
        for (let i = 0; i < winnersToDrawCount; i++) {
          const randomIdx = Math.floor(Math.random() * remainingCandidates.length);
          chosenUserIds.push(remainingCandidates[randomIdx]);
          remainingCandidates.splice(randomIdx, 1);
        }

        // Construct winners details list
        const basePrize = (campaign.selectedUsers?.length || 0) * (campaign.monthlyAmount || 0);
        const prizePerWinner = winnersToDrawCount > 0 ? basePrize / winnersToDrawCount : basePrize;

        roundWinners = chosenUserIds.map(uid => {
          const userProfile = availableUsers.find(u => u.id === uid);
          const name = userProfile ? userProfile.name : 'Unknown User';
          const email = userProfile ? userProfile.email : 'unknown@lottery.com';
          return {
            id: uid,
            name,
            email,
            prizeAmount: prizePerWinner
          };
        });
      }

      const jointWinnerId = roundWinners.map(w => w.id).join(', ');
      const jointWinnerName = roundWinners.map(w => w.name).join(', ');
      const jointWinnerEmail = roundWinners.map(w => w.email).join(', ');
      const totalPrizeAmount = roundWinners.reduce((sum, w) => sum + w.prizeAmount, 0);

      // Update the monthly draw state
      draws[drawIdx] = {
        ...draws[drawIdx],
        winnerId: jointWinnerId,
        winnerName: jointWinnerName,
        winnerEmail: jointWinnerEmail,
        status: 'completed',
        prizeAmount: totalPrizeAmount,
        winners: roundWinners
      };

      // Check if all draws are now completed
      const allDone = draws.every(d => d.status === 'completed');
      const updatedCampaignStatus = allDone ? 'drawn' : 'active';

      // Update in database
      const updatePayload: any = {
        monthlyDraws: draws,
        status: updatedCampaignStatus
      };

      if (allDone) {
        updatePayload.winnerEmail = jointWinnerEmail;
        updatePayload.winnerTicket = `Month ${monthNumber} Winners: ${jointWinnerName}`;
        updatePayload.drawDate = new Date().toISOString();
      }

      await updateDoc(doc(db, 'lotteries', campaignId), updatePayload);

      // Create notifications for all participants
      const participants = campaign.selectedUsers || [];
      const batch = writeBatch(db);
      
      participants.forEach(uid => {
        const isWinner = roundWinners.some(w => w.id === uid);
        const notificationId = `notif-${Math.random().toString(36).substring(2, 11)}`;
        const notificationRef = doc(db, 'notifications', notificationId);
        
        batch.set(notificationRef, {
          userId: uid,
          title: isWinner ? '🎉 Victory! You Won!' : 'Draw Results: Round Finished',
          message: isWinner 
            ? `Congratulations! You are the winner for ${campaign.title} (Round #${monthNumber}). Your prize is ৳${totalPrizeAmount / roundWinners.length}.`
            : `The draw for ${campaign.title} (Round #${monthNumber}) is complete. ${jointWinnerName} has been selected as the winner.`,
          type: isWinner ? 'victory' : 'general',
          createdAt: new Date().toISOString(),
          read: false,
          campaignId: campaign.id
        });
      });
      await batch.commit();

      // Save the winning information to each winner's profile
      for (const winner of roundWinners) {
        if (winner.id) {
          try {
            await updateDoc(doc(db, 'users', winner.id), {
              winnings: arrayUnion({
                campaignId: campaign.id,
                campaignTitle: campaign.title,
                drawMonthNum: monthNumber,
                prizeAmount: winner.prizeAmount,
                drawDate: new Date().toISOString()
              })
            });
          } catch (err) {
            console.error(`Failed to update user profile for ${winner.name} win:`, err);
          }
        }
      }
      
      // Update roadmapCampaign state
      const newCampData = {
        ...(campaign),
        monthlyDraws: draws,
        status: updatedCampaignStatus
      };
      
      setRoadmapCampaign(newCampData);
      setRecentlyDrawnMonth(monthNumber);
      setActiveTab('roadmap');
    } catch (err: any) {
      console.error('Error drawing month winner:', err);
      setActionError(`Draw failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Open Edit Campaign Modal
  const handleOpenEditModal = (camp: LotteryCampaign) => {
    setEditCampaignId(camp.id);
    setEditCampaignTitle(camp.title);
    setEditCampaignDesc(camp.description);
    setEditSelectedUsers(camp.selectedUsers || []);
    setEditMonthlyAmount(camp.monthlyAmount || 0);
    setEditMonthlyDrawDate(camp.monthlyDrawDate || '');
    setEditTotalMonths(camp.totalMonths || 0);
    setEditWinnersPerDraw(camp.winnersPerDraw || 1);
    setEditPanelId(camp.panelId || 'default');
    setShowEditModal(true);
  };

  // Edit Campaign handler
  const handleEditCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCampaignTitle.trim()) {
      setActionError('Please provide a campaign title.');
      return;
    }
    if (editSelectedUsers.length === 0) {
      setActionError('Please select at least one active user.');
      return;
    }
    if (editMonthlyAmount <= 0) {
      setActionError('Monthly Amount must be greater than 0.');
      return;
    }
    if (!editMonthlyDrawDate) {
      setActionError('Please select a Monthly Draw Date.');
      return;
    }
    if (editTotalMonths <= 0) {
      setActionError('Total Months must be greater than 0.');
      return;
    }

    setProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    const totalUsers = editSelectedUsers.length;
    const totalMonths = editTotalMonths;
    const monthlyTotalAmount = totalUsers * editMonthlyAmount;
    const computedTotalAmount = totalUsers * editMonthlyAmount * totalMonths;

    const oldCampaign = campaigns.find(c => c.id === editCampaignId);
    const oldDraws = oldCampaign?.monthlyDraws || [];
    
    const updatedDraws = [];
    const baseDate = new Date(editMonthlyDrawDate);
    for (let m = 1; m <= totalMonths; m++) {
      const mDate = new Date(baseDate);
      mDate.setMonth(baseDate.getMonth() + (m - 1));
      
      // Preserve old completed draw if it exists and remains within index bounds
      const existingDraw = oldDraws.find(d => d.monthNumber === m);
      if (existingDraw && existingDraw.status === 'completed') {
        updatedDraws.push({
          ...existingDraw,
          drawDate: mDate.toISOString().split('T')[0]
        });
      } else {
        updatedDraws.push({
          monthNumber: m,
          drawDate: mDate.toISOString().split('T')[0],
          winnerId: '',
          winnerName: '',
          winnerEmail: '',
          status: 'pending' as const,
          winners: []
        });
      }
    }

    const updatedData: Partial<LotteryCampaign> = {
      title: editCampaignTitle.trim(),
      description: editCampaignDesc.trim() || 'No description provided.',
      prizePool: computedTotalAmount,
      ticketPrice: editMonthlyAmount,
      totalTickets: totalUsers,
      
      selectedUsers: editSelectedUsers,
      totalUsers: totalUsers,
      totalMonths: totalMonths,
      monthlyAmount: editMonthlyAmount,
      monthlyDrawDate: editMonthlyDrawDate,
      monthlyTotalAmount: monthlyTotalAmount,
      totalAmount: computedTotalAmount,
      winnersPerDraw: editWinnersPerDraw,
      monthlyDraws: updatedDraws,
      panelId: editPanelId
    };

    try {
      await updateDoc(doc(db, 'lotteries', editCampaignId), updatedData);
      setActionSuccess(`Campaign "${editCampaignTitle}" updated successfully!`);
      setShowEditModal(false);
    } catch (error: any) {
      console.log('Campaign update error:', error.message);
      setActionError(`Failed to update campaign: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Reset Campaign slots
  const handleResetCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    if (!confirm(`Are you sure you want to reset "${campaign.title}"? This will delete all registered tickets.`)) {
      return;
    }

    setProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      // Delete tickets first
      const q = query(collection(db, 'tickets'), where('lotteryId', '==', campaignId));
      const querySnapshot = await getDocs(q);
      
      for (const ticketDoc of querySnapshot.docs) {
        await deleteDoc(doc(db, 'tickets', ticketDoc.id));
      }

      // Reset campaign parameters
      await updateDoc(doc(db, 'lotteries', campaignId), {
        status: 'active',
        soldTickets: 0,
        winnerEmail: null,
        winnerTicket: null,
        drawDate: null
      });

      setActionSuccess(`Campaign "${campaign.title}" has been reset successfully.`);
    } catch (error: any) {
      console.log('Campaign reset error:', error.message);
      setActionError('Insufficent permissions to reset campaign.');
    } finally {
      setProcessing(false);
    }
  };

  // Campaign delete
  const handleDeleteCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;
    setDeleteCampaign(campaign);
  };
  
  const confirmDeleteCampaign = async () => {
    if (!deleteCampaign) return;
    setProcessing(true);
    setActionError(null);
    setActionSuccess(null);
    
    try {
      // Delete tickets first
      const q = query(collection(db, 'tickets'), where('lotteryId', '==', deleteCampaign.id));
      const querySnapshot = await getDocs(q);
      for (const d of querySnapshot.docs) {
        await deleteDoc(doc(db, 'tickets', d.id));
      }

      await deleteDoc(doc(db, 'lotteries', deleteCampaign.id));
      setActionSuccess(`Campaign "${deleteCampaign.title}" deleted successfully.`);
      setDeleteCampaign(null);
    } catch (error: any) {
      console.log('Campaign delete error:', error.message);
      setActionError('Permission denied to delete campaign.');
    } finally {
      setProcessing(false);
    }
  };

  // Metrics calculators
  const displayedCampaigns = campaigns.filter(c => {
    if (activePanelId === 'default') {
      return !c.panelId || c.panelId === 'default';
    }
    return c.panelId === activePanelId;
  });

  const statsTotalCampaigns = displayedCampaigns.length;
  const statsActiveCampaigns = displayedCampaigns.filter(c => c.status === 'active').length;
  
  // Count total completed/drawn rounds (Draw)
  const statsTotalDrawsCount = displayedCampaigns.reduce((acc, camp) => {
    const completed = camp.monthlyDraws?.filter(d => d.status === 'completed').length || 0;
    return acc + completed;
  }, 0);

  // Sum total winner amount (prize amount) for completed draws
  const statsTotalWinnerAmount = displayedCampaigns.reduce((acc, camp) => {
    const completedDraws = camp.monthlyDraws?.filter(d => d.status === 'completed') || [];
    const completedPrizeSum = completedDraws.reduce((sum, d) => {
      const amount = d.prizeAmount ?? ((camp.selectedUsers?.length || camp.totalUsers || 0) * (camp.monthlyAmount || 0));
      return sum + amount;
    }, 0);
    return acc + completedPrizeSum;
  }, 0);
  
  const statsTotalPrizesPlanned = displayedCampaigns.reduce((acc, c) => acc + c.prizePool, 0);

  // Filtered tickets list based on filter
  const filteredTickets = activeFilterId === 'all' 
    ? tickets 
    : tickets.filter(t => t.lotteryId === activeFilterId);

  const renderCampaignCard = (camp: LotteryCampaign) => {
    return (
      <LotteryCampaignCard
        key={camp.id}
        camp={camp}
        theme={theme}
        isUserAdmin={isUserAdmin}
        processing={processing}
        handleOpenEditModal={handleOpenEditModal}
        handleResetCampaign={handleResetCampaign}
        handleDeleteCampaign={handleDeleteCampaign}
        handleDrawWinner={handleDrawWinner}
        setRoadmapCampaign={setRoadmapCampaign}
        setRecentlyDrawnMonth={setRecentlyDrawnMonth}
        setActiveTab={setActiveTab}
      />
    );
  };

  if (dbUser && dbUser.status === 'Pending') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#050505] text-[#e0e0e0]' : 'bg-gray-50 text-gray-800'} p-4 transition-colors duration-300`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-md ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-white border-gray-200'} border rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-20 h-20 rounded-full mb-6 flex items-center justify-center ${theme === 'dark' ? 'bg-[#161616] border border-[#262626]' : 'bg-gray-50 border border-gray-100'}`}>
              <ShieldCheck className={`w-10 h-10 ${theme === 'dark' ? 'text-amber-500' : 'text-amber-600'}`} />
            </div>
            
            <h1 className="text-2xl font-bold font-display mb-3 tracking-tight">Pending Approval</h1>
            
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-8 leading-relaxed`}>
              Your account is currently under review by an administrator. You will gain access to the dashboard once your profile has been approved.
            </p>

            <button
              onClick={handleSignOut}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                theme === 'dark' 
                  ? 'bg-[#161616] text-white hover:bg-[#222] border border-[#262626]' 
                  : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm'
              }`}
            >
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`h-screen max-h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#050505] text-[#e0e0e0]' : 'bg-gray-50 text-gray-800'} flex font-sans select-none transition-colors duration-300 relative`}>
      
      <AdminSidebar
        theme={theme}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasVisibility={hasVisibility}
        user={user}
        handleSignOut={handleSignOut}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        panels={panels}
        activePanelId={activePanelId}
        setActivePanelId={setActivePanelId}
        setShowCreatePanelModal={setShowCreatePanelModal}
        isSuperAdmin={resolvedRole === 'superadmin'}
        userRole={resolvedRole}
        dbUser={dbUser}
      />

      {/* MAIN CONTAINER */}
      <div className={`flex-1 ${resolvedRole === 'superadmin' ? 'lg:pl-80' : 'lg:pl-[264px]'} flex flex-col h-screen w-full relative overflow-hidden`}>
        
        {/* 2. BODY HEADER */}
        <header className={`border-b ${
          theme === 'dark' ? 'bg-[#0a0a0a]/80 border-[#1a1a1a]' : 'bg-white/80 border-gray-200 shadow-sm'
        } backdrop-blur-md sticky top-0 z-40 px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-3.5 transition-colors duration-300`}>
          
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold cursor-pointer"
              title="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <h2 className={`text-base font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {activeTab === 'campaigns' && 'Campaign Control Board'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'approve' && 'Pending Approval Requests'}
                {activeTab === 'panels' && 'Panel Architecture'}
                {activeTab === 'all_campaigns' && 'Lottery Campaigns Management'}
                {activeTab === 'profile' && 'My Profile Settings'}
                {activeTab === 'permissions' && 'System Role Security'}
                {activeTab === 'history' && 'Draw History Logs'}
                {activeTab === 'achievements' && 'My Achievements'}
              </h2>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} hidden sm:block font-sans`}>
                {activeTab === 'campaigns' && 'Activate lottery campaigns, run dynamic draws, and review parameters'}
                {activeTab === 'users' && 'Manage system administration accounts, campus operators, and roles'}
                {activeTab === 'approve' && 'Review and approve newly registered user accounts'}
                {activeTab === 'panels' && 'Isolate layouts, edit titles, and command custom dashboard panels'}
                {activeTab === 'profile' && 'Manage your administrator details, display settings and security settings'}
                {activeTab === 'permissions' && 'Configure custom access rules, feature filters and administrator visibility levels'}
                {activeTab === 'history' && 'Audit complete records and payout metrics of finalized lottery rounds'}
                {activeTab === 'achievements' && 'View your campaign medals, won draws, and rewards history details'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border ${
                theme === 'dark' 
                  ? 'border-[#262626] bg-[#0d0d0d] hover:bg-[#161616] text-amber-500 hover:text-amber-400' 
                  : 'border-gray-200 bg-white hover:bg-gray-100 text-amber-600 hover:text-amber-700 shadow-sm'
              } transition-all cursor-pointer flex items-center justify-center`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* mini status logo */}
            <div className={`flex items-center gap-2 px-3 py-1.5 ${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a] text-amber-400' : 'bg-gray-100/80 border-gray-150 text-amber-700'} border rounded-xl text-xs font-mono max-sm:hidden`}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isTargetAdmin ? 'PRIMARY ROOT' : (isUserAdmin ? 'DB ADMIN' : 'DB USER')}</span>
            </div>
          </div>
        </header>

        {/* 3. BODY SECTION */}
        <main ref={mainScrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4.5 space-y-5">

        {activeTab === 'campaigns' && (
          <>
            {/* Statistical Widgets Bento-Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className={`${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-white border-gray-200 shadow-sm'} p-5 rounded-2xl border flex items-center justify-between`}>
                <div className="space-y-1">
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-450'} font-mono uppercase tracking-wider`}>Campaigns</p>
                  <h3 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-905'}`}>{statsTotalCampaigns}</h3>
                  <p className="text-[10px] text-gray-400">{statsActiveCampaigns} Active lotteries</p>
                </div>
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-[#161616] text-blue-400 border-[#262626]' : 'bg-blue-50 text-blue-600 border-blue-150'}`}>
                  <Activity className="w-6 h-6" />
                </div>
              </div>

              <div className={`${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-white border-gray-200 shadow-sm'} p-5 rounded-2xl border flex items-center justify-between`}>
                <div className="space-y-1">
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-450'} font-mono uppercase tracking-wider`}>Draws Completed</p>
                  <h3 className="text-2xl font-bold tracking-tight text-emerald-500">{statsTotalDrawsCount}</h3>
                  <p className="text-[10px] text-gray-400">Total drawn rounds</p>
                </div>
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-[#161616] text-emerald-400 border-[#262626]' : 'bg-emerald-50 text-emerald-600 border-emerald-150'}`}>
                  <Trophy className="w-6 h-6" />
                </div>
              </div>

              <div className={`${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-white border-gray-200 shadow-sm'} p-5 rounded-2xl border flex items-center justify-between`}>
                <div className="space-y-1">
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-450'} font-mono uppercase tracking-wider`}>Winner Amount</p>
                  <h3 className="text-2xl font-bold tracking-tight text-amber-500">{statsTotalWinnerAmount.toLocaleString()} ৳</h3>
                  <p className="text-[10px] text-gray-400">Distributed winner prizes</p>
                </div>
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-150'}`}>
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className={`${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-white border-gray-200 shadow-sm'} p-5 rounded-2xl border flex items-center justify-between`}>
                <div className="space-y-1">
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-455'} font-mono uppercase tracking-wider`}>Prize Pool Allocation</p>
                  <h3 className="text-2xl font-bold tracking-tight text-indigo-550">{statsTotalPrizesPlanned.toLocaleString()} ৳</h3>
                  <p className="text-[10px] text-gray-400">Guaranteed rewards</p>
                </div>
                <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-[#161616] text-indigo-400 border-[#262626]' : 'bg-indigo-50 text-indigo-600 border-indigo-150'}`}>
                  <Trophy className="w-6 h-6" />
                </div>
              </div>
            </section>

            {/* Control Room Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT: Campaigns Board */}
              <div className="lg:col-span-12 space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-905'} tracking-tight`}>Lottery Campaigns</h3>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Create, draw and supervise operational lottery campaigns</p>
                  </div>
                  {isUserAdmin && (
                    <button
                      id="open-create-modal"
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-amber-500/10 transition-all font-sans"
                    >
                      <Plus className="w-4 h-4" />
                      New Campaign
                    </button>
                  )}
                </div>

                {loadingCampaigns ? (
                  <div className={`p-12 text-center border rounded-2xl ${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs text-gray-500 font-mono">Loading campaign databases...</p>
                  </div>
                ) : displayedCampaigns.length === 0 ? (
                  <div className={`p-12 text-center border border-dashed rounded-3xl space-y-3 ${theme === 'dark' ? 'bg-[#0d0d0d] border-[#1a1a1a]' : 'bg-white border-gray-200'}`}>
                    <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div className="max-w-sm mx-auto space-y-1">
                      <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>No Active Campaigns in Active Panel</h4>
                      <p className="text-xs text-gray-400">Add a new campaign for this specific dashboard panel, or select another panel from the sidebar to view other campaigns.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
                    {displayedCampaigns.filter(c => c.status === 'active').map((camp) => renderCampaignCard(camp))}
                    {displayedCampaigns.length > 2 && (
                      <button 
                        onClick={() => setActiveTab('all_campaigns')}
                        className="col-span-full py-4 text-xs font-bold text-amber-500 hover:text-amber-400 border border-amber-500/10 rounded-2xl bg-amber-500/5 transition-all"
                      >
                        View More Campaigns
                      </button>
                    )}
                  </div>
                )}
              </div>

            </section>
          </>
        )}

        {activeTab === 'all_campaigns' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Lottery Campaigns Overview</h3>
              {isUserAdmin && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-amber-500 text-black px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-amber-400"
                >
                  <Plus className="w-4 h-4" /> Add New Campaign
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedCampaigns.map((camp) => renderCampaignCard(camp))}
            </div>
          </div>
        )}

        {/* 2. USER MANAGEMENT TAB */}
        {activeTab === 'users' && (
          <div className="p-[2px]">
            <UserManagement 
              setActionError={setActionError}
              setActionSuccess={setActionSuccess}
              theme={theme}
              panels={panels}
              activePanelId={activePanelId}
              isSuperAdmin={resolvedRole === 'superadmin'}
              viewMode="users"
            />
          </div>
        )}

        {/* 2B. APPROVED USER TAB */}
        {activeTab === 'approve' && (
          <div className="p-[2px]">
            <UserManagement 
              setActionError={setActionError}
              setActionSuccess={setActionSuccess}
              theme={theme}
              panels={panels}
              activePanelId={activePanelId}
              isSuperAdmin={resolvedRole === 'superadmin'}
              viewMode="approve"
            />
          </div>
        )}


        {/* 4. MY PROFILE SELECTION */}
        {activeTab === 'profile' && (
          <div className="p-[2px]">
            <MyProfile 
              theme={theme}
              setActionError={setActionError}
              setActionSuccess={setActionSuccess}
            />
          </div>
        )}

        {/* 6. MY ACHIEVEMENTS SELECTION */}
        {activeTab === 'achievements' && (() => {
          const userWinnings = dbUser?.winnings || [];
          const filteredWinnings = userWinnings.filter(win => {
            const campaign = campaigns.find(c => c.id === win.campaignId);
            if (!campaign) return false;
            const userPanel = campaign.panelId || 'default';
            const targetPanel = activePanelId || 'default';
            return userPanel === targetPanel;
          });
          const totalRewardsWon = filteredWinnings.reduce((sum, win) => sum + (win.prizeAmount || 0), 0);
          
          return (
            <div className="space-y-6 w-full pb-10">
              {/* Stat Summary Box - Refined */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-5"
              >
                <div className={`p-5 rounded-3xl border flex items-center justify-between relative overflow-hidden transition-all hover:scale-[1.02] ${
                  theme === 'dark' 
                    ? 'bg-[#0d0d0d] border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
                    : 'bg-white border-amber-200 shadow-sm shadow-amber-500/5'
                }`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12" />
                  <div className="relative z-10">
                    <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Total Rewards Won</h4>
                    <p className="text-2xl font-black text-amber-500 mt-1 leading-none">
                      ৳ {totalRewardsWon.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1.5">Direct payout balance</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20 relative z-10">
                    <Trophy className="w-6 h-6" />
                  </div>
                </div>

                <div className={`p-5 rounded-3xl border flex items-center justify-between relative overflow-hidden transition-all hover:scale-[1.02] ${
                  theme === 'dark' 
                    ? 'bg-[#0d0d0d] border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
                    : 'bg-white border-emerald-200 shadow-sm shadow-emerald-500/5'
                }`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12" />
                  <div className="relative z-10">
                    <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Draw Victories</h4>
                    <p className="text-2xl font-black text-emerald-500 mt-1 leading-none">
                      {filteredWinnings.length}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1.5">Successful rounds won</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 relative z-10">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                <div className={`p-5 rounded-3xl border flex items-center justify-between relative overflow-hidden transition-all hover:scale-[1.02] ${
                  theme === 'dark' 
                    ? 'bg-[#0d0d0d] border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.05)]' 
                    : 'bg-white border-indigo-200 shadow-sm shadow-indigo-500/5'
                }`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12" />
                  <div className="relative z-10">
                    <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Active Matrix</h4>
                    <p className="text-2xl font-black text-indigo-500 mt-1 leading-none">
                      {displayedCampaigns.filter(c => c.selectedUsers?.includes(dbUser?.email || '')).length}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1.5">Enrolled competitions</p>
                  </div>
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/20 relative z-10">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>

              {/* Victory Records Section */}
              <div className="w-full space-y-5">
                <div className={`p-6 border rounded-[32px] ${
                  theme === 'dark' ? 'bg-[#0f0f0f] border-[#1e1e1e]' : 'bg-white border-gray-200 shadow-sm shadow-gray-200/50'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className={`text-base font-black tracking-tight ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        My Victory Log
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">Chronological list of all draws won locally</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                      theme === 'dark' ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' : 'bg-amber-50 border-amber-200 text-amber-600'
                    } uppercase`}>
                      {panels.find(p => p.id === activePanelId)?.name || 'Main Panel'}
                    </div>
                  </div>

                  {filteredWinnings.length === 0 ? (
                    <div className="py-16 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-dashed border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto animate-pulse">
                        <Trophy className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
                          No Medals Earned Yet
                        </h4>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 leading-relaxed">
                          Your journey is just beginning. You are currently part of {displayedCampaigns.filter(c => c.selectedUsers?.includes(dbUser?.email || '')).length} active campaigns on this panel. When your number is drawn, it will shine here!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredWinnings.map((win, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`p-5 rounded-2xl border group transition-all duration-300 hover:shadow-lg ${
                            theme === 'dark' 
                              ? 'bg-gradient-to-br from-[#161616] via-[#0d0d0d] to-[#0a0a0a] border-[#222] hover:border-amber-500/40' 
                              : 'bg-gradient-to-br from-gray-50 via-white to-white border-gray-200 hover:border-amber-300'
                          }`}
                        >
                          <div className="flex flex-col h-full justify-between gap-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <div className={`p-2 rounded-lg ${
                                  theme === 'dark' ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600'
                                }`}>
                                  <Trophy className="w-4 h-4" />
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] font-mono text-gray-500 uppercase tracking-tighter">PRIZE AMOUNT</p>
                                  <p className="text-lg font-black text-amber-500">৳ {win.prizeAmount?.toLocaleString() || 0}</p>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className={`font-bold text-sm tracking-tight leading-snug ${
                                  theme === 'dark' ? 'text-white group-hover:text-amber-400' : 'text-gray-900 group-hover:text-amber-600'
                                } transition-colors`}>
                                  {win.campaignTitle}
                                </h4>
                                <p className="text-[10px] text-gray-500 mt-0.5 font-medium tracking-tight">Draw Round #{win.drawMonthNum}</p>
                              </div>
                            </div>

                            <div className={`pt-3 border-t border-dashed ${
                              theme === 'dark' ? 'border-gray-800' : 'border-gray-150'
                            } flex items-center justify-between text-[10px]`}>
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="font-mono text-gray-400">STATUS: PAID</span>
                              </div>
                              <span className="text-gray-400 font-mono">
                                {new Date(win.drawDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'notifications' && dbUser && (
          <NotificationsView 
            theme={theme} 
            userEmail={dbUser.email} 
            activePanelId={activePanelId}
            campaigns={campaigns}
          />
        )}

        {/* PANELS MANAGEMENT SELECTION */}
        {activeTab === 'panels' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            <PanelManagement 
              theme={theme}
              panels={panels}
              activePanelId={activePanelId}
              setActivePanelId={setActivePanelId}
            />
          </div>
        )}

        {/* 5. ROLE PERMISSIONS SELECTION */}
        {activeTab === 'permissions' && (
          <div className="p-[2px]">
            <RolePermissions 
              theme={theme}
              activePanelName={panels.find(p => p.id === activePanelId)?.name}
            />
          </div>
        )}

        {/* DRAW HISTORY SELECTION */}
        {activeTab === 'history' && (
          <div className="p-[2px]">
            <DrawHistory 
              campaigns={displayedCampaigns}
              theme={theme}
            />
          </div>
        )}

        {/* ROADMAP VIEW */}
        {activeTab === 'roadmap' && roadmapCampaign && (
          <div className="p-[2px]">
            <RoadmapView 
                campaign={roadmapCampaign} 
                recentlyDrawnMonth={recentlyDrawnMonth} 
                onBack={() => { setRoadmapCampaign(null); setRecentlyDrawnMonth(null); setActiveTab('campaigns'); }} 
                onNavigateToHistory={() => setActiveTab('history')}
                onNavigateToAchievements={() => setActiveTab('achievements')}
                theme={theme}
                availableUsers={availableUsers}
            />
          </div>
        )}

        {/* SPIN WHEEL DIRECT PAGE VIEW */}
        {activeTab === 'spin_wheel' && spinCampaignTarget && (
          <div className="p-[2px]">
            <SpinWheelModal
              isOpen={true}
              onClose={() => {
                setSpinCampaignTarget(null);
                setActiveTab('campaigns');
              }}
              campaign={spinCampaignTarget}
              availableUsers={availableUsers}
              onDrawCompleted={async (winners) => {
                const pendingDraw = spinCampaignTarget.monthlyDraws?.find(d => d.status === 'pending');
                if (pendingDraw) {
                  await handleDrawMonthWinner(spinCampaignTarget.id, pendingDraw.monthNumber, winners);
                }
                setSpinCampaignTarget(null);
                setActiveTab('campaigns');
              }}
              theme={theme}
            />
          </div>
        )}

      </main>

      {/* DELETE CONFIRM MODAL */}
      <DeleteConfirmModal
        campaign={deleteCampaign}
        onConfirm={confirmDeleteCampaign}
        onClose={() => setDeleteCampaign(null)}
        theme={theme}
        processing={processing}
      />

      <EditCampaignModal 
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        theme={theme}
        handleEditCampaign={handleEditCampaign}
        editCampaignTitle={editCampaignTitle}
        setEditCampaignTitle={setEditCampaignTitle}
        editCampaignDesc={editCampaignDesc}
        setEditCampaignDesc={setEditCampaignDesc}
        isEditUsersDropdownOpen={isEditUsersDropdownOpen}
        setIsEditUsersDropdownOpen={setIsEditUsersDropdownOpen}
        editSelectedUsers={editSelectedUsers}
        setEditSelectedUsers={setEditSelectedUsers}
        availableUsers={availableUsers}
        editMonthlyAmount={editMonthlyAmount}
        setEditMonthlyAmount={setEditMonthlyAmount}
        editMonthlyDrawDate={editMonthlyDrawDate}
        setEditMonthlyDrawDate={setEditMonthlyDrawDate}
        editTotalMonths={editTotalMonths}
        setEditTotalMonths={setEditTotalMonths}
        editWinnersPerDraw={editWinnersPerDraw}
        setEditWinnersPerDraw={setEditWinnersPerDraw}
        processing={processing}
        panels={panels}
        editPanelId={editPanelId}
        setEditPanelId={setEditPanelId}
        isSuperAdmin={resolvedRole === 'superadmin'}
      />

      {/* CREATE LOTTERY MODAL */}
      <CreateCampaignModal
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        theme={theme}
        handleCreateCampaign={handleCreateCampaign}
        newCampaignTitle={campaignTitle}
        setNewCampaignTitle={setCampaignTitle}
        newCampaignDesc={campaignDesc}
        setNewCampaignDesc={setCampaignDesc}
        isUsersDropdownOpen={isUsersDropdownOpen}
        setIsUsersDropdownOpen={setIsUsersDropdownOpen}
        selectedUsers={selectedCampaignUsers}
        setSelectedUsers={setSelectedCampaignUsers}
        availableUsers={availableUsers}
        newMonthlyAmount={monthlyAmount.toString()}
        setNewMonthlyAmount={(val) => setMonthlyAmount(Number(val))}
        newMonthlyDrawDate={monthlyDrawDate}
        setNewMonthlyDrawDate={setMonthlyDrawDate}
        newTotalMonths={totalMonthsInput}
        setNewTotalMonths={setTotalMonthsInput}
        newWinnersPerDraw={newWinnersPerDraw}
        setNewWinnersPerDraw={setNewWinnersPerDraw}
        processing={processing}
        panels={panels}
        panelId={campaignPanelId}
        setPanelId={setCampaignPanelId}
        isSuperAdmin={resolvedRole === 'superadmin'}
      />

      {/* CREATE PANEL MODAL */}
      <AnimatePresence>
        {showCreatePanelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreatePanelModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl relative z-10 overflow-hidden ${
                theme === 'dark' ? 'bg-[#0a0a0a] border-[#1f1f1f]' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-950'}`}>
                    Create Dashboard Panel
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Isolate layouts and direct custom campaigns under specific target panels.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreatePanelModal(false)}
                  className={`p-1.5 rounded-xl transition-all ${
                    theme === 'dark' ? 'hover:bg-[#1a1a1a] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePanel} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Panel Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Premium VIP Panel"
                    value={newPanelName}
                    onChange={(e) => setNewPanelName(e.target.value)}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all ${
                      theme === 'dark' 
                        ? 'bg-[#121212] border-[#222] text-white focus:border-amber-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-amber-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Description / Context
                  </label>
                  <textarea
                    placeholder="e.g. Holds exclusive lottery drives for high-tier members"
                    value={newPanelDesc}
                    onChange={(e) => setNewPanelDesc(e.target.value)}
                    rows={3}
                    className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all resize-none ${
                      theme === 'dark' 
                        ? 'bg-[#121212] border-[#222] text-white focus:border-amber-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-amber-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Select Icon
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-dashed border-gray-200 dark:border-[#222] max-h-32 overflow-y-auto bg-gray-50/50 dark:bg-black/20">
                    <button
                      type="button"
                      onClick={() => setNewPanelIcon('')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold cursor-pointer transition-all ${
                        newPanelIcon === ''
                          ? 'bg-amber-500 text-black font-bold'
                          : theme === 'dark'
                            ? 'bg-[#141414] text-gray-400 hover:text-white'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Initials
                    </button>
                    {Object.keys(PanelIconMap).map((iconName) => {
                      const IconComponent = PanelIconMap[iconName];
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setNewPanelIcon(iconName)}
                          className={`w-7 h-7 flex items-center justify-center rounded border transition-all cursor-pointer ${
                            newPanelIcon === iconName
                              ? 'bg-amber-500 text-black border-amber-500'
                              : theme === 'dark'
                                ? 'bg-[#141414] border-[#1e1e1e] text-gray-400 hover:text-white hover:bg-[#111]'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                          title={iconName}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreatePanelModal(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      theme === 'dark' 
                        ? 'bg-transparent border-[#222] hover:bg-[#111] text-gray-300' 
                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    {processing ? 'Creating...' : 'Create Panel'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  </div>
);
}
