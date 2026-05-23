export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  balance: number;
  earnings: number;
  rankCode: string;
  purchasedPlans: {
    planId: string;
    purchasePrice: number;
    purchaseDate: string;
    lastProfitClaimDate: string;
    revenueGenerated: number;
  }[];
  lastDailySalaryClaimedDate: string | null;
  joinedDate: string;
  isAdmin: boolean;
  referralCode: string;
  referredBy: string | null;
  totalReferralEarnings: number;
  earningsHistory?: { date: string; amount: number }[];
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  weeklyProfitPercent: number;
  benefits: string;
}

export interface RankConfiguration {
  code: string;
  name: string;
  requiredEarnings: number;
  requiredPlansVolume: number;
  dailyIncomeSalary: number;
}

export interface TransactionRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  payTID?: string;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export interface PaymentDetails {
  methodName: string;
  accountName: string;
  accountNumber: string;
}

export interface LiveDB {
  users: User[];
  plans: Plan[];
  ranks: RankConfiguration[];
  transactions: TransactionRequest[];
  payment: PaymentDetails;
}
