export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(data.error ?? "Request failed", response.status);
  }
  return data as T;
}

export type AuthUser = { id: string; name: string; email: string };

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

export type GroupDetail = {
  id: string;
  name: string;
  information: string | null;
  currency: string;
  currencySymbol: string;
  isFavorite: boolean;
  createdAt: string;
  members: { isFavorite?: boolean; user: AuthUser }[];
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

export type SettlementResponse = {
  settlements: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    fromUser: AuthUser;
    toUser: AuthUser;
  }[];
  transactionCount: number;
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
    }).then(handleResponse<{ user: AuthUser }>),

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

  addGroupMember: (groupId: string, body: { email: string }) =>
    fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handleResponse<{ member: AuthUser }>),

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
