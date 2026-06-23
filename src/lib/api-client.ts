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

export type GroupSummary = {
  id: string;
  name: string;
  createdAt: string;
  memberCount: number;
  _count: { expenses: number };
};

export type GroupDetail = {
  id: string;
  name: string;
  createdAt: string;
  members: { user: AuthUser }[];
  expenses: ExpenseItem[];
};

export type ExpenseItem = {
  id: string;
  description: string;
  amount: number;
  createdAt: string;
  paidBy: AuthUser;
  splits: { userId: string; amountOwed: number; user: AuthUser }[];
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

export type DashboardBalances = {
  totalOwed: number;
  totalOwing: number;
  groups: { groupId: string; groupName: string; netAmount: number }[];
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

  getGroups: () => fetch("/api/groups").then(handleResponse<{ groups: GroupSummary[] }>),

  createGroup: (body: { name: string; memberIds?: string[] }) =>
    fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handleResponse<{ group: GroupDetail }>),

  getGroup: (groupId: string) =>
    fetch(`/api/groups/${groupId}`).then(handleResponse<{ group: GroupDetail }>),

  createExpense: (
    groupId: string,
    body: {
      description: string;
      amount: number;
      paidByUserId: string;
      splits: { userId: string; amountOwed: number }[];
    },
  ) =>
    fetch(`/api/groups/${groupId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handleResponse<{ expense: ExpenseItem }>),

  getBalances: () => fetch("/api/balances").then(handleResponse<DashboardBalances>),

  getGroupBalances: (groupId: string) =>
    fetch(`/api/groups/${groupId}/balances`).then(handleResponse<BalanceResponse>),

  getSettlements: (groupId: string) =>
    fetch(`/api/groups/${groupId}/settlements`).then(handleResponse<SettlementResponse>),
};
