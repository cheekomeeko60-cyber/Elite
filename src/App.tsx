import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { 
  DollarSign, 
  Sparkles, 
  TrendingUp, 
  Users, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Send, 
  Compass, 
  Briefcase, 
  User as UserIcon, 
  ShieldAlert, 
  LogOut, 
  Plus, 
  Edit, 
  Settings, 
  HelpCircle, 
  RefreshCw, 
  MessageSquare,
  Award,
  Lock,
  Coins,
  QrCode,
  Activity,
  ChevronDown,
  ChevronUp,
  Check,
  Info
} from 'lucide-react';
import { User, Plan, RankConfiguration, TransactionRequest, PaymentDetails, LiveDB } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // --- Active Authentication States ---
  const [currentUser, setCurrentUser] = useState<{ id: string; fullName: string; email: string; isAdmin: boolean } | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  
  // Auth Form Values
  const [authName, setAuthName] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authReferredBy, setAuthReferredBy] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Monitor URL referral code query parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    if (refParam) {
      setAuthReferredBy(refParam.toUpperCase().trim());
      setAuthView('register');
    }
  }, []);

  // --- Global Synced Server States ---
  const [serverDb, setServerDb] = useState<LiveDB | null>(null);
  const [liveUser, setLiveUser] = useState<User | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'SSE_CONNECTED' | 'POLLING_CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  
  // --- UI Layout Views ---
  const [adminMode, setAdminMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'plans' | 'deposit' | 'withdrawal' | 'support' | 'referrals'>('dashboard');
  const [activeAdminTab, setActiveAdminTab] = useState<'requests' | 'plans' | 'users' | 'ranks' | 'payment'>('requests');

  // --- Transactions & Request Flows States ---
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositPayTID, setDepositPayTID] = useState<string>('');
  const [depositMethod, setDepositMethod] = useState<string>('Jazzcash');
  
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [withdrawalAccount, setWithdrawalAccount] = useState<string>('');
  const [withdrawalMethod, setWithdrawalMethod] = useState<string>('Jazzcash');

  // --- Admin Add/Edit States ---
  const [newPlanName, setNewPlanName] = useState<string>('');
  const [newPlanPrice, setNewPlanPrice] = useState<string>('');
  const [newPlanProfit, setNewPlanProfit] = useState<string>('');
  const [newPlanBenefits, setNewPlanBenefits] = useState<string>('');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // --- Investment Calculator & Real-Time Earning Engine States ---
  const [calcPlanId, setCalcPlanId] = useState<string>('');
  const [calcAmount, setCalcAmount] = useState<string>('5000');
  const [expandedPlanIds, setExpandedPlanIds] = useState<Record<string, boolean>>({});
  const [floatingCoins, setFloatingCoins] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const [tick, setTick] = useState<number>(0);
  const [salaryCountdown, setSalaryCountdown] = useState<string>('00:00:00');

  // Admin User Adjustment inputs
  const [selectedAdjustUserId, setSelectedAdjustUserId] = useState<string>('');
  const [adjustBalance, setAdjustBalance] = useState<string>('');
  const [adjustEarnings, setAdjustEarnings] = useState<string>('');
  const [adjustRankCode, setAdjustRankCode] = useState<string>('');

  // Admin Payment settings inputs
  const [globalMethod, setGlobalMethod] = useState<string>('');
  const [globalName, setGlobalName] = useState<string>('');
  const [globalNumber, setGlobalNumber] = useState<string>('');

  // Ranks Setup inputs
  const [activeRankSetupCode, setActiveRankSetupCode] = useState<string>('BRONZE');
  const [rankReqEarnings, setRankReqEarnings] = useState<string>('');
  const [rankReqVolume, setRankReqVolume] = useState<string>('');
  const [rankDailySalary, setRankDailySalary] = useState<string>('');

  // --- AI Systems States ---
  const [supportMessage, setSupportMessage] = useState<string>('');
  const [supportChat, setSupportChat] = useState<{ sender: 'user' | 'support'; text: string; timestamp: string }[]>([]);
  const [aiAuditReport, setAiAuditReport] = useState<string>('');
  const [aiAuditing, setAiAuditing] = useState<boolean>(false);
  
  // Notification Toast state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string | null } | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Timer Ref for fallback real-time polling
  const eventSourceRef = useRef<EventSource | null>(null);

  // --- Initialize Notification helper ---
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const copyToClipboard = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      showNotification('success', `${label} copied to clipboard!`);
    } catch (err) {
      showNotification('error', 'Failed to copy to clipboard.');
    }
  };

  // On mount check Session
  useEffect(() => {
    const savedUser = localStorage.getItem('aura_logged_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
      } catch (err) {
        localStorage.removeItem('aura_logged_user');
      }
    }
  }, []);

  // Real-Time UI Stream Simulator & Midnight Reset Countdown Timer
  useEffect(() => {
    const interval = setInterval(() => {
      // Tick continuous yield display states
      setTick(t => t + 1);

      // Calculate countdown to next UTC midnight
      const now = new Date();
      const nextUtcMidnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
      ));
      const diffMs = nextUtcMidnight.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setSalaryCountdown('00:00:00');
      } else {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        setSalaryCountdown(
          `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // --- Implement Real-time SSE / High Performance Poller Engine ---
  useEffect(() => {
    // Standard SSE client setup with double polling fallback mechanism
    let pollInterval: NodeJS.Timeout;

    const startPolling = () => {
      setRealtimeStatus('POLLING_CONNECTED');
      fetchSync();
      pollInterval = setInterval(fetchSync, 2500);
    };

    const setupSSE = () => {
      try {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        const es = new EventSource('/api/realtime/stream');
        eventSourceRef.current = es;

        es.onerror = () => {
          // SSE connection dropped or proxy blocking, step into POLLING
          if (realtimeStatus !== 'POLLING_CONNECTED') {
            startPolling();
          }
        };

        es.addEventListener('sync', (e: MessageEvent) => {
          try {
            const data: LiveDB = JSON.parse(e.data);
            setServerDb(data);
            setRealtimeStatus('SSE_CONNECTED');
          } catch (err) {
            console.error('Error parsing sync SSE data', err);
          }
        });

        es.addEventListener('update', (e: MessageEvent) => {
          try {
            const data: LiveDB = JSON.parse(e.data);
            setServerDb(data);
            setRealtimeStatus('SSE_CONNECTED');
          } catch (err) {
            console.error('Error parsing update SSE data', err);
          }
        });

      } catch (err) {
        startPolling();
      }
    };

    setupSSE();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Sync current user state directly with fetched server state
  useEffect(() => {
    if (serverDb && currentUser) {
      const activeData = serverDb.users.find(u => u.id === currentUser.id);
      if (activeData) {
        setLiveUser(activeData);
      }
    } else {
      setLiveUser(null);
    }
  }, [serverDb, currentUser]);

  // Recalculate accrued earnings when user changes tab or periodically
  useEffect(() => {
    if (currentUser && !currentUser.isAdmin) {
      const triggerRecalculate = async () => {
        try {
          const res = await fetch('/api/user/recalculate-accruals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setLiveUser(data.user);
            }
          }
        } catch (e) {
          // Silent local handle
        }
      };

      // Recalculate once immediately
      triggerRecalculate();

      // Recalculate periodic incrementals every 2.5 seconds to give fluid real-time continuous updates
      const recInterval = setInterval(triggerRecalculate, 2500);
      return () => clearInterval(recInterval);
    }
  }, [currentUser, activeTab]);

  const fetchSync = async () => {
    try {
      const res = await fetch('/api/sync/get');
      if (res.ok) {
        const data: LiveDB = await res.json();
        setServerDb(data);
      }
    } catch (e) {
      setRealtimeStatus('DISCONNECTED');
    }
  };

  // Fill in active configurations when page/tab boots
  useEffect(() => {
    if (serverDb?.payment) {
      setGlobalMethod(serverDb.payment.methodName);
      setGlobalName(serverDb.payment.accountName);
      setGlobalNumber(serverDb.payment.accountNumber);
    }
    if (serverDb?.ranks) {
      const selectedConf = serverDb.ranks.find(r => r.code === activeRankSetupCode);
      if (selectedConf) {
        setRankReqEarnings(selectedConf.requiredEarnings.toString());
        setRankReqVolume(selectedConf.requiredPlansVolume.toString());
        setRankDailySalary(selectedConf.dailyIncomeSalary.toString());
      }
    }
  }, [serverDb, activeAdminTab, activeRankSetupCode]);

  // Real-time continuous balance and active plan calculations helper
  const getRealtimeBalanceAndPlans = () => {
    if (!liveUser || !serverDb) return { balance: 0, earnings: 0, plans: [] };
    
    let simulatedGainTotal = 0;
    const now = Date.now();
    
    const plansWithSimulated = liveUser.purchasedPlans.map(planObj => {
      const planMeta = serverDb.plans.find(p => p.id === planObj.planId);
      if (!planMeta) return { ...planObj, liveRevenue: planObj.revenueGenerated };
      
      // Calculate continuous per-second accrual
      const secondRate = (planMeta.weeklyProfitPercent / 100) / (7 * 24 * 3600);
      const elapsedSeconds = Math.max(0, (now - new Date(planObj.lastProfitClaimDate).getTime()) / 1000);
      const simulatedGain = planObj.purchasePrice * secondRate * elapsedSeconds;
      
      simulatedGainTotal += simulatedGain;
      return {
        ...planObj,
        liveRevenue: planObj.revenueGenerated + simulatedGain
      };
    });
    
    const liveTickingBalance = liveUser.balance + simulatedGainTotal;
    const liveTickingEarnings = liveUser.earnings + simulatedGainTotal;
    
    return {
      balance: liveTickingBalance,
      earnings: liveTickingEarnings,
      plans: plansWithSimulated
    };
  };

  const { balance: liveTickingBalance, earnings: liveTickingEarnings, plans: liveTickingPlans } = getRealtimeBalanceAndPlans();

  // --- Actions Implementations ---

  // User Sign Up handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName || !authEmail || !authPassword) {
      showNotification('error', 'Please enter all registration fields.');
      return;
    }
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: authName,
          email: authEmail,
          password: authPassword,
          referredByCode: authReferredBy
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      showNotification('success', 'Aura account created! Auto-confirmation resolved.');
      setCurrentUser(data.user);
      localStorage.setItem('aura_logged_user', JSON.stringify(data.user));
      
      // Clear forms
      setAuthName('');
      setAuthEmail('');
      setAuthPassword('');
      setAuthReferredBy('');
    } catch (err: any) {
      showNotification('error', err.message || 'Server error.');
    } finally {
      setAuthLoading(false);
    }
  };

  // User/Admin Log In handler
  const handleLogIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      showNotification('error', 'Please provide authentication credentials.');
      return;
    }
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication rejected.');
      }

      showNotification('success', `Welcome back, ${data.user.fullName}!`);
      setCurrentUser(data.user);
      localStorage.setItem('aura_logged_user', JSON.stringify(data.user));
      
      if (data.user.isAdmin) {
        setAdminMode(true);
      } else {
        setAdminMode(false);
      }

      // Reset tabs
      setActiveTab('dashboard');
      
      // Clear inputs
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      showNotification('error', err.message || 'Login failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Log Out operation
  const handleLogOut = () => {
    localStorage.removeItem('aura_logged_user');
    setCurrentUser(null);
    setAdminMode(false);
    setLiveUser(null);
    showNotification('success', 'Logged out from workspace securely.');
  };

  // Trigger Purchase of Investment Plan
  const handlePurchasePlan = async (planId: string) => {
    if (!currentUser) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/user/purchase-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          planId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Plan purchase rejected.');
      }

      showNotification('success', data.message || 'Aura Plan purchased successfully!');
      fetchSync();
    } catch (err: any) {
      showNotification('error', err.message || 'Purchase process error.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit deposit TID Form
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!depositAmount || !depositPayTID) {
      showNotification('error', 'Please specify the amount and precise Pay TID.');
      return;
    }
    setActionLoading(true);

    try {
      const res = await fetch('/api/user/submit-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          amount: depositAmount,
          payTID: depositPayTID,
          paymentMethod: depositMethod
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Deposit logging failed.');
      }

      showNotification('success', data.message || 'Deposit registered successfully!');
      setDepositAmount('');
      setDepositPayTID('');
      fetchSync();
    } catch (err: any) {
      showNotification('error', err.message || 'Error executing request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit withdrawal balance path
  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!withdrawalAmount || !withdrawalAccount) {
      showNotification('error', 'Please specify target amount and account number details.');
      return;
    }
    setActionLoading(true);

    try {
      const res = await fetch('/api/user/submit-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          amount: withdrawalAmount,
          paymentMethod: withdrawalMethod,
          accountDetails: withdrawalAccount
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Withdrawal process failed.');
      }

      showNotification('success', data.message || 'Withdrawal registered.');
      setWithdrawalAmount('');
      setWithdrawalAccount('');
      fetchSync();
    } catch (err: any) {
      showNotification('error', err.message || 'Error processing request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Claim Daily Salary Reward
  const claimDailySalary = async () => {
    if (!currentUser) return;
    setActionLoading(true);

    try {
      const res = await fetch('/api/user/claim-salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Salary claim failed.');
      }

      showNotification('success', data.message);
      
      const earnedAmount = serverDb?.ranks.find(r => r.code === liveUser?.rankCode)?.dailyIncomeSalary || 0;
      const newCoins = Array.from({ length: 12 }).map((_, i) => ({
        id: Date.now() + i + Math.random(),
        x: (Math.random() - 0.5) * 180,
        y: -40 - Math.random() * 150,
        text: i === 0 ? `+PKR ${earnedAmount}` : (i % 3 === 0 ? '🪙' : (i % 3 === 1 ? '✨' : '🎉'))
      }));
      setFloatingCoins(prev => [...prev, ...newCoins]);
      setTimeout(() => {
        setFloatingCoins(prev => prev.filter(c => !newCoins.find(nc => nc.id === c.id)));
      }, 2000);

      fetchSync();
    } catch (err: any) {
      showNotification('error', err.message || 'Salary processing error.');
    } finally {
      setActionLoading(false);
    }
  };

  // Send message to Gemini/AI Support representative chatbot
  const handleSupportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    const userMsg = supportMessage.trim();
    setSupportMessage('');
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setSupportChat(prev => [...prev, { sender: 'user', text: userMsg, timestamp }]);

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          email: currentUser?.email || 'Guest'
        })
      });

      const data = await res.json();
      setSupportChat(prev => [...prev, { sender: 'support', text: data.text, timestamp }]);
    } catch (e) {
      setSupportChat(prev => [...prev, {
        sender: 'support',
        text: 'Aura support systems are processing, we will review and verify your request within few minutes.',
        timestamp
      }]);
    }
  };

  // --- Admin Specific Operations Controls ---

  // Admin approves or rejects transactions
  const processTransaction = async (transactionId: string, action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/requests/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, action })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transaction action rejected.');
      }

      showNotification('success', data.message || `Transaction request was successfully ${action}d!`);
      fetchSync();
    } catch (err: any) {
      showNotification('error', err.message || 'Server error.');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin updates payment gateway variables
  const handlePaymentSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch('/api/admin/payment/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          methodName: globalMethod,
          accountName: globalName,
          accountNumber: globalNumber
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Global updates failed.');
      }

      showNotification('success', 'Real-time payment transfer details propagated!');
      fetchSync();
    } catch (err: any) {
      showNotification('error', err.message || 'Process failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin manually alters any user balance or tier adjustments on servers
  const handleUserVariablesAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdjustUserId) {
      showNotification('error', 'Please select a system user node to adjust.');
      return;
    }
    setActionLoading(true);

    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedAdjustUserId,
          balance: adjustBalance ? parseFloat(adjustBalance) : undefined,
          earnings: adjustEarnings ? parseFloat(adjustEarnings) : undefined,
          rankCode: adjustRankCode || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Manual updates rejected.');
      }

      showNotification('success', 'User servers parameters adjusted real-time!');
      setSelectedAdjustUserId('');
      setAdjustBalance('');
      setAdjustEarnings('');
      setAdjustRankCode('');
      fetchSync();
    } catch (err: any) {
      showNotification('error', err.message || 'Database adjust failure.');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin creates/updates Investment products
  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName || !newPlanPrice || !newPlanProfit) {
      showNotification('error', 'Required basic metadata missing from plan configuration.');
      return;
    }
    setActionLoading(true);

    const isEdit = !!editingPlanId;
    const targetUrl = isEdit ? '/api/admin/plans/update' : '/api/admin/plans/create';
    const bodyArgs = isEdit 
      ? { planId: editingPlanId, name: newPlanName, price: newPlanPrice, weeklyProfitPercent: newPlanProfit, benefits: newPlanBenefits }
      : { name: newPlanName, price: newPlanPrice, weeklyProfitPercent: newPlanProfit, benefits: newPlanBenefits };

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyArgs)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Plan configuration saving rejected.');
      }

      showNotification('success', data.message || 'Investment plan successfully registered!');
      
      // Clear plan editors
      setNewPlanName('');
      setNewPlanPrice('');
      setNewPlanProfit('');
      setNewPlanBenefits('');
      setEditingPlanId(null);
      fetchSync();
    } catch (err: any) {
      showNotification('error', err.message || 'Error saving plan configuration.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPlanClick = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setNewPlanName(plan.name);
    setNewPlanPrice(plan.price.toString());
    setNewPlanProfit(plan.weeklyProfitPercent.toString());
    setNewPlanBenefits(plan.benefits);
  };

  const exportTransactionsToCSV = () => {
    if (!serverDb?.transactions || serverDb.transactions.length === 0) {
      showNotification('error', 'No transaction data available to export.');
      return;
    }

    // Define CSV headers
    const headers = ['Transaction ID', 'User Name', 'User Email', 'Type', 'Channel', 'Amount (PKR)', 'TID Reference', 'Timestamp', 'Status'];
    
    // Map transactions list to row strings
    const rows = serverDb.transactions.map(tx => [
      `"${tx.id}"`,
      `"${tx.userName.replace(/"/g, '""')}"`,
      `"${tx.userEmail}"`,
      `"${tx.type.toUpperCase()}"`,
      `"${tx.paymentMethod}"`,
      tx.amount,
      `"${tx.payTID || ''}"`,
      `"${new Date(tx.timestamp).toLocaleString()}"`,
      `"${tx.status.toUpperCase()}"`
    ]);

    // Build complete CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    // Create secure URL download reference
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `aura_transactions_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('success', 'Transactions CSV exported successfully!');
  };

  // Adjust rankings guideline settings
  const handleRankSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch('/api/admin/ranks/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rankCode: activeRankSetupCode,
          requiredEarnings: rankReqEarnings ? parseFloat(rankReqEarnings) : undefined,
          requiredPlansVolume: rankReqVolume ? parseFloat(rankReqVolume) : undefined,
          dailyIncomeSalary: rankDailySalary ? parseFloat(rankDailySalary) : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server rejected updates.');
      }

      showNotification('success', 'Ranks system variables updated!');
      fetchSync();
    } catch (err: any) {
      showNotification('error', err.message || 'Ranks change error.');
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger AI Financial Auditor Check-up
  const triggerAiAudit = async () => {
    setAiAuditing(true);
    setAiAuditReport('');
    try {
      const res = await fetch('/api/admin/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        setAiAuditReport(data.auditReport);
        showNotification('success', 'AI Auditor risk verification completed!');
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      setAiAuditReport("Unable to launch the AI audit sequence currently.");
    } finally {
      setAiAuditing(false);
    }
  };

  // Calculations for current user metadata progress bars
  const getUserRankProgress = () => {
    if (!liveUser || !serverDb) return 0;
    const currentRankIdx = serverDb.ranks.findIndex(r => r.code === liveUser.rankCode);
    if (currentRankIdx === -1 || currentRankIdx === serverDb.ranks.length - 1) return 100;

    const nextRank = serverDb.ranks[currentRankIdx + 1];
    const totalEarnings = liveUser.earnings;
    const progressPct = (totalEarnings / nextRank.requiredEarnings) * 100;
    return Math.min(Math.round(progressPct), 100);
  };

  const getNextRankDetails = () => {
    if (!liveUser || !serverDb) return null;
    const currentRankIdx = serverDb.ranks.findIndex(r => r.code === liveUser.rankCode);
    if (currentRankIdx === -1 || currentRankIdx === serverDb.ranks.length - 1) return null;
    return serverDb.ranks[currentRankIdx + 1];
  };

  // --- RENDERING VIEWS ---

  // 1. GUEST GATEWAY SCREEN (Authentication Screen)
  if (!currentUser) {
    return (
      <div id="auth-gateway" className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-neutral-200 antialiased">
        
        {/* Toast Warning inside gateway */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-md border bg-white border-neutral-100 text-neutral-800">
            <span className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="text-xs font-semibold">{notification.message}</span>
          </div>
        )}

        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="inline-flex p-3 bg-neutral-900 text-white rounded-2xl shadow-sm mb-4">
            <Coins className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Aura Real-Time Earning Hub</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Secure investor multi-tier compound platform with auto confirmations.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-neutral-100 rounded-3xl sm:px-10">
            
            {/* View selectors */}
            <div className="flex border-b border-neutral-100 pb-4 mb-6">
              <button
                onClick={() => setAuthView('login')}
                className={`flex-1 text-center pb-2.5 text-xs font-extrabold uppercase tracking-widest ${
                  authView === 'login' ? 'border-b-2 border-neutral-900 text-neutral-900' : 'text-neutral-400'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthView('register')}
                className={`flex-1 text-center pb-2.5 text-xs font-extrabold uppercase tracking-widest ${
                  authView === 'register' ? 'border-b-2 border-neutral-900 text-neutral-900' : 'text-neutral-400'
                }`}
              >
                Sign Up
              </button>
            </div>

            {authView === 'register' ? (
              // Sign Up configuration
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-neutral-900 focus:ring-0 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition.all font-semibold text-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="e.g. name@domain.com"
                    className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-neutral-900 focus:ring-0 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition.all font-semibold text-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Type password"
                    className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-neutral-900 focus:ring-0 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition.all font-semibold text-neutral-800"
                  />
                </div>

                {authReferredBy && (
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 mb-1">Affiliate Inviter Code (Applied)</label>
                    <input
                      type="text"
                      value={authReferredBy}
                      onChange={(e) => setAuthReferredBy(e.target.value.toUpperCase())}
                      placeholder="REFERRAL CODE"
                      className="w-full bg-emerald-50/20 border border-emerald-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-all font-bold text-emerald-850 font-mono"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 px-4 bg-neutral-900 border border-neutral-900 text-white rounded-xl text-xs font-extrabold tracking-widest uppercase hover:bg-neutral-800 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-1 shadow-sm mt-3"
                >
                  {authLoading ? 'Creating secure vault...' : 'Complete Registration'}
                </button>
              </form>
            ) : (
              // Sign In form
              <form onSubmit={handleLogIn} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-neutral-900 focus:ring-0 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition.all font-semibold text-neutral-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Type password"
                    className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-neutral-900 focus:ring-0 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition.all font-semibold text-neutral-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 px-4 bg-neutral-900 border border-neutral-900 text-white rounded-xl text-xs font-extrabold tracking-widest uppercase hover:bg-neutral-800 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-1 shadow-sm mt-3"
                >
                  {authLoading ? 'Verifying node...' : 'Enter Hub'}
                </button>

                <div className="pt-3 border-t border-neutral-100 text-center">
                  <p className="text-[10px] text-neutral-400 leading-relaxed font-semibold">
                    Admin access: <code className="bg-neutral-50 p-0.5 rounded text-neutral-600">viralmock9535@gmail.com</code> with standard pass code.
                  </p>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    );
  }

  // 2. MAIN LOGGED-IN STUDIO PORTAL VIEW
  return (
    <div id="main-earning-app" className="min-h-screen bg-[#FAFAFA] text-neutral-800 antialiased flex flex-col font-sans selection:bg-neutral-200">
      
      {/* Dynamic top alert notification bar */}
      {notification && (
        <div 
          id="toast-notification-block" 
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 ${
            notification.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
              : 'bg-rose-50 border-rose-100 text-rose-800'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-bounce'}`} />
          <span className="text-xs font-extrabold">{notification.message}</span>
        </div>
      )}

      {/* Corporate Dashboard Top Navigation Banner */}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-40 shadow-sm px-4 md:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-neutral-900 text-white rounded-xl shadow-sm">
            <Coins className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-md md:text-lg font-black tracking-tight text-neutral-900">AURA</h1>
              <span className="text-[10px] bg-neutral-900 text-neutral-100 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest text-[9px]">
                Earning network
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                realtimeStatus.includes('CONNECTED') 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                  : 'bg-rose-50 border-rose-100 text-rose-600'
              }`}>
                ● {realtimeStatus}
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-semibold">Active Node Security Sync is fully operational.</p>
          </div>
        </div>

        {/* Global Control Center */}
        <div className="flex items-center gap-2.5">
          {currentUser.isAdmin && (
            <button
              onClick={() => setAdminMode(!adminMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                adminMode 
                  ? 'bg-amber-100 border border-amber-200 text-amber-800 hover:bg-amber-200' 
                  : 'bg-neutral-900 border border-neutral-950 text-white hover:bg-neutral-800 shadow-sm'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              {adminMode ? 'Enter User Platform' : 'Open Admin Panel'}
            </button>
          )}

          <div className="flex items-center gap-2 pl-2 border-l border-neutral-100 bg-neutral-50 px-3 py-1 rounded-lg">
            <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
            <div className="text-left">
              <p className="text-[10px] font-extrabold text-neutral-800 tracking-tight leading-none">{currentUser.fullName}</p>
              <span className="text-[8px] text-neutral-500 uppercase font-bold tracking-wider">
                {currentUser.isAdmin ? 'Security Admin' : `${liveUser?.rankCode || 'Bronze'} Investor`}
              </span>
            </div>
            <button
              onClick={handleLogOut}
              title="Log Out safely"
              className="p-1 px-1.5 rounded text-neutral-400 hover:text-neutral-900 transition-colors ml-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Structural Layout Grid */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex-1 flex flex-col gap-6">

        {/* SECTION A: SYSTEM ADMINISTRATOR CONTROL PANEL */}
        {adminMode && currentUser.isAdmin ? (
          <div id="admin-pulpit-panel" className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col gap-6">
            
            {/* Admin meta bar tabs selectors */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <button
                  onClick={() => setActiveAdminTab('requests')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5 transition ${
                    activeAdminTab === 'requests' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Transaction Approvals
                  {serverDb && serverDb.transactions.filter(t => t.status === 'pending').length > 0 && (
                    <span className="w-4.5 h-4.5 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                      {serverDb.transactions.filter(t => t.status === 'pending').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveAdminTab('plans')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5 transition ${
                    activeAdminTab === 'plans' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Plans Manager
                </button>
                <button
                  onClick={() => setActiveAdminTab('users')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5 transition ${
                    activeAdminTab === 'users' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  User Server Nodes
                </button>
                <button
                  onClick={() => setActiveAdminTab('ranks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5 transition ${
                    activeAdminTab === 'ranks' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Tier & Salaries Rules
                </button>
                <button
                  onClick={() => setActiveAdminTab('payment')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5 transition ${
                    activeAdminTab === 'payment' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Payment Gateway
                </button>
              </div>

              <button
                onClick={triggerAiAudit}
                disabled={aiAuditing}
                className="px-3.5 py-1.5 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-600" />
                {aiAuditing ? 'AI Auditing...' : 'Trigger AI Audit Check'}
              </button>
            </div>

            {/* AI AUTO AUDIT REPORT RESULT ROW */}
            {aiAuditReport && (
              <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl flex gap-3">
                <ShieldAlert className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-left text-xs text-purple-900 leading-relaxed font-semibold">
                  <p className="font-bold text-purple-950 uppercase tracking-wider text-[11px] mb-1">AI Financial risk audit ledger report:</p>
                  <p className="whitespace-pre-line">{aiAuditReport}</p>
                </div>
              </div>
            )}

            {/* Admin views switch */}
            {activeAdminTab === 'requests' && (
              <div className="flex flex-col gap-4">
                <div className="border border-neutral-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-neutral-50 px-4 py-3.5 border-b border-neutral-100 flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">Transaction requests queue (Real-time updates)</h3>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={exportTransactionsToCSV}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 font-extrabold uppercase tracking-wider text-white text-[10px] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs select-none"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        Export Transactions (CSV)
                      </button>
                      <span className="text-[10px] bg-neutral-200 text-neutral-700 px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap">
                        {serverDb?.transactions.length || 0} Requests Total
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-neutral-50/55 border-b border-neutral-100 text-[10px] uppercase tracking-wider text-neutral-400 font-extrabold">
                          <th className="p-4">User Details</th>
                          <th className="p-4">Channel & Type</th>
                          <th className="p-4">Amount (PKR)</th>
                          <th className="p-4">TID Reference Address</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {serverDb?.transactions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-neutral-400 font-semibold">
                              No transaction requests currently compiled on server.
                            </td>
                          </tr>
                        ) : (
                          serverDb?.transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-neutral-50/50 font-semibold">
                              <td className="p-4">
                                <p className="text-neutral-900 mb-0.5">{tx.userName}</p>
                                <p className="text-[10px] text-neutral-400">{tx.userEmail}</p>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                  tx.type === 'deposit' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {tx.type === 'deposit' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                  {tx.type} ({tx.paymentMethod})
                                </span>
                              </td>
                              <td className="p-4 text-neutral-900 text-sm font-extrabold">
                                {tx.amount.toLocaleString()} PKR
                              </td>
                              <td className="p-4 font-mono text-[11px] text-neutral-600">
                                <span className="flex items-center gap-1.5 justify-start">
                                  <span>{tx.payTID || 'N/A'}</span>
                                  {tx.payTID && (
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(tx.payTID!, 'Transaction TID')}
                                      className="p-1 text-[9px] font-bold text-neutral-450 hover:text-neutral-900 bg-neutral-100 rounded cursor-pointer transition"
                                      title="Copy Transaction ID"
                                    >
                                      Copy
                                    </button>
                                  )}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                                  tx.status === 'approved' ? 'text-emerald-600' : 
                                  tx.status === 'rejected' ? 'text-rose-600' : 'text-amber-500'
                                }`}>
                                  {tx.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  {tx.status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                                  {tx.status === 'pending' && <Clock className="w-3.5 h-3.5 animate-spin" />}
                                  {tx.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {tx.status === 'pending' ? (
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => processTransaction(tx.id, 'approve')}
                                      className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-1 rounded font-bold cursor-pointer transition-all"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => processTransaction(tx.id, 'reject')}
                                      className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 text-[10px] px-2.5 py-1 rounded font-bold cursor-pointer transition-all"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-neutral-400">Processed</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeAdminTab === 'plans' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Panel to setup investment product */}
                <form onSubmit={handlePlanSubmit} className="md:col-span-5 border border-neutral-100 rounded-2xl p-5 bg-neutral-50/50 flex flex-col gap-4 text-left">
                  <h3 className="text-xs uppercase tracking-wide font-black text-neutral-400 border-b border-neutral-150 pb-2">
                    {editingPlanId ? 'Edit Selected Package' : 'Register New Investment Plan'}
                  </h3>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Plan Package Name</label>
                    <input
                      type="text"
                      required
                      value={newPlanName}
                      onChange={(e) => setNewPlanName(e.target.value)}
                      placeholder="e.g. Diamond Ultra Yield Pro"
                      className="w-full bg-white border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs focus:outline-none transition.all font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Price (PKR)</label>
                      <input
                        type="number"
                        required
                        value={newPlanPrice}
                        onChange={(e) => setNewPlanPrice(e.target.value)}
                        placeholder="Cost"
                        className="w-full bg-white border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs focus:outline-none transition.all font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Weekly Profit (%)</label>
                      <input
                        type="number"
                        required
                        value={newPlanProfit}
                        onChange={(e) => setNewPlanProfit(e.target.value)}
                        placeholder="Profit %"
                        className="w-full bg-white border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs focus:outline-none transition.all font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Package Benefits Description</label>
                    <textarea
                      rows={3}
                      value={newPlanBenefits}
                      onChange={(e) => setNewPlanBenefits(e.target.value)}
                      placeholder="List benefits separated by commas"
                      className="w-full bg-white border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs focus:outline-none transition.all font-semibold resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    {editingPlanId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPlanId(null);
                          setNewPlanName('');
                          setNewPlanPrice('');
                          setNewPlanProfit('');
                          setNewPlanBenefits('');
                        }}
                        className="flex-1 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      {editingPlanId ? 'Update Package' : 'Publish Package'}
                    </button>
                  </div>
                </form>

                {/* Plan displays mapping */}
                <div className="md:col-span-7 flex flex-col gap-3">
                  <h3 className="text-xs uppercase tracking-wide font-black text-neutral-400 text-left px-1">Currently listed investment packages</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {serverDb?.plans.map((pl) => (
                      <div key={pl.id} className="border border-neutral-100 rounded-2xl p-4 bg-white hover:border-neutral-200 transition-all flex flex-col justify-between text-left shadow-xs">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-neutral-900 text-xs">{pl.name}</span>
                            <button
                              onClick={() => handleEditPlanClick(pl)}
                              className="text-neutral-400 hover:text-neutral-900 transition"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[10px] text-neutral-400 mt-0.5">ID: {pl.id}</p>
                          
                          <div className="my-3 flex items-baseline gap-1 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100/50">
                            <span className="text-xl font-black text-neutral-900">{pl.price.toLocaleString()}</span>
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400">PKR Cost</span>
                          </div>

                          <div className="text-[11px] text-emerald-600 font-extrabold mb-2.5 flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Yields {pl.weeklyProfitPercent}% compound profit weekly</span>
                          </div>

                          <p className="text-[11px] text-neutral-500 font-semibold line-clamp-2 leading-tight">
                            {pl.benefits}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {activeAdminTab === 'users' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
                
                {/* Manual updates user attributes panel */}
                <form onSubmit={handleUserVariablesAdjustment} className="md:col-span-5 border border-neutral-100 rounded-2xl p-5 bg-neutral-50/50 flex flex-col gap-4">
                  <h3 className="text-xs uppercase tracking-wide font-black text-neutral-400 border-b border-neutral-150 pb-2">Manual Servers Balance & Rank Adjuster</h3>
                  
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Select User Target</label>
                    <select
                      required
                      value={selectedAdjustUserId}
                      onChange={(e) => {
                        const targetUserObj = serverDb?.users.find(u => u.id === e.target.value);
                        setSelectedAdjustUserId(e.target.value);
                        if (targetUserObj) {
                          setAdjustBalance(targetUserObj.balance.toString());
                          setAdjustEarnings(targetUserObj.earnings.toString());
                          setAdjustRankCode(targetUserObj.rankCode);
                        }
                      }}
                      className="w-full bg-white border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs focus:outline-none font-semibold"
                    >
                      <option value="">-- Choose Investor --</option>
                      {serverDb?.users.map(u => (
                        <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Adjust Wallet Balance (PKR)</label>
                      <input
                        type="number"
                        value={adjustBalance}
                        onChange={(e) => setAdjustBalance(e.target.value)}
                        placeholder="PKR Amount"
                        className="w-full bg-white border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs focus:outline-none font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Adjust Earnings Ledger</label>
                      <input
                        type="number"
                        value={adjustEarnings}
                        onChange={(e) => setAdjustEarnings(e.target.value)}
                        placeholder="Volume"
                        className="w-full bg-white border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs focus:outline-none font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Set Investor Tier Rank</label>
                    <select
                      value={adjustRankCode}
                      onChange={(e) => setAdjustRankCode(e.target.value)}
                      className="w-full bg-white border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs focus:outline-none font-semibold"
                    >
                      <option value="">-- Choose Tier Code --</option>
                      {serverDb?.ranks.map(r => (
                        <option key={r.code} value={r.code}>{r.name} ({r.code})</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading || !selectedAdjustUserId}
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Set Variables Instant Update
                  </button>
                </form>

                {/* User nodes summary statistics table */}
                <div className="md:col-span-7 border border-neutral-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-neutral-50/65 px-4 py-3 border-b border-neutral-100 uppercase text-[10px] tracking-wider text-neutral-400 font-extrabold">
                    Currently monitored server users nodes
                  </div>
                  <div className="max-h-[350px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-neutral-55/40 border-b border-neutral-100 text-[9px] uppercase tracking-wider text-neutral-400 font-extrabold">
                          <th className="p-3">User Details</th>
                          <th className="p-3">Rank Tier</th>
                          <th className="p-3">Wallet / Earnings</th>
                          <th className="p-3">Plans Owned</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {serverDb?.users.map((u) => (
                          <tr key={u.id} className="hover:bg-neutral-50/20 font-semibold text-neutral-700">
                            <td className="p-3">
                              <p className="text-neutral-900 mb-0.5 leading-tight">{u.fullName}</p>
                              <p className="text-[10px] text-neutral-400">{u.email}</p>
                            </td>
                            <td className="p-3">
                              <span className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                {u.rankCode}
                              </span>
                            </td>
                            <td className="p-3">
                              <p className="text-neutral-900">PKR {u.balance.toLocaleString(undefined, { maximumFractionDigits: 1 })}</p>
                              <p className="text-[10px] text-neutral-400">Claims: PKR {u.earnings.toLocaleString(undefined, { maximumFractionDigits: 1 })}</p>
                            </td>
                            <td className="p-3 font-mono text-[10px] text-neutral-500">
                              {u.purchasedPlans.length} packages
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {activeAdminTab === 'ranks' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
                
                {/* Adjust limits for ranks form */}
                <form onSubmit={handleRankSetupSubmit} className="md:col-span-5 border border-neutral-100 rounded-2xl p-5 bg-neutral-50/50 flex flex-col gap-4">
                  <h3 className="text-xs uppercase tracking-wide font-black text-neutral-400 border-b border-neutral-150 pb-2">Ranks Boundaries & Salaries Calibration</h3>
                  
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Target Rank Tier Selection</label>
                    <select
                      value={activeRankSetupCode}
                      onChange={(e) => setActiveRankSetupCode(e.target.value)}
                      className="w-full bg-white border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs focus:outline-none font-semibold"
                    >
                      {serverDb?.ranks.map(r => (
                        <option key={r.code} value={r.code}>{r.name} ({r.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Required Min Career Earnings (PKR)</label>
                    <input
                      type="number"
                      value={rankReqEarnings}
                      onChange={(e) => setRankReqEarnings(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full bg-white border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs focus:outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Required Plans Purchase Volume (PKR)</label>
                    <input
                      type="number"
                      value={rankReqVolume}
                      onChange={(e) => setRankReqVolume(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full bg-white border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs focus:outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Adjustable Base Daily Salary Reward (PKR)</label>
                    <input
                      type="number"
                      value={rankDailySalary}
                      onChange={(e) => setRankDailySalary(e.target.value)}
                      placeholder="e.g. 400"
                      className="w-full bg-white border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs focus:outline-none font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Adjust Rank Values
                  </button>
                </form>

                {/* Rank settings displays */}
                <div className="md:col-span-7 flex flex-col gap-3">
                  <h3 className="text-xs uppercase tracking-wide font-black text-neutral-400 text-left px-1">Currently compiled rank guidelines guidelines</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {serverDb?.ranks.map((rk) => (
                      <div key={rk.code} className="border border-neutral-100 rounded-2xl p-4 bg-white flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-extrabold text-neutral-900 text-xs">{rk.name}</span>
                            <span className="text-[9px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-extrabold font-mono">{rk.code}</span>
                          </div>
                          
                          <div className="mt-3.5 space-y-2 text-[11px] font-semibold text-neutral-500">
                            <div className="flex justify-between border-b border-dashed border-neutral-100 pb-1">
                              <span>Req. Lifetime Earnings:</span>
                              <span className="text-neutral-950">PKR {rk.requiredEarnings.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b border-dashed border-neutral-100 pb-1">
                              <span>Req. Plans Volume:</span>
                              <span className="text-neutral-950">PKR {rk.requiredPlansVolume.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between pt-1">
                              <span>Daily Adjustable Salary:</span>
                              <span className="text-emerald-600 font-extrabold">PKR {rk.dailyIncomeSalary}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {activeAdminTab === 'payment' && (
              <div className="max-w-md text-left">
                <form onSubmit={handlePaymentSettingsUpdate} className="border border-neutral-100 rounded-2xl p-5 bg-neutral-50/50 flex flex-col gap-4">
                  <h3 className="text-xs uppercase tracking-wide font-black text-neutral-400 border-b border-neutral-150 pb-2">Global Payment Details Real-Time Modifiers</h3>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Payment Channel Method Name</label>
                    <input
                      type="text"
                      required
                      value={globalMethod}
                      onChange={(e) => setGlobalMethod(e.target.value)}
                      placeholder="e.g. Jazzcash"
                      className="w-full bg-white border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs focus:outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Receiver Account Holder Name</label>
                    <input
                      type="text"
                      required
                      value={globalName}
                      onChange={(e) => setGlobalName(e.target.value)}
                      placeholder="e.g. Saif Ali"
                      className="w-full bg-white border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs focus:outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Receiver Mobile / Account Number Code</label>
                    <input
                      type="text"
                      required
                      value={globalNumber}
                      onChange={(e) => setGlobalNumber(e.target.value)}
                      placeholder="e.g. 03404470109"
                      className="w-full bg-white border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs focus:outline-none font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Propagate Payment Credentials Real-time
                  </button>
                </form>
              </div>
            )}

          </div>
        ) : (
          /* SECTION B: INVESTOR CORE USER WORKSPACE COMPONENT */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* 1. Left Action / Navigation Rail Side Card */}
            <aside id="investor-left-rail" className="lg:col-span-3 flex flex-col gap-6">
              
              {/* Profile Overview Card */}
              <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.03)] flex flex-col items-center text-center gap-3">
                <div className="p-4 bg-neutral-950 text-white rounded-2xl shadow-sm relative">
                  <Award className="w-8 h-8" />
                  <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full text-[8px] font-bold px-1.5 py-0.5 border-2 border-white uppercase tracking-wider uppercase">
                    {liveUser?.rankCode || 'BRONZE'}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-neutral-900 tracking-tight leading-none mb-1">{currentUser.fullName}</h3>
                  <p className="text-[10px] text-neutral-400 font-semibold">{currentUser.email}</p>
                </div>

                {/* Display Current Rank Details & salaries */}
                {liveUser && serverDb && (
                  <div className="w-full border-t border-neutral-50 pt-3.5 space-y-2.5 text-xs font-semibold text-neutral-500 text-left">
                    <div className="bg-neutral-50 border border-neutral-100/60 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 leading-none mb-1">Rank Level Salary</p>
                        <p className="text-emerald-600 font-extrabold text-base leading-none">
                          {serverDb.ranks.find(r => r.code === liveUser.rankCode)?.dailyIncomeSalary || 0} PKR 
                          <span className="text-[9px] text-neutral-450 font-medium"> / day</span>
                        </p>
                      </div>
                      <div className="relative group">
                        <span className="p-1 px-1.5 bg-neutral-200/50 hover:bg-neutral-200 rounded-lg text-neutral-800 text-[10px] uppercase tracking-wider font-black font-mono flex items-center gap-1 cursor-help transition">
                          {liveUser.rankCode}
                          <Info className="w-3 h-3 text-neutral-500 hover:text-neutral-900" />
                        </span>
                        
                        {/* Interactive hover rank rules guide */}
                        <div className="absolute bottom-full right-0 mb-2 w-64 bg-neutral-900 text-white rounded-2xl p-4 shadow-xl border border-neutral-800 text-left opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-250 z-50">
                          <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 mb-2 border-b border-neutral-800 pb-1.5 flex items-center gap-1.5 font-sans">
                            <Award className="w-3.5 h-3.5" />
                            Aura Rank Matrix Index
                          </h5>
                          <div className="space-y-2">
                            {serverDb.ranks.map((r) => {
                              const isCurrent = r.code === liveUser.rankCode;
                              return (
                                <div key={r.code} className={`p-1.5 rounded-lg text-[10px] leading-relaxed transition ${isCurrent ? 'bg-neutral-800 border border-emerald-500/30 font-bold' : 'bg-transparent font-medium'}`}>
                                  <div className="flex justify-between items-center font-bold font-sans">
                                    <span className={isCurrent ? 'text-emerald-400 font-extrabold' : 'text-neutral-200'}>
                                      {r.name} {isCurrent && '(Current)'}
                                    </span>
                                    <span className="text-neutral-400 font-mono text-[9px]">{r.code}</span>
                                  </div>
                                  <div className="flex justify-between text-neutral-400 text-[9px] mt-0.5 font-sans font-semibold">
                                    <span>Salary: <span className="text-white font-bold">PKR {r.dailyIncomeSalary}/day</span></span>
                                    <span>Min Claims: <span className="text-white font-bold">{r.requiredEarnings.toLocaleString()} PKR</span></span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="absolute top-full right-4 w-3 h-3 bg-neutral-900 border-r border-b border-neutral-800 rotate-45 transform -translate-y-[6px]"></div>
                        </div>
                      </div>
                    </div>

                    {/* Progress to next Tier rank */}
                    {getNextRankDetails() ? (
                      <div className="space-y-1 bg-neutral-50/50 border border-neutral-100/40 rounded-xl p-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[9px] uppercase font-bold text-neutral-400">Yield Progress to {getNextRankDetails()?.name}</span>
                          <span className="text-[10px] text-black font-black">{getUserRankProgress()}%</span>
                        </div>
                        <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-neutral-900 h-full rounded-full transition-all" style={{ width: `${getUserRankProgress()}%` }} />
                        </div>
                        <p className="text-[9px] text-neutral-400 text-center mt-1">Requires {getNextRankDetails()?.requiredEarnings.toLocaleString()} PKR cumulative claims</p>
                      </div>
                    ) : (
                      <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-sky-800 font-extrabold uppercase tracking-wide">Diamond Level Elite Status</p>
                        <span className="text-[9px] text-sky-500 font-medium">You are earning the maximum possible daily tier salary!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Functional tabs navigation rail */}
              <div className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.03)] flex flex-col gap-1.5">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full text-left p-3 rounded-xl text-xs uppercase tracking-widest font-black flex items-center gap-3 transition-all cursor-pointer ${
                    activeTab === 'dashboard' ? 'bg-neutral-900 text-white shadow-sm font-black' : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  Dashboard Yields
                </button>
                <button
                  onClick={() => setActiveTab('plans')}
                  className={`w-full text-left p-3 rounded-xl text-xs uppercase tracking-widest font-black flex items-center gap-3 transition-all cursor-pointer ${
                    activeTab === 'plans' ? 'bg-neutral-900 text-white shadow-sm font-black' : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Investment Plans
                </button>
                <button
                  onClick={() => setActiveTab('deposit')}
                  className={`w-full text-left p-3 rounded-xl text-xs uppercase tracking-widest font-black flex items-center gap-3 transition-all cursor-pointer ${
                    activeTab === 'deposit' ? 'bg-neutral-900 text-white shadow-sm font-black' : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Request Deposit
                </button>
                <button
                  onClick={() => setActiveTab('withdrawal')}
                  className={`w-full text-left p-3 rounded-xl text-xs uppercase tracking-widest font-black flex items-center gap-3 transition-all cursor-pointer ${
                    activeTab === 'withdrawal' ? 'bg-neutral-900 text-white shadow-sm font-black' : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  Request Withdrawal
                </button>
                <button
                  onClick={() => setActiveTab('referrals')}
                  className={`w-full text-left p-3 rounded-xl text-xs uppercase tracking-widest font-black flex items-center gap-3 transition-all cursor-pointer ${
                    activeTab === 'referrals' ? 'bg-neutral-900 text-white shadow-sm font-black' : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Affiliate Program
                </button>
                <button
                  onClick={() => setActiveTab('support')}
                  className={`w-full text-left p-3 rounded-xl text-xs uppercase tracking-widest font-black flex items-center gap-3 transition-all cursor-pointer ${
                    activeTab === 'support' ? 'bg-neutral-900 text-white shadow-sm font-black' : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  AI Support Hub
                </button>
              </div>

            </aside>

            {/* 2. Main Tab View Section */}
            <main id="investor-main-view" className="lg:col-span-9 bg-white border border-neutral-100 rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between overflow-hidden min-h-[500px]">
              
              {/* Header inside workspace */}
              <div className="flex items-center justify-between border-b border-neutral-50 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-neutral-100 rounded-xl text-neutral-800">
                    {activeTab === 'dashboard' && <Compass className="w-4.5 h-4.5" />}
                    {activeTab === 'plans' && <Briefcase className="w-4.5 h-4.5" />}
                    {activeTab === 'deposit' && <ArrowUpRight className="w-4.5 h-4.5" />}
                    {activeTab === 'withdrawal' && <ArrowDownRight className="w-4.5 h-4.5" />}
                    {activeTab === 'support' && <MessageSquare className="w-4.5 h-4.5" />}
                    {activeTab === 'referrals' && <Users className="w-4.5 h-4.5" />}
                  </div>
                  <h2 className="text-xs uppercase tracking-widest font-black text-neutral-800">
                    {activeTab === 'dashboard' && 'Investor Balance Assets'}
                    {activeTab === 'plans' && 'High-Yield Aura Investment Matrix'}
                    {activeTab === 'deposit' && 'Durable Payment transfer Gateways Request'}
                    {activeTab === 'withdrawal' && 'Vault balance exit channel'}
                    {activeTab === 'support' && 'Aura AI Networks Support representative'}
                    {activeTab === 'referrals' && 'Affiliate referral network registry'}
                  </h2>
                </div>

                <div className="text-[10px] font-extrabold text-neutral-400 uppercase font-mono bg-neutral-100/50 px-2.5 py-1 rounded-lg">
                  PKR Wallet
                </div>
              </div>

              {/* Dynamic Workspace tab routing */}
              <div className="flex-1 flex flex-col justify-between overflow-y-auto min-h-[350px]">
                
                {/* 1. Dashboard Tab View */}
                {activeTab === 'dashboard' && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex-1 flex flex-col gap-6 text-left"
                  >
                    
                    {/* Live Earnings Stream Status Indicator */}
                    {liveUser?.purchasedPlans && liveUser.purchasedPlans.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2.5 bg-emerald-50/80 border border-emerald-100 rounded-2xl px-4 py-3 self-start text-[11px] font-bold text-emerald-800 shadow-xs"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="tracking-wide">Continuous Aura Matrix Yield active ! Earnings compound in real-time.</span>
                      </motion.div>
                    )}

                    {/* Vault Balance details matrices */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      
                      {/* Wallet Balance widget */}
                      <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-5 relative overflow-hidden shadow-xs">
                        <div className="absolute right-3.5 top-3.5 bg-neutral-900 text-white rounded-full p-1.5">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <h4 className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400">Total Liquid Wallet</h4>
                        <div className="mt-4 flex items-baseline gap-1.5 font-mono">
                          <span className="text-2xl font-black text-neutral-950">
                            {liveTickingBalance.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                          </span>
                          <span className="text-[9px] uppercase font-black text-neutral-450 tracking-wide font-sans">PKR</span>
                        </div>
                        <p className="text-[10px] text-neutral-450 mt-1 font-semibold">Available for purchases or instant exit requests.</p>
                      </div>

                      {/* Cumulative earnings ledger */}
                      <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-5 relative overflow-hidden shadow-xs">
                        <div className="absolute right-3.5 top-3.5 bg-emerald-500 text-white rounded-full p-1.5">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <h4 className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400">Accrued Cumulative earnings</h4>
                        <div className="mt-4 flex items-baseline gap-1.5 font-mono">
                          <span className="text-2xl font-black text-emerald-600">
                            {liveTickingEarnings.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                          </span>
                          <span className="text-[9px] uppercase font-black text-emerald-550 tracking-wide font-sans">PKR</span>
                        </div>
                        <p className="text-[10px] text-neutral-450 mt-1 font-semibold">Calculates plan profits, signals rank promotions.</p>
                      </div>

                      {/* Packages investment count */}
                      <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-5 relative overflow-hidden shadow-xs sm:col-span-2 lg:col-span-1">
                        <div className="absolute right-3.5 top-3.5 bg-neutral-900 text-white rounded-full p-1.5">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <h4 className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400">Active Investment Plans</h4>
                        <div className="mt-4 flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-neutral-900">{liveUser?.purchasedPlans.length || 0}</span>
                          <span className="text-[10px] uppercase font-extrabold text-neutral-400">active matrices</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1">Generating fractional yields continuously.</p>
                      </div>

                    </div>

                    {/* Recharts Yield Progression Series */}
                    {(() => {
                      const chartData = (liveUser?.earningsHistory || []).map(item => ({
                        date: item.date,
                        amount: item.amount
                      })).sort((a,b) => a.date.localeCompare(b.date));
                      
                      return (
                        <div id="chart-dashboard-yields" className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-xs flex flex-col gap-4 text-left">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-neutral-400">Yield Performance Telemetry</span>
                            <h4 className="text-sm font-black text-neutral-900 tracking-tight flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-emerald-500" />
                              30-Day Cumulative Daily Earnings Progress (PKR)
                            </h4>
                            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed font-semibold">
                              Visualizing continuous compounds, referral commission logs, and tier salary payouts over the last 30 days.
                            </p>
                          </div>

                          <div className="h-[200px] w-full flex items-center justify-center bg-neutral-50/20 rounded-xl p-2 border border-neutral-100">
                            {chartData.length === 0 ? (
                              <div className="text-center p-6 text-neutral-400 font-semibold flex flex-col items-center gap-1.5 justify-center">
                                <Activity className="w-7 h-7 text-neutral-300 stroke-[1.2] animate-pulse" />
                                <span className="text-xs">No yield telemetry data locked yet</span>
                                <p className="text-[9px] text-neutral-400/80 max-w-xs leading-normal">
                                  Purchase a high-yield plan or claim your daily tier salary. Real-time logging channels will populate this line telemetry.
                                </p>
                              </div>
                            ) : (
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -22, bottom: 4 }}>
                                  <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                  <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 600 }}
                                    stroke="#E5E7EB"
                                    tickLine={false}
                                    axisLine={false}
                                  />
                                  <YAxis 
                                    tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 600 }}
                                    stroke="#E5E7EB"
                                    tickLine={false}
                                    axisLine={false}
                                  />
                                  <Tooltip 
                                    contentStyle={{ 
                                      backgroundColor: '#171717', 
                                      border: 'none', 
                                      borderRadius: '12px', 
                                      color: '#fff',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      padding: '8px 12px'
                                    }}
                                    labelStyle={{ color: '#9CA3AF', fontSize: '9px', marginBottom: '2px' }}
                                  />
                                  <Area 
                                    type="monotone" 
                                    dataKey="amount" 
                                    stroke="#10B981" 
                                    strokeWidth={2} 
                                    fillOpacity={1} 
                                    fill="url(#colorAmount)" 
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Operational Daily Claim Actions & dynamic compound values */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* Daily Salary distribution portal */}
                      <div className="border border-neutral-100 rounded-2xl p-5 bg-neutral-50/50 flex flex-col justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-500" />
                            Daily Tier Salary Reward Station
                          </h4>
                          <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed font-semibold">
                            Collect your adjustable rank bonus once per calendar day. Keep earnings volume up to trigger promotion scaling!
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1 bg-white p-3 rounded-xl border border-neutral-100/50 relative overflow-visible">
                          <div>
                            <span className="text-[9px] uppercase tracking-wide font-extrabold text-neutral-400 flex items-center gap-1 leading-none mb-1">
                              <span>Your Claimable Salary Rate</span>
                              <div className="relative group inline-block">
                                <Info className="w-3 h-3 text-neutral-400 hover:text-neutral-600 cursor-help" />
                                
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-neutral-900 text-white rounded-2xl p-4 shadow-xl border border-neutral-800 text-left opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
                                  <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 mb-2 border-b border-neutral-800 pb-1.5 flex items-center gap-1.5 font-sans">
                                    <Award className="w-3.5 h-3.5 text-amber-400" />
                                    Rank Performance Salaries
                                  </h5>
                                  <div className="space-y-2">
                                    {serverDb?.ranks.map((r) => {
                                      const isCurrent = r.code === liveUser?.rankCode;
                                      return (
                                        <div key={r.code} className={`p-1.5 rounded-lg text-[10px] leading-relaxed transition ${isCurrent ? 'bg-neutral-800 border border-emerald-500/30 font-bold' : 'bg-transparent font-medium'}`}>
                                          <div className="flex justify-between items-center font-bold font-sans">
                                            <span className={isCurrent ? 'text-emerald-400' : 'text-neutral-200'}>
                                              {r.name} {isCurrent && '(Active)'}
                                            </span>
                                            <span className="text-neutral-400 font-mono text-[9px]">{r.code}</span>
                                          </div>
                                          <div className="flex justify-between text-neutral-400 text-[9px] mt-0.5 font-sans font-semibold">
                                            <span>Salary: <span className="text-white font-bold">PKR {r.dailyIncomeSalary}/day</span></span>
                                            <span>Min Earn: <span className="text-white font-bold">{r.requiredEarnings.toLocaleString()} PKR</span></span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-neutral-900 border-r border-b border-neutral-800 rotate-45 transform -translate-y-[6px]"></div>
                                </div>
                              </div>
                            </span>
                            <span className="text-base font-extrabold text-emerald-600 block leading-none font-mono font-sans mt-0.5">
                              PKR {(serverDb?.ranks.find(r => r.code === liveUser?.rankCode)?.dailyIncomeSalary || 0).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2 text-right relative">
                            {(() => {
                              const isSalaryClaimedToday = liveUser?.lastDailySalaryClaimedDate === new Date().toISOString().split('T')[0];
                              return (
                                <>
                                  <motion.button
                                    whileHover={!isSalaryClaimedToday ? { scale: 1.05 } : {}}
                                    whileTap={!isSalaryClaimedToday ? { scale: 0.95 } : {}}
                                    onClick={claimDailySalary}
                                    disabled={actionLoading || isSalaryClaimedToday}
                                    className={`px-4 py-2 text-[11px] font-extrabold uppercase tracking-widest rounded-xl transition cursor-pointer relative z-10 ${
                                      isSalaryClaimedToday 
                                      ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed' 
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10'
                                    }`}
                                  >
                                    {actionLoading ? 'Verifying Node...' : isSalaryClaimedToday ? 'Claimed Today' : 'Claim Daily Salary'}
                                  </motion.button>

                                  {isSalaryClaimedToday ? (
                                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-bold bg-neutral-100/50 border border-neutral-100 rounded-lg px-2 py-1 font-mono">
                                      <Clock className="w-3.5 h-3.5 text-neutral-400 animate-pulse" />
                                      <span>Next claim in: {salaryCountdown}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-extrabold uppercase tracking-wider animate-pulse">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                      <span>Available to claim!</span>
                                    </div>
                                  )}
                                </>
                              );
                            })()}

                            <AnimatePresence>
                              {floatingCoins.map((coin) => (
                                <motion.div
                                  key={coin.id}
                                  initial={{ opacity: 1, scale: 0.8, x: 0, y: 0 }}
                                  animate={{ opacity: 0, scale: 1.4, x: coin.x, y: coin.y }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 1.6, ease: "easeOut" }}
                                  className="absolute pointer-events-none text-xs font-black text-emerald-500 font-mono drop-shadow-[0_2px_6px_rgba(16,185,129,0.5)] z-20 whitespace-nowrap"
                                  style={{
                                    right: "24px",
                                    top: "-12px",
                                  }}
                                >
                                  {coin.text}
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      {/* Continuous compound monitor */}
                      <div className="border border-neutral-100 rounded-2xl p-5 bg-neutral-50/50 flex flex-col justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
                            <Activity className="w-4 h-4 text-sky-500 animate-pulse" />
                            Accruing Investment Matrix Yield Monitor
                          </h4>
                          <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed font-semibold">
                            Your purchased packages generates profit fractional seconds continuously. No action required, yield is automatically swept here!
                          </p>
                        </div>

                        {liveTickingPlans && liveTickingPlans.length > 0 ? (
                          <div className="space-y-1 bg-white border border-neutral-100 p-2.5 rounded-xl max-h-[140px] overflow-y-auto">
                            {liveTickingPlans.map((planObj, i) => {
                              const planMeta = serverDb?.plans.find(p => p.id === planObj.planId);
                              return (
                                <div key={i} className="flex justify-between text-[11px] font-semibold text-neutral-500 leading-normal border-b last:border-b-0 border-neutral-50 py-1.5 font-mono">
                                  <span className="truncate max-w-[120px] text-neutral-800 font-sans">{planMeta?.name || 'Venture'} node</span>
                                  <span className="text-emerald-500 font-extrabold">+ PKR {planObj.liveRevenue.toFixed(5)}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-white border border-neutral-100 p-4 rounded-xl text-center text-xs text-neutral-400">
                            No active investment plan matrices. Step into Plans tab to unlock profit yields.
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Transaction History display */}
                    <div className="border border-neutral-100 rounded-2xl overflow-hidden shadow-xs">
                      <div className="bg-neutral-50/50 px-4 py-3 border-b border-neutral-100 flex justify-between items-center text-[10px] uppercase tracking-wider text-neutral-400 font-extrabold">
                        <span>Your system requested history</span>
                        <span className="font-mono text-neutral-700">JazzCash Enabled</span>
                      </div>
                      <div className="max-h-[160px] overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs font-semibold text-neutral-700">
                          <thead>
                            <tr className="bg-neutral-100/30 border-b border-neutral-100 text-[9px] uppercase text-neutral-400 tracking-widest font-extrabold">
                              <th className="p-3">Reference ID</th>
                              <th className="p-3">Method & Type</th>
                              <th className="p-3">Amount Charged</th>
                              <th className="p-3">Date Submitted</th>
                              <th className="p-3 text-right">Status State</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {!serverDb?.transactions || serverDb.transactions.filter(t => t.userId === currentUser.id).length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-neutral-405 text-[11px]">
                                  No transaction request matrices submitted yet of this account.
                                </td>
                              </tr>
                            ) : (
                              serverDb.transactions.filter(t => t.userId === currentUser.id).map(tx => (
                                <tr key={tx.id} className="hover:bg-neutral-50/20">
                                  <td className="p-3 font-mono text-[10px] text-neutral-500">{tx.id}</td>
                                  <td className="p-3">
                                    <span className="text-[10px] uppercase tracking-wider font-extrabold">
                                      {tx.paymentMethod} {tx.type}
                                    </span>
                                    {tx.payTID && (
                                      <div className="flex items-center gap-1 mt-0.5 text-neutral-400 font-mono text-[9px]">
                                        <span>TID: {tx.payTID}</span>
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(tx.payTID!, 'Transaction TID')}
                                          className="text-[8px] bg-neutral-100 hover:bg-neutral-200 px-1 rounded text-neutral-650 transition cursor-pointer font-sans"
                                        >
                                          Copy
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 text-neutral-900 font-extrabold">PKR {tx.amount.toLocaleString()}</td>
                                  <td className="p-3 text-[10px] text-neutral-400">{new Date(tx.timestamp).toLocaleDateString()}</td>
                                  <td className="p-3 text-right">
                                    <span className={`text-[10px] font-extrabold uppercase tracking-wide ${
                                      tx.status === 'approved' ? 'text-emerald-600' :
                                      tx.status === 'rejected' ? 'text-rose-600' : 'text-amber-500'
                                    }`}>
                                      {tx.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </motion.div>
                )}

                {/* 2. Buy Investment Plans Tab View */}
                {activeTab === 'plans' && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex-1 flex flex-col gap-6 text-left"
                  >
                    <p className="text-xs text-neutral-450 leading-relaxed font-semibold max-w-xl">
                      Configure your capital into any of these dynamic high-yield matrices with auto confirmation. Weekly earnings percent dividends will compound and accrue instantly into your vault!
                    </p>



                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {serverDb?.plans.map((pl) => {
                        const ownedCount = liveUser?.purchasedPlans.filter(p => p.planId === pl.id).length || 0;
                        const ownsThis = ownedCount > 0;
                        return (
                          <div 
                            key={pl.id} 
                            className={`border rounded-2xl p-5 flex flex-col justify-between hover:scale-[1.01] transition-all bg-white relative ${
                              ownsThis ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/30' : 'border-neutral-100 shadow-xs'
                            }`}
                          >
                            {ownsThis && (
                              <span className="absolute top-3.5 right-3.5 bg-emerald-600 text-white text-[9px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                                {ownedCount} Active Node{ownedCount > 1 ? 's' : ''}
                              </span>
                            )}

                            <div>
                              <h4 className="text-sm font-extrabold text-neutral-900 tracking-tight leading-none mb-1.5">{pl.name}</h4>
                              <p className="text-[9px] text-neutral-400 font-extrabold uppercase font-mono">Quantum Node Plan</p>
                              
                              <div className="my-4 bg-neutral-50 p-3 rounded-xl border border-neutral-100/50">
                                <span className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-450 block leading-none mb-1">Required Investment</span>
                                <span className="text-2xl font-black text-neutral-950 font-mono">PKR {pl.price.toLocaleString()}</span>
                              </div>

                              <div className="space-y-1.5 text-[11px] font-semibold text-neutral-500 mb-5">
                                <div className="flex justify-between border-b border-dashed border-neutral-100 pb-1 text-emerald-600 font-black">
                                  <span>Weekly Profit Yield:</span>
                                  <span>{pl.weeklyProfitPercent}% compound</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-neutral-100 pb-1">
                                  <span>Estimated Weekly Income:</span>
                                  <span className="text-neutral-950 font-bold">PKR {((pl.price * pl.weeklyProfitPercent) / 100).toLocaleString()}</span>
                                </div>
                                {/* Expandable Benefits Accordion List View */}
                                <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-col gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedPlanIds(prev => ({
                                        ...prev,
                                        [pl.id]: !prev[pl.id]
                                      }));
                                    }}
                                    className="w-full flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors select-none"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                      {expandedPlanIds[pl.id] ? 'Collapse Benefits' : 'View Core Benefits'}
                                    </span>
                                    {expandedPlanIds[pl.id] ? (
                                      <ChevronUp className="w-4 h-4 text-neutral-500" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-neutral-500" />
                                    )}
                                  </button>

                                  <AnimatePresence initial={false}>
                                    {expandedPlanIds[pl.id] && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: "easeInOut" }}
                                        className="overflow-hidden mt-2"
                                      >
                                        <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100/70 flex flex-col gap-2">
                                          <span className="text-[9px] uppercase tracking-wider text-neutral-450 font-extrabold block">Included matrix privileges:</span>
                                          {pl.benefits ? (
                                            pl.benefits.split(',').map((benefit, bIdx) => {
                                              const trimmed = benefit.trim();
                                              if (!trimmed) return null;
                                              return (
                                                <div key={bIdx} className="flex items-start gap-2">
                                                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                  <span className="text-[11px] font-semibold text-neutral-700 leading-snug">
                                                    {trimmed}
                                                  </span>
                                                </div>
                                              );
                                            })
                                          ) : (
                                            <div className="flex items-start gap-2">
                                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                              <span className="text-[11px] font-semibold text-neutral-700 leading-snug">
                                                Standard high-yield node premium features
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handlePurchasePlan(pl.id)}
                              disabled={actionLoading || (liveUser && liveUser.balance < pl.price)}
                              className="w-full py-2.5 rounded-xl font-extrabold text-[11px] uppercase tracking-widest transition cursor-pointer bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-40"
                            >
                              {liveUser && liveUser.balance < pl.price ? 'Sufficient Balance Missing' : 'Purchase Plan'}
                            </motion.button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* 3. Deposit Request View Tab */}
                {activeTab === 'deposit' && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left"
                  >
                    
                    {/* Active payment details view */}
                    <div className="md:col-span-5 border border-neutral-105/85 rounded-2xl p-5 bg-neutral-50/50 flex flex-col justify-between text-left gap-4">
                      <div>
                        <h4 className="text-xs uppercase tracking-widest font-extrabold text-neutral-400 mb-1 leading-none">Gateway coordinates</h4>
                        <h3 className="text-sm font-black text-neutral-900 tracking-tight">Active Receiver Channel</h3>
                        <p className="text-[11px] text-neutral-400 mt-1.5 font-semibold">
                          Please initiate exactly the amount PKR transfer from your mobile app. Take screenshot and paste the transaction reference TID sequence.
                        </p>
                      </div>

                      <div className="bg-white border border-neutral-100 rounded-xl p-4 space-y-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <QrCode className="w-9 h-9 text-neutral-400 mr-1" />
                          <div>
                            <span className="text-[9px] uppercase tracking-wide font-extrabold text-neutral-400 leading-none block mb-1">Payment Method Gateway</span>
                            <span className="text-xs font-black text-neutral-900 leading-none">{serverDb?.payment.methodName || 'Jazzcash'}</span>
                          </div>
                        </div>

                        <div className="border-t border-neutral-50 pt-2.5 space-y-2 text-xs font-semibold text-neutral-500">
                          <div className="flex justify-between">
                            <span>Account Details:</span>
                            <p className="text-neutral-950 font-black">{serverDb?.payment.accountName || 'Saif Ali'}</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Account No:</span>
                            <div className="flex items-center gap-1.5">
                              <p className="text-neutral-950 font-black font-mono select-all text-xs bg-neutral-50 p-1 px-1.5 rounded border border-neutral-100">{serverDb?.payment.accountNumber || '03404470109'}</p>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(serverDb?.payment.accountNumber || '03404470109', 'Account Number')}
                                className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-[10px] font-bold rounded cursor-pointer transition select-none"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800 font-semibold leading-relaxed">
                        ⚠️ DO NOT claim or input wrong TID. Submitting falsified coordinates will lead to immediate node credentials termination on user servers.
                      </div>
                    </div>

                    {/* Deposit request submission form */}
                    <form onSubmit={handleDepositSubmit} className="md:col-span-7 flex flex-col gap-4">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Transfer Amount (PKR)</label>
                        <input
                          type="number"
                          required
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="e.g. 5000"
                          className="w-full bg-neutral-50/50 border border-neutral-250 focus:border-neutral-900 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition.all font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Payment Transaction ID (Pay TID)</label>
                        <input
                          type="text"
                          required
                          value={depositPayTID}
                          onChange={(e) => setDepositPayTID(e.target.value)}
                          placeholder="e.g. 84260341857"
                          className="w-full bg-neutral-50/50 border border-neutral-250 focus:border-neutral-900 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition.all font-semibold font-mono"
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={actionLoading || !depositAmount || !depositPayTID}
                        className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-45 text-white text-xs font-extrabold uppercase tracking-widest tracking-wider rounded-xl transition cursor-pointer mt-1"
                      >
                        {actionLoading ? 'Verifying coordinates...' : 'Submit Deposit Proof Packet'}
                      </motion.button>
                    </form>

                  </motion.div>
                )}

                {/* 4. Withdrawal Request View Tab */}
                {activeTab === 'withdrawal' && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="max-w-md flex flex-col"
                  >
                    <form onSubmit={handleWithdrawalSubmit} className="flex flex-col gap-4 text-left">
                    <p className="text-xs text-neutral-400 leading-relaxed font-semibold mb-1">
                      Exit liquid assets from your balance ledger directly to your mobile wallets accounts. Limits apply on daily payouts intervals. Required pending processing is less than 30 minutes.
                    </p>

                    <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-100 mb-2">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-450 block mb-1">Your Claimable Balance</span>
                        <span className="text-lg font-black text-neutral-900">{liveUser?.balance.toLocaleString(undefined, { maximumFractionDigits: 1 }) || '0.0'} PKR</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-450 block mb-1">Active Gateway</span>
                        <span className="text-xs font-black text-neutral-900 block mt-1">JazzCash & Easypaisa</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Withdrawal PKR Amount</label>
                      <input
                        type="number"
                        required
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        placeholder="e.g. 2000"
                        className="w-full bg-neutral-50/50 border border-neutral-250 focus:border-neutral-900 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition.all font-semibold text-neutral-800"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Recipient Account Numbers Details</label>
                      <input
                        type="text"
                        required
                        value={withdrawalAccount}
                        onChange={(e) => setWithdrawalAccount(e.target.value)}
                        placeholder="e.g. JazzCash No: 03001234567, Name: Ahmed"
                        className="w-full bg-neutral-50/50 border border-neutral-250 focus:border-neutral-900 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition.all font-semibold text-neutral-800"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={actionLoading || !withdrawalAmount || (liveUser && liveUser.balance < parseFloat(withdrawalAmount))}
                      className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-45 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition cursor-pointer mt-1"
                    >
                      {actionLoading ? 'Locking assets...' : 'Initiate Secure Exit'}
                    </motion.button>
                  </form>
                </motion.div>
              )}

                {/* 6. Affiliate Referrals Tab View */}
                {activeTab === 'referrals' && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex-1 flex flex-col gap-6 text-left"
                  >
                    <p className="text-xs text-neutral-450 leading-relaxed font-semibold max-w-xl">
                      Boost your yields by onboarding network sponsors! Share your customized referral code to instantly secure <span className="text-emerald-600 font-black">10% commissions</span> on everything your affiliates deposit.
                    </p>

                    {/* Stats summary section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-5 relative overflow-hidden shadow-xs">
                        <div className="absolute right-3.5 top-3.5 bg-neutral-900 text-white rounded-full p-1.5">
                          <Users className="w-4 h-4" />
                        </div>
                        <h4 className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400">Total Affiliates Recruited</h4>
                        <div className="mt-4 flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-neutral-950 font-mono">
                            {(serverDb?.users.filter(u => u.referredBy === liveUser?.id || u.referredBy === liveUser?.referralCode) || []).length}
                          </span>
                          <span className="text-[9px] uppercase font-black text-neutral-450 tracking-wide">Users</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1">Direct second-tier ledger active connections.</p>
                      </div>

                      <div className="bg-[#FAFDFB] border border-emerald-100 rounded-2xl p-5 relative overflow-hidden shadow-xs">
                        <div className="absolute right-3.5 top-3.5 bg-emerald-500 text-white rounded-full p-1.5">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <h4 className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-700">Accumulated Referral Commissions</h4>
                        <div className="mt-4 flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-emerald-600 font-mono">
                            {liveUser?.totalReferralEarnings.toLocaleString(undefined, { minimumFractionDigits: 1 }) || '0.0'}
                          </span>
                          <span className="text-[9px] uppercase font-black text-emerald-500 tracking-wide">PKR</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1">Paid instantly to your direct cashable balance.</p>
                      </div>

                      <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-5 relative overflow-hidden shadow-xs sm:col-span-2 lg:col-span-1">
                        <div className="absolute right-3.5 top-3.5 bg-neutral-900 text-white rounded-full p-1.5">
                          <Award className="w-4 h-4" />
                        </div>
                        <h4 className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400">Direct Commission Rate</h4>
                        <div className="mt-4 flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-neutral-900">10%</span>
                          <span className="text-[10px] uppercase font-extrabold text-neutral-400">on active deposits</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1">Multi-tier payouts verified by corporate auditor.</p>
                      </div>
                    </div>

                    {/* Sharing interface & links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="border border-neutral-100 rounded-2xl p-5 bg-neutral-50/50 flex flex-col justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-extrabold text-neutral-900 tracking-tight font-sans">Your Invite Coordinates</h4>
                          <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed font-semibold">
                            Copy and share your unique credentials below. New users arriving over this address will auto-prefill your code on their registration gateway.
                          </p>
                        </div>

                        <div className="space-y-3 bg-white border border-neutral-100 p-4 rounded-xl">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1">Your Referral Code</span>
                            <div className="flex items-center justify-between bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                              <span className="font-mono text-xs font-black text-neutral-900">{liveUser?.referralCode || 'N/A'}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(liveUser?.referralCode || '', 'Referral Code')}
                                className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-bold rounded cursor-pointer transition select-none"
                              >
                                Copy Code
                              </button>
                            </div>
                          </div>
                        </div>

                        {liveUser?.referredBy && (
                          <div className="bg-emerald-50 border border-emerald-150 p-2.5 rounded-xl text-[10px] text-emerald-800 font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>System node linked: invited by sponsor {liveUser.referredBy}</span>
                          </div>
                        )}
                      </div>

                      {/* Realtime referrers list */}
                      <div className="border border-neutral-100 rounded-2xl p-5 bg-neutral-50/50 flex flex-col justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-extrabold text-neutral-900 tracking-tight font-sans">Your Direct Active Referrals</h4>
                          <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed font-semibold font-sans">
                            These investors have registered using your active link coordinates.
                          </p>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[170px] bg-white border border-neutral-100 rounded-xl">
                          {(() => {
                            const invitedUsers = serverDb?.users.filter(u => u.referredBy === liveUser?.id || u.referredBy === liveUser?.referralCode) || [];
                            if (invitedUsers.length === 0) {
                              return (
                                <div className="h-full py-10 flex flex-col items-center justify-center text-center text-neutral-400 font-semibold gap-1">
                                  <Users className="w-6 h-6 text-neutral-300 stroke-[1.2]" />
                                  <span className="text-[11px] font-sans">No affiliate connections parsed currently</span>
                                </div>
                              );
                            }
                            return (
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-neutral-50 border-b border-neutral-100 text-[9px] uppercase tracking-wider text-neutral-400 font-extrabold">
                                    <th className="p-2.5 font-sans">Affiliate Name</th>
                                    <th className="p-2.5 font-sans">User Code</th>
                                    <th className="p-2.5 text-right font-sans font-sans">Yield Generated</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-50">
                                  {invitedUsers.map((inv, i) => (
                                    <tr key={i} className="hover:bg-neutral-50/20 font-semibold text-neutral-700">
                                      <td className="p-2.5">
                                        <p className="font-extrabold text-neutral-900 leading-tight font-sans">{inv.fullName}</p>
                                        <p className="text-[9px] text-neutral-400 font-mono italic">Reg: {new Date(inv.joinedDate).toLocaleDateString()}</p>
                                      </td>
                                      <td className="p-2.5 font-mono text-[10px] text-neutral-500">{inv.referralCode}</td>
                                      <td className="p-2.5 text-right font-bold text-emerald-600 font-mono">
                                        + PKR {((inv.earnings * 0.1) || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 5. Support chatbot assistant */}
                {activeTab === 'support' && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex-1 flex flex-col justify-between overflow-hidden gap-4"
                  >
                    
                    {/* Live system state warning/status badge */}
                    <div className="p-3 bg-neutral-50/55 border border-neutral-100 rounded-xl text-left flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-neutral-400" />
                      <span className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-wide">Aura AI Agent is fully connected over servers pipeline</span>
                    </div>

                    {/* Chat view frame */}
                    <div className="flex-1 max-h-[220px] overflow-y-auto bg-neutral-50/40 p-4 rounded-2xl border border-dashed border-neutral-200/60 space-y-3.5 text-left text-xs">
                      {supportChat.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-6 text-neutral-400 font-semibold gap-1.5">
                          <MessageSquare className="w-7 h-7 text-neutral-300 stroke-[1.2]" />
                          <span>How can we assist you with investment yields today?</span>
                          <p className="text-[9px] text-neutral-400/80 max-w-xs mt-0.5">Enter your questions below. Our Gemini representative is standing by to resolve deposit validations prompt.</p>
                        </div>
                      ) : (
                        supportChat.map((msg, i) => (
                          <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-xl px-3.5 py-2 leading-relaxed shadow-xs ${
                              msg.sender === 'user' 
                                ? 'bg-neutral-900 text-white rounded-tr-none' 
                                : 'bg-white border border-neutral-100 text-neutral-700 rounded-tl-none font-semibold'
                            }`}>
                              <p className="whitespace-pre-line">{msg.text}</p>
                              <span className="block text-[8px] text-right mt-1 opacity-70 font-mono">{msg.timestamp}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Chat submit channel */}
                    <form onSubmit={handleSupportMessage} className="flex gap-2.5 items-center bg-neutral-50/50 p-2 border border-neutral-200 rounded-2xl">
                      <input
                        type="text"
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        placeholder="Say e.g. How does Sliver Rank salary multipliers work?"
                        className="flex-1 bg-transparent px-3 py-1.5 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!supportMessage.trim()}
                        className="p-2 bg-neutral-950 text-white hover:bg-neutral-800 disabled:opacity-40 rounded-xl transition cursor-pointer flex items-center justify-center"
                      >
                        <Send className="w-4 h-4 cursor-pointer" />
                      </motion.button>
                    </form>

                  </motion.div>
                )}

              </div>
            </main>

          </div>
        )}

      </div>

      {/* Corporate Platform Footer block */}
      <footer className="bg-white border-t border-neutral-150 py-4.5 text-center mt-auto">
        <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest text-[9px]">AURA INVESTOR NETWORK CO. LTD © 2026. ALL RIGHTS RESERVED.</p>
      </footer>

    </div>
  );
}
