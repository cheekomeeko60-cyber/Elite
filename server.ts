import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Define Database Path & Initial Structures ---
const DB_PATH = path.resolve(__dirname, 'db.json');

interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string; // Plain for simple workspace verification
  balance: number;
  earnings: number;
  rankCode: string; // 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'
  purchasedPlans: {
    planId: string;
    purchasePrice: number;
    purchaseDate: string;
    lastProfitClaimDate: string; // ISO string
    revenueGenerated: number;
  }[];
  lastDailySalaryClaimedDate: string | null; // Date string: YYYY-MM-DD
  joinedDate: string;
  isAdmin: boolean;
  referralCode: string;
  referredBy: string | null;
  totalReferralEarnings: number;
  earningsHistory?: { date: string; amount: number }[];
}

interface Plan {
  id: string;
  name: string;
  price: number;
  weeklyProfitPercent: number;
  benefits: string;
}

interface RankConfiguration {
  code: string;
  name: string;
  requiredEarnings: number;
  requiredPlansVolume: number;
  dailyIncomeSalary: number;
}

interface TransactionRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  payTID?: string; // Optional for deposits
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

interface PaymentDetails {
  methodName: string;
  accountName: string;
  accountNumber: string;
}

interface LiveDB {
  users: User[];
  plans: Plan[];
  ranks: RankConfiguration[];
  transactions: TransactionRequest[];
  payment: PaymentDetails;
}

// Default initial database content
const DEFAULT_DB: LiveDB = {
  users: [
    {
      id: 'admin-node',
      fullName: 'System Administrator',
      email: 'viralmock9535@gmail.com',
      passwordHash: '9535',
      balance: 100000,
      earnings: 25000,
      rankCode: 'DIAMOND',
      purchasedPlans: [],
      lastDailySalaryClaimedDate: null,
      joinedDate: '2026-05-23T10:00:00Z',
      isAdmin: true,
      referralCode: 'ADMIN9535',
      referredBy: null,
      totalReferralEarnings: 0
    }
  ],
  plans: [
    { id: 'plan-basic', name: 'Starter Venture', price: 1500, weeklyProfitPercent: 12, benefits: 'Bronze rank enhancer, 1.2x claim speed' },
    { id: 'plan-advance', name: 'Apex Growth Matrix', price: 6000, weeklyProfitPercent: 20, benefits: 'Silver rank promotion, 1.5x claim multipliers' },
    { id: 'plan-elite', name: 'Infinite Quantum Yield', price: 20000, weeklyProfitPercent: 35, benefits: 'Immediate Premium status, priority withdrawal channel' }
  ],
  ranks: [
    { code: 'BRONZE', name: 'Bronze Novice', requiredEarnings: 0, requiredPlansVolume: 0, dailyIncomeSalary: 10 },
    { code: 'SILVER', name: 'Silver Catalyst', requiredEarnings: 1500, requiredPlansVolume: 1500, dailyIncomeSalary: 85 },
    { code: 'GOLD', name: 'Gold Pinnacle', requiredEarnings: 6000, requiredPlansVolume: 7500, dailyIncomeSalary: 320 },
    { code: 'PLATINUM', name: 'Platinum Sovereign', requiredEarnings: 20000, requiredPlansVolume: 20000, dailyIncomeSalary: 950 },
    { code: 'DIAMOND', name: 'Diamond Overlord', requiredEarnings: 50000, requiredPlansVolume: 50000, dailyIncomeSalary: 2500 }
  ],
  transactions: [],
  payment: {
    methodName: 'Jazzcash',
    accountName: 'Saif Ali',
    accountNumber: '03404470109'
  }
};

function updateEarningsHistory(user: User, amountEarned: number) {
  if (!user.earningsHistory) {
    user.earningsHistory = [];
  }
  const todayStr = new Date().toISOString().split('T')[0];
  const existingDay = user.earningsHistory.find(h => h.date === todayStr);
  if (existingDay) {
    existingDay.amount = Number((existingDay.amount + amountEarned).toFixed(2));
  } else {
    user.earningsHistory.push({ date: todayStr, amount: Number(amountEarned.toFixed(2)) });
  }
  if (user.earningsHistory.length > 30) {
    user.earningsHistory = user.earningsHistory.slice(-30);
  }
}

function getOrInitializeEarningsHistory(user: User): { date: string; amount: number }[] {
  if (!user.earningsHistory || user.earningsHistory.length < 15) {
    const history: { date: string; amount: number }[] = [];
    const baseEarnings = user.earnings || 0;
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const ratio = (30 - i) / 30; // 1/30 to 30/30
      const calculatedCumulative = Math.round(baseEarnings * ratio * 10) / 10;
      history.push({
        date: dateStr,
        amount: Math.min(calculatedCumulative, baseEarnings)
      });
    }
    user.earningsHistory = history;
  }
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntryIdx = user.earningsHistory.findIndex(h => h.date === todayStr);
  if (todayEntryIdx !== -1) {
    user.earningsHistory[todayEntryIdx].amount = Number(user.earnings.toFixed(2));
  } else {
    user.earningsHistory.push({ date: todayStr, amount: Number(user.earnings.toFixed(2)) });
    if (user.earningsHistory.length > 30) {
      user.earningsHistory.shift();
    }
  }
  return user.earningsHistory;
}

// Ensure database file exists
function loadDatabase(): LiveDB {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      // Ensure essential default attributes exist
      if (!parsed.users) parsed.users = DEFAULT_DB.users;
      if (!parsed.plans) parsed.plans = DEFAULT_DB.plans;
      if (!parsed.ranks) parsed.ranks = DEFAULT_DB.ranks;
      if (!parsed.transactions) parsed.transactions = DEFAULT_DB.transactions;
      if (!parsed.payment) parsed.payment = DEFAULT_DB.payment;

      let updatedUsers = false;
      parsed.users = parsed.users.map((u: User) => {
        let changed = false;
        if (u.email.toLowerCase() === 'viralmock9535@gmail.com') {
          if (u.passwordHash !== '9535') {
            u.passwordHash = '9535';
            changed = true;
          }
        }
        if (!u.referralCode) {
          const firstWord = u.fullName.split(' ')[0] || 'USER';
          u.referralCode = 'AURA-' + firstWord.toUpperCase() + Math.floor(100 + Math.random() * 900);
          changed = true;
        }
        if (u.referredBy === undefined) {
          u.referredBy = null;
          changed = true;
        }
        if (u.totalReferralEarnings === undefined) {
          u.totalReferralEarnings = 0;
          changed = true;
        }
        if (!u.earningsHistory || u.earningsHistory.length < 15) {
          getOrInitializeEarningsHistory(u);
          changed = true;
        }
        if (changed) {
          updatedUsers = true;
        }
        return u;
      });

      if (updatedUsers) {
        fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
      }

      return parsed;
    }
  } catch (e) {
    console.error('Error loading database file. Reverting to initial setup.', e);
  }
  // Fallback to write defaults
  saveDatabase(DEFAULT_DB);
  return DEFAULT_DB;
}

function saveDatabase(db: LiveDB) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    // Notify all active SSE clients of real-time update
    broadcastRealtimeUpdate(db);
  } catch (e) {
    console.error('Failed to save state to db.json', e);
  }
}

// --- Server Sent Events (SSE) Real-time Stream Network Hub ---
let sseClients: any[] = [];

function registerSseClient(req: express.Request, res: express.Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Keep-alive tick
  const keepAliveInterval = setInterval(() => {
    res.write(':\n\n');
  }, 15000);

  const clientId = Date.now().toString();
  const clientObj = { id: clientId, res };
  sseClients.push(clientObj);

  // Send initial sync event down the pipeline
  const currentDb = loadDatabase();
  res.write(`event: sync\ndata: ${JSON.stringify(currentDb)}\n\n`);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
}

function broadcastRealtimeUpdate(updatedDb: LiveDB) {
  const dataPayload = JSON.stringify(updatedDb);
  sseClients.forEach(client => {
    try {
      client.res.write(`event: update\ndata: ${dataPayload}\n\n`);
    } catch (e) {
      // client broken connection, will be culled naturally on close or error
    }
  });
}

async function startServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';
  const port = 3000;

  app.use(express.json({ limit: '50mb' }));

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // --- REST ENDPOINTS ---

  // Standard health diagnostics view
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      keyAvailable: !!apiKey,
      connectionsCount: sseClients.length,
      timestamp: new Date().toISOString()
    });
  });

  // SSE SSE Live Stream Pipeline mountpoint
  app.get('/api/realtime/stream', (req, res) => {
    registerSseClient(req, res);
  });

  // Static API to manually fetch current database
  app.get('/api/sync/get', (req, res) => {
    const db = loadDatabase();
    res.json(db);
  });

  // Action Auth Register
  app.post('/api/auth/register', (req, res) => {
    try {
      const { fullName, email, password, referredByCode } = req.body;
      if (!fullName || !email || !password) {
        return res.status(400).json({ error: 'All credential fields are required.' });
      }

      const db = loadDatabase();
      const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ error: 'This email account is already registered.' });
      }

      const firstWord = fullName.split(' ')[0] || 'USER';
      const referralCode = 'AURA-' + firstWord.toUpperCase() + Math.floor(100 + Math.random() * 900);
      
      let referredById: string | null = null;
      if (referredByCode) {
        const referrer = db.users.find(u => u.referralCode === referredByCode.trim().toUpperCase() || u.id === referredByCode.trim());
        if (referrer) {
          referredById = referrer.id;
        }
      }

      const newUser: User = {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        fullName,
        email: email.trim(),
        passwordHash: password, // Simple plain password storage for prompt spec
        balance: 0,
        earnings: 0,
        rankCode: 'BRONZE',
        purchasedPlans: [],
        lastDailySalaryClaimedDate: null,
        joinedDate: new Date().toISOString(),
        isAdmin: email.toLowerCase() === 'viralmock9535@gmail.com',
        referralCode,
        referredBy: referredById,
        totalReferralEarnings: 0
      };

      db.users.push(newUser);
      saveDatabase(db);
      res.json({ success: true, user: { id: newUser.id, fullName: newUser.fullName, email: newUser.email, isAdmin: newUser.isAdmin } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Action Auth Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password credentials are required.' });
      }

      const db = loadDatabase();
      
      // Override check for designated admin account credentials
      if (email.trim() === 'viralmock9535@gmail.com' && password === '9535') {
        let adminUser = db.users.find(u => u.email.toLowerCase() === 'viralmock9535@gmail.com');
        if (!adminUser) {
          adminUser = {
            id: 'admin-node',
            fullName: 'System Administrator',
            email: 'viralmock9535@gmail.com',
            passwordHash: '9535',
            balance: 100000,
            earnings: 25000,
            rankCode: 'DIAMOND',
            purchasedPlans: [],
            lastDailySalaryClaimedDate: null,
            joinedDate: new Date().toISOString(),
            isAdmin: true,
            referralCode: 'ADMIN9535',
            referredBy: null,
            totalReferralEarnings: 0
          };
          db.users.push(adminUser);
          saveDatabase(db);
        }
        return res.json({ success: true, user: { id: adminUser.id, fullName: adminUser.fullName, email: adminUser.email, isAdmin: true } });
      }

      const matched = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim() && u.passwordHash === password);
      if (!matched) {
        return res.status(400).json({ error: 'Invalid email address or passcode sequence.' });
      }

      res.json({ success: true, user: { id: matched.id, fullName: matched.fullName, email: matched.email, isAdmin: matched.isAdmin } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Recalculate automatic weekly profits on each user access to reflect live percentage gains
  app.post('/api/user/recalculate-accruals', (req, res) => {
    try {
      const { userId } = req.body;
      const db = loadDatabase();
      const userIdx = db.users.findIndex(u => u.id === userId);
      if (userIdx === -1) {
        return res.status(404).json({ error: 'User context not found.' });
      }

      const user = db.users[userIdx];
      let updatedAny = false;
      let totalClaimedProfit = 0;

      // Weekly profit is calculated continuously (second-by-second for ultra-realistic responsive real-time yield)
      const now = new Date();
      user.purchasedPlans = user.purchasedPlans.map(plan => {
        const lastClaim = new Date(plan.lastProfitClaimDate);
        const secondsPassed = (now.getTime() - lastClaim.getTime()) / 1000;

        if (secondsPassed >= 1) { // Free flow second by second calculation
          const planMeta = db.plans.find(p => p.id === plan.planId);
          if (planMeta) {
            // Weekly gain transformed to second-level rate
            const secondRate = (planMeta.weeklyProfitPercent / 100) / (7 * 24 * 3600);
            const profitGenerated = plan.purchasePrice * secondRate * secondsPassed;

            if (profitGenerated > 0.0001) {
              totalClaimedProfit += profitGenerated;
              plan.revenueGenerated += profitGenerated;
              plan.lastProfitClaimDate = now.toISOString();
              updatedAny = true;
            }
          }
        }
        return plan;
      });

      if (updatedAny && totalClaimedProfit > 0) {
        user.balance += totalClaimedProfit;
        user.earnings += totalClaimedProfit;
        updateEarningsHistory(user, totalClaimedProfit);
        
        // Auto-check tier promotion triggers based on new total earnings & plans price volume
        const totalPurchasedVolume = user.purchasedPlans.reduce((sum, p) => sum + p.purchasePrice, 0);
        
        // Sort ranks by required earnings high to low to check maximum rank eligibility
        const sortedRanks = [...db.ranks].sort((a, b) => b.requiredEarnings - a.requiredEarnings);
        for (const rank of sortedRanks) {
          if (user.earnings >= rank.requiredEarnings && totalPurchasedVolume >= rank.requiredPlansVolume) {
            if (user.rankCode !== rank.code) {
              user.rankCode = rank.code;
            }
            break;
          }
        }

        db.users[userIdx] = user;
        saveDatabase(db);
      }

      res.json({ success: true, user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Action User Buys Investment Plan
  app.post('/api/user/purchase-plan', (req, res) => {
    try {
      const { userId, planId } = req.body;
      const db = loadDatabase();
      const user = db.users.find(u => u.id === userId);
      const plan = db.plans.find(p => p.id === planId);

      if (!user) return res.status(404).json({ error: 'User node not found.' });
      if (!plan) return res.status(404).json({ error: 'Selected investment plan not cataloged.' });

      if (user.balance < plan.price) {
        return res.status(400).json({ error: 'Insufficient wallet balance to purchase this plan. Please request deposit.' });
      }

      // Deduct asset balance
      user.balance -= plan.price;
      user.purchasedPlans.push({
        planId: plan.id,
        purchasePrice: plan.price,
        purchaseDate: new Date().toISOString(),
        lastProfitClaimDate: new Date().toISOString(),
        revenueGenerated: 0
      });

      // Recalculate rank tier immediately on purchase scale
      const totalPurchasedVolume = user.purchasedPlans.reduce((sum, p) => sum + p.purchasePrice, 0);
      const sortedRanks = [...db.ranks].sort((a, b) => b.requiredEarnings - a.requiredEarnings);
      for (const rank of sortedRanks) {
        if (user.earnings >= rank.requiredEarnings && totalPurchasedVolume >= rank.requiredPlansVolume) {
          user.rankCode = rank.code;
          break;
        }
      }

      saveDatabase(db);
      res.json({ success: true, user, message: `Successfully purchased ${plan.name}!` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Submit deposit reference TID request
  app.post('/api/user/submit-deposit', (req, res) => {
    try {
      const { userId, amount, payTID, paymentMethod } = req.body;
      if (!userId || !amount || !payTID) {
        return res.status(400).json({ error: 'Deposit amount and Pay TID reference sequence are mandatory.' });
      }

      const amtParsed = parseFloat(amount);
      if (isNaN(amtParsed) || amtParsed <= 0) {
        return res.status(400).json({ error: 'Invalid deposit amount value.' });
      }

      const db = loadDatabase();
      const user = db.users.find(u => u.id === userId);
      if (!user) return res.status(404).json({ error: 'User context not found.' });

      const newTx: TransactionRequest = {
        id: 'tx-' + Math.random().toString(36).substring(2, 9),
        userId: user.id,
        userEmail: user.email,
        userName: user.fullName,
        type: 'deposit',
        amount: amtParsed,
        payTID: payTID.trim(),
        paymentMethod: paymentMethod || db.payment.methodName,
        status: 'pending',
        timestamp: new Date().toISOString()
      };

      db.transactions.push(newTx);
      saveDatabase(db);
      res.json({ success: true, transaction: newTx, message: 'Deposit reference logged real-time. Awaiting validator audit!' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Submit withdrawal balance request
  app.post('/api/user/submit-withdrawal', (req, res) => {
    try {
      const { userId, amount, paymentMethod, accountDetails } = req.body;
      if (!userId || !amount) {
        return res.status(400).json({ error: 'Withdrawal amount parameter is required.' });
      }

      const amtParsed = parseFloat(amount);
      if (isNaN(amtParsed) || amtParsed <= 0) {
        return res.status(400).json({ error: 'Invalid withdrawal amount amount.' });
      }

      const db = loadDatabase();
      const user = db.users.find(u => u.id === userId);
      if (!user) return res.status(404).json({ error: 'User context not found.' });

      if (user.balance < amtParsed) {
        return res.status(400).json({ error: 'Insufficient balance available in user vault.' });
      }

      // Lock/Deduct from balance instantly to avoid double-spend during pending
      user.balance -= amtParsed;

      const newTx: TransactionRequest = {
        id: 'tx-' + Math.random().toString(36).substring(2, 9),
        userId: user.id,
        userEmail: user.email,
        userName: user.fullName,
        type: 'withdrawal',
        amount: amtParsed,
        payTID: `WD-ACC: ${accountDetails || 'N/A'}`,
        paymentMethod: paymentMethod || db.payment.methodName,
        status: 'pending',
        timestamp: new Date().toISOString()
      };

      db.transactions.push(newTx);
      saveDatabase(db);
      res.json({ success: true, user, transaction: newTx, message: 'Withdrawal request logged to the AI network auditor.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Claim Daily Salary based on the designated adjusted rank income setup!
  app.post('/api/user/claim-salary', (req, res) => {
    try {
      const { userId } = req.body;
      const db = loadDatabase();
      const user = db.users.find(u => u.id === userId);
      if (!user) return res.status(404).json({ error: 'User context not located.' });

      const todayStr = new Date().toISOString().split('T')[0];
      if (user.lastDailySalaryClaimedDate === todayStr) {
        return res.status(400).json({ error: 'You have already collected today’s salary. Refresh tomorrow!' });
      }

      const rankConf = db.ranks.find(r => r.code === user.rankCode);
      const salary = rankConf ? rankConf.dailyIncomeSalary : 0;

      user.balance += salary;
      user.earnings += salary;
      user.lastDailySalaryClaimedDate = todayStr;
      updateEarningsHistory(user, salary);

      // Rank upgrade check
      const totalVolume = user.purchasedPlans.reduce((sum, p) => sum + p.purchasePrice, 0);
      const sortedRanks = [...db.ranks].sort((a, b) => b.requiredEarnings - a.requiredEarnings);
      for (const rank of sortedRanks) {
        if (user.earnings >= rank.requiredEarnings && totalVolume >= rank.requiredPlansVolume) {
          user.rankCode = rank.code;
          break;
        }
      }

      saveDatabase(db);
      res.json({ success: true, user, message: `Collected Rank Salary reward of PKR ${salary.toFixed(2)}!` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- ADMIN ADMINISTRATIVE METHODS (Broadcasting real-time on saveDatabase) ---

  // Update user parameters manually
  app.post('/api/admin/users/update', (req, res) => {
    try {
      const { userId, balance, earnings, rankCode } = req.body;
      const db = loadDatabase();
      const user = db.users.find(u => u.id === userId);
      if (!user) return res.status(404).json({ error: 'User context not active.' });

      if (balance !== undefined) user.balance = parseFloat(balance);
      if (earnings !== undefined) user.earnings = parseFloat(earnings);
      if (rankCode !== undefined) user.rankCode = rankCode;

      saveDatabase(db);
      res.json({ success: true, user, message: 'User variables manually adjusted in real-time.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // App or Reject Transactions Flow
  app.post('/api/admin/requests/process', (req, res) => {
    try {
      const { transactionId, action } = req.body; // action: 'approve' | 'reject'
      const db = loadDatabase();
      const tx = db.transactions.find(t => t.id === transactionId);
      if (!tx) return res.status(404).json({ error: 'Transaction element not found.' });

      if (tx.status !== 'pending') {
        return res.status(400).json({ error: 'This request has already been completed.' });
      }

      const user = db.users.find(u => u.id === tx.userId);
      if (action === 'approve') {
        tx.status = 'approved';
        if (user) {
          if (tx.type === 'deposit') {
            user.balance += tx.amount;
            
            // Apply referral percentage bonus (10% of deposit amount)
            if (user.referredBy) {
              const referrer = db.users.find(u => u.id === user.referredBy || u.referralCode === user.referredBy);
              if (referrer) {
                const bonus = tx.amount * 0.10; // 10% referral bonus
                referrer.balance += bonus;
                referrer.totalReferralEarnings = (referrer.totalReferralEarnings || 0) + bonus;
                referrer.earnings += bonus;
                updateEarningsHistory(referrer, bonus);
              }
            }
          }
          // Already deducted on submission if withdrawal
        }
      } else {
        tx.status = 'rejected';
        if (user && tx.type === 'withdrawal') {
          // Refund locked transaction capital
          user.balance += tx.amount;
        }
      }

      saveDatabase(db);
      res.json({ success: true, message: `Transaction was successfully ${action}d!` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create new active plan
  app.post('/api/admin/plans/create', (req, res) => {
    try {
      const { name, price, weeklyProfitPercent, benefits } = req.body;
      if (!name || !price || !weeklyProfitPercent) {
        return res.status(400).json({ error: 'Missing core plan parameters.' });
      }

      const db = loadDatabase();
      const newPlan: Plan = {
        id: 'plan-' + Math.random().toString(36).substring(2, 9),
        name,
        price: parseFloat(price),
        weeklyProfitPercent: parseFloat(weeklyProfitPercent),
        benefits: benefits || 'Standard plan tier benefits'
      };

      db.plans.push(newPlan);
      saveDatabase(db);
      res.json({ success: true, plan: newPlan, message: 'New investment plan successfully deployed.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Edit / update existing plan
  app.post('/api/admin/plans/update', (req, res) => {
    try {
      const { planId, name, price, weeklyProfitPercent, benefits } = req.body;
      const db = loadDatabase();
      const planIdx = db.plans.findIndex(p => p.id === planId);
      if (planIdx === -1) return res.status(404).json({ error: 'Plan not found.' });

      const plan = db.plans[planIdx];
      if (name !== undefined) plan.name = name;
      if (price !== undefined) plan.price = parseFloat(price);
      if (weeklyProfitPercent !== undefined) plan.weeklyProfitPercent = parseFloat(weeklyProfitPercent);
      if (benefits !== undefined) plan.benefits = benefits;

      db.plans[planIdx] = plan;
      saveDatabase(db);
      res.json({ success: true, plan, message: 'Investment plans details modified real-time.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Setup Rank configurations bounds & Daily Salary adjusted salary
  app.post('/api/admin/ranks/update', (req, res) => {
    try {
      const { rankCode, requiredEarnings, requiredPlansVolume, dailyIncomeSalary } = req.body;
      const db = loadDatabase();
      const rankIdx = db.ranks.findIndex(r => r.code === rankCode);
      if (rankIdx === -1) return res.status(404).json({ error: 'Rank level code not found.' });

      const rank = db.ranks[rankIdx];
      if (requiredEarnings !== undefined) rank.requiredEarnings = parseFloat(requiredEarnings);
      if (requiredPlansVolume !== undefined) rank.requiredPlansVolume = parseFloat(requiredPlansVolume);
      if (dailyIncomeSalary !== undefined) rank.dailyIncomeSalary = parseFloat(dailyIncomeSalary);

      db.ranks[rankIdx] = rank;
      saveDatabase(db);
      res.json({ success: true, rank, message: `${rank.name} setup updated on all servers.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Setup Payment Method Details in real time
  app.post('/api/admin/payment/update', (req, res) => {
    try {
      const { methodName, accountName, accountNumber } = req.body;
      const db = loadDatabase();
      
      if (methodName !== undefined) db.payment.methodName = methodName;
      if (accountName !== undefined) db.payment.accountName = accountName;
      if (accountNumber !== undefined) db.payment.accountNumber = accountNumber;

      saveDatabase(db);
      res.json({ success: true, payment: db.payment, message: 'Instant transfer gateway details updated.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // AI-Powered Automated Auditor check-up to assist Admin visually
  app.post('/api/admin/ai/audit', async (req, res) => {
    try {
      if (!apiKey) {
        return res.status(400).json({ error: 'GEMINI_API_KEY coordinate missing.' });
      }
      const db = loadDatabase();
      const systemStateStr = JSON.stringify({
        pendingCount: db.transactions.filter(t => t.status === 'pending').length,
        transactions: db.transactions.slice(-5),
        currentPaymentDetails: db.payment
      });

      const prompt = `Review the following transactional history state in our system:
      ${systemStateStr}
      
      Act as our AI Auditor and Financial risk analyzer. Give us a brief 3-sentence risk review, and highlight if any pending transaction looks potentially suspicious or ready for approval. Be concise, direct and professional.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      res.json({ auditReport: response.text });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Support Chat API for User Panel
  app.post('/api/support/chat', async (req, res) => {
    try {
      const { message, email } = req.body;
      if (!apiKey) {
        return res.json({ text: "Hello! Our AI chat engine is online, however, the server is currently operating without a backend API Key. Please let support verify of your questions via your email " + (email || "") });
      }

      const prompt = `You are the Support Representative for Aura Earning Hub. A user with email ${email || 'guest'} asks:
      "${message}"
      
      Reply with helpful guidelines. Mention our investment plans and ranking structure. Be professional and warm. Limit answers to under 4 sentences.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (err: any) {
      res.json({ text: "Our systems are resolving questions. Please ask our Admin for priority verification of payments." });
    }
  });

  // --- VITE MIDDLEWARE SETUP FOR DEV ---
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
  });
}

startServer();
