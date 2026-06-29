export class ApiError extends Error {
  code?: string;
  email?: string;

  constructor(
    message: string,
    public status: number,
    options?: { code?: string; email?: string },
  ) {
    super(message);
    this.code = options?.code;
    this.email = options?.email;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(data.error ?? "Request failed", response.status, {
      code: data.code,
      email: data.email,
    });
  }
  return data as T;
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
};

export type Category = { id: number; grouping: string; name: string };

export type ExpenseDocument = {
  id: string;
  filename: string;
  mimeType: string;
  url: string;
};

export type GroupSummary = {
  id: string;
  name: string;
  information: string | null;
  currency: string;
  currencySymbol: string;
  isFavorite: boolean;
  createdAt: string;
  memberCount: number;
  _count: { expenses: number };
};

export type ExpenseItem = {
  id: string;
  description: string;
  amount: number;
  expenseDate: string;
  createdAt: string;
  splitMode: string;
  notes: string | null;
  isReimbursement: boolean;
  recurrenceRule: string;
  categoryId: number | null;
  category: Category | null;
  paidBy: AuthUser;
  splits: { userId: string; amountOwed: number; shares: number; user: AuthUser }[];
  documents: ExpenseDocument[];
};

export type PaymentItem = {
  id: string;
  amount: number;
  note: string | null;
  createdAt: string;
  fromUser: AuthUser;
  toUser: AuthUser;
};

export type GroupMember = {
  isFavorite?: boolean;
  joinedAt: string;
  user: AuthUser;
};

export type SettlementModeKey = "simplified" | "direct";

export type GroupDetail = {
  id: string;
  name: string;
  information: string | null;
  currency: string;
  currencySymbol: string;
  settlementMode: SettlementModeKey;
  isFavorite: boolean;
  createdAt: string;
  members: GroupMember[];
  expenses: ExpenseItem[];
  payments: PaymentItem[];
};

export type ActivityItem = {
  id: string;
  activityType: string;
  user: AuthUser | null;
  expenseId: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
};

export type BalanceResponse = {
  debts: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    fromUser: AuthUser;
    toUser: AuthUser;
  }[];
  netBalances: { userId: string; amount: number; user: AuthUser }[];
};

export type SettlementExplanationLine = {
  kind: "borrowed" | "lent" | "payment_out" | "payment_in";
  expenseId?: string;
  paymentId?: string;
  counterparty: AuthUser;
  amount: number;
  netEffect: number;
  text: string;
  sortDate: string;
};

export type SettlementItem = {
  fromUserId: string;
  toUserId: string;
  amount: number;
  fromUser: AuthUser;
  toUser: AuthUser;
  explanation: {
    lines: SettlementExplanationLine[];
    summary: string;
  };
};

export type SettlementModeResult = {
  settlements: SettlementItem[];
  transactionCount: number;
  paymentsSaved: number;
};

export type SettlementResponse = {
  defaultMode: SettlementModeKey;
  settlements: SettlementItem[];
  transactionCount: number;
  rawDebtCount: number;
  paymentsSaved: number;
  modes: Record<SettlementModeKey, SettlementModeResult>;
};

export type FriendItem = {
  id: string;
  friend: AuthUser;
  createdAt: string;
};

export type DashboardBalances = {
  totalOwed: number;
  totalOwing: number;
  groups: { groupId: string; groupName: string; netAmount: number }[];
  friends: { userId: string; name: string; email: string; netAmount: number }[];
};

export type ExpensePayload = {
  description: string;
  amount: number;
  paidByUserId: string;
  expenseDate?: string;
  categoryId?: number | null;
  splitMode?: string;
  notes?: string;
  isReimbursement?: boolean;
  recurrenceRule?: string;
  splits: { userId: string; amountOwed: number; shares?: number }[];
};

export const api = {
  register: (body: { name: string; email: string; password: string }) =>
    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(
      handleResponse<{
        needsVerification: true;
        email: string;
        message: string;
        devCode?: string;
      }>,
    ),

  verifyEmail: (body: { email: string; code: string }) =>
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handleResponse<{ user: AuthUser }>),

  resendOtp: (body: { email: string }) =>
    fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handleResponse<{ message: string; devCode?: string }>),

  login: (body: { email: string; password: string }) =>
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handleResponse<{ user: AuthUser }>),

  logout: () =>
    fetch("/api/auth/logout", { method: "POST" }).then(handleResponse<{ success: boolean }>),

  me: () => fetch("/api/auth/me").then(handleResponse<{ user: AuthUser }>),

  getCategories: () =>
    fetch("/api/categories").then(handleResponse<{ categories: Category[] }>),

  getFriends: () => fetch("/api/friends").then(handleResponse<{ friends: FriendItem[] }>),

  addFriend: (body: { email: string }) =>
    fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handleResponse<{ friend: AuthUser; createdAt: string }>),

  removeFriend: (friendId: string) =>
    fetch(`/api/friends/${friendId}`, { method: "DELETE" }).then(
      handleResponse<{ success: boolean }>,
    ),

  searchUsers: (q: string) =>
    fetch(`/api/users/search?q=${encodeURIComponent(q)}`).then(
      handleResponse<{ users: AuthUser[] }>,
    ),

  getGroups: () => fetch("/api/groups").then(handleResponse<{ groups: GroupSummary[] }>),

  createGroup: (body: {
    name: string;
    information?: string;
    currency?: string;
    currencySymbol?: string;
    memberIds?: string[];
  }) =>
    fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handleResponse<{ group: GroupDetail }>),

  getGroup: (groupId: string) =>
    fetch(`/api/groups/${groupId}`).then(handleResponse<{ group: GroupDetail }>),

  updateGroup: (
    groupId: string,
    body: {
      name?: string;
      information?: string | null;
      currency?: string;
      currencySymbol?: string;
      settlementMode?: SettlementModeKey;
    },
  ) =>
    fetch(`/api/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handleResponse<{ group: Partial<GroupDetail> }>),

  toggleFavorite: (groupId: string) =>
    fetch(`/api/groups/${groupId}/favorite`, { method: "POST" }).then(
      handleResponse<{ isFavorite: boolean }>,
    ),

  getActivities: (groupId: string) =>
    fetch(`/api/groups/${groupId}/activities`).then(
      handleResponse<{ activities: ActivityItem[] }>,
    ),

  addGroupMember: (groupId: string, body: { email?: string; userId?: string }) =>
    fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handleResponse<{ member: AuthUser }>),

  getGroupInvite: (groupId: string) =>
    fetch(`/api/groups/${groupId}/invite`).then(
      handleResponse<{ token: string; url: string }>,
    ),

  getGroupInvitePreview: (token: string) =>
    fetch(`/api/invites/group/${token}`).then(
      handleResponse<{
        group: {
          id: string;
          name: string;
          information: string | null;
          currency: string;
          memberCount: number;
          createdByName: string;
        };
      }>,
    ),

  joinGroupViaInvite: (token: string) =>
    fetch(`/api/invites/group/${token}/join`, { method: "POST" }).then(
      handleResponse<{ groupId: string; alreadyMember: boolean; message: string }>,
    ),

  getFriendInvite: () =>
    fetch("/api/users/friend-invite").then(handleResponse<{ token: string; url: string }>),

  getFriendInvitePreview: (token: string) =>
    fetch(`/api/invites/friend/${token}`).then(
      handleResponse<{ user: { id: string; name: string } }>,
    ),

  acceptFriendInvite: (token: string) =>
    fetch(`/api/invites/friend/${token}/accept`, { method: "POST" }).then(
      handleResponse<{
        friend: AuthUser;
        alreadyFriends: boolean;
        message: string;
      }>,
    ),

  createExpense: (groupId: string, body: ExpensePayload) =>
    fetch(`/api/groups/${groupId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handleResponse<{ expense: ExpenseItem }>),

  updateExpense: (groupId: string, expenseId: string, body: ExpensePayload) =>
    fetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handleResponse<{ expense: ExpenseItem }>),

  deleteExpense: (groupId: string, expenseId: string) =>
    fetch(`/api/groups/${groupId}/expenses/${expenseId}`, { method: "DELETE" }).then(
      handleResponse<{ success: boolean }>,
    ),

  uploadExpenseDocument: (groupId: string, expenseId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`/api/groups/${groupId}/expenses/${expenseId}/documents`, {
      method: "POST",
      body: formData,
    }).then(handleResponse<{ document: ExpenseDocument }>);
  },

  recordPayment: (
    groupId: string,
    body: { fromUserId: string; toUserId: string; amount: number; note?: string },
  ) =>
    fetch(`/api/groups/${groupId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handleResponse<{ payment: PaymentItem }>),

  getBalances: () => fetch("/api/balances").then(handleResponse<DashboardBalances>),

  getGroupBalances: (groupId: string) =>
    fetch(`/api/groups/${groupId}/balances`).then(handleResponse<BalanceResponse>),

  getSettlements: (groupId: string) =>
    fetch(`/api/groups/${groupId}/settlements`).then(handleResponse<SettlementResponse>),
};
