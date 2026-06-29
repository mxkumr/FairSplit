"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { api, type GroupDetail } from "@/lib/api-client";

type GroupQueryData = { group: GroupDetail };

function sortExpenses(expenses: GroupDetail["expenses"]) {
  return [...expenses].sort(
    (a, b) =>
      new Date(b.expenseDate ?? b.createdAt).getTime() -
      new Date(a.expenseDate ?? a.createdAt).getTime(),
  );
}

function updateGroupCache(
  queryClient: QueryClient,
  groupId: string,
  updater: (group: GroupDetail) => GroupDetail,
) {
  queryClient.setQueryData<GroupQueryData>(["groups", groupId], (old) => {
    if (!old?.group) return old;
    return { group: updater(old.group) };
  });
}

async function invalidateGroup(queryClient: QueryClient, groupId: string) {
  await Promise.all([
    queryClient.refetchQueries({ queryKey: ["groups", groupId] }),
    queryClient.refetchQueries({ queryKey: ["groups", groupId, "balances"] }),
    queryClient.refetchQueries({ queryKey: ["groups", groupId, "settlements"] }),
    queryClient.refetchQueries({ queryKey: ["groups", groupId, "activities"] }),
    queryClient.refetchQueries({ queryKey: ["balances"] }),
    queryClient.refetchQueries({ queryKey: ["groups"] }),
  ]);
}

export async function refetchGroupData(queryClient: QueryClient, groupId: string) {
  await invalidateGroup(queryClient, groupId);
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
  });
}

export function useActivities(groupId: string) {
  return useQuery({
    queryKey: ["groups", groupId, "activities"],
    queryFn: () => api.getActivities(groupId),
    enabled: !!groupId,
  });
}

export function useToggleFavorite(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.toggleFavorite(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}

export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.updateGroup>[1]) =>
      api.updateGroup(groupId, body),
    onSuccess: (data) => {
      queryClient.setQueryData<{ group: import("@/lib/api-client").GroupDetail }>(
        ["groups", groupId],
        (old) => {
          if (!old?.group) return old;
          return {
            group: {
              ...old.group,
              ...data.group,
            },
          };
        },
      );
      queryClient.setQueryData<{ groups: import("@/lib/api-client").GroupSummary[] }>(
        ["groups"],
        (old) => {
          if (!old?.groups) return old;
          return {
            groups: old.groups.map((g) =>
              g.id === groupId ? { ...g, ...data.group } : g,
            ),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "settlements"] });
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
    retry: false,
  });
}

export function useFriends() {
  return useQuery({
    queryKey: ["friends"],
    queryFn: () => api.getFriends(),
  });
}

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: () => api.getGroups(),
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ["groups", groupId],
    queryFn: () => api.getGroup(groupId),
    enabled: !!groupId,
  });
}

export function useBalances() {
  return useQuery({
    queryKey: ["balances"],
    queryFn: () => api.getBalances(),
  });
}

export function useGroupBalances(groupId: string) {
  return useQuery({
    queryKey: ["groups", groupId, "balances"],
    queryFn: () => api.getGroupBalances(groupId),
    enabled: !!groupId,
  });
}

export function useSettlements(groupId: string) {
  return useQuery({
    queryKey: ["groups", groupId, "settlements"],
    queryFn: () => api.getSettlements(groupId),
    enabled: !!groupId,
  });
}

export function useAddFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.addFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.removeFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    },
  });
}

export function useAddGroupMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { email?: string; userId?: string }) => api.addGroupMember(groupId, body),
    onSuccess: async () => {
      await invalidateGroup(queryClient, groupId);
    },
  });
}

export function useGroupInvite(groupId: string) {
  return useQuery({
    queryKey: ["groups", groupId, "invite"],
    queryFn: () => api.getGroupInvite(groupId),
    enabled: !!groupId,
  });
}

export function useFriendInvite() {
  return useQuery({
    queryKey: ["friend-invite"],
    queryFn: () => api.getFriendInvite(),
  });
}

export function useCreateExpense(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.createExpense>[1]) =>
      api.createExpense(groupId, body),
    onSuccess: async (data) => {
      updateGroupCache(queryClient, groupId, (group) => ({
        ...group,
        expenses: sortExpenses([data.expense, ...group.expenses]),
      }));
      await invalidateGroup(queryClient, groupId);
    },
  });
}

export function useUpdateExpense(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      expenseId,
      ...body
    }: Parameters<typeof api.updateExpense>[2] & { expenseId: string }) =>
      api.updateExpense(groupId, expenseId, body),
    onSuccess: async (data) => {
      updateGroupCache(queryClient, groupId, (group) => ({
        ...group,
        expenses: sortExpenses(
          group.expenses.map((expense) =>
            expense.id === data.expense.id ? data.expense : expense,
          ),
        ),
      }));
      await invalidateGroup(queryClient, groupId);
    },
  });
}

export function useDeleteExpense(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => api.deleteExpense(groupId, expenseId),
    onSuccess: async (_data, expenseId) => {
      updateGroupCache(queryClient, groupId, (group) => ({
        ...group,
        expenses: group.expenses.filter((expense) => expense.id !== expenseId),
      }));
      await invalidateGroup(queryClient, groupId);
    },
  });
}

export function useRecordPayment(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.recordPayment>[1]) =>
      api.recordPayment(groupId, body),
    onSuccess: async (data) => {
      updateGroupCache(queryClient, groupId, (group) => ({
        ...group,
        payments: [data.payment, ...group.payments],
      }));
      await invalidateGroup(queryClient, groupId);
    },
  });
}

export function useUpdatePayment(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentId,
      body,
    }: {
      paymentId: string;
      body: Parameters<typeof api.updatePayment>[2];
    }) => api.updatePayment(groupId, paymentId, body),
    onSuccess: async (data) => {
      updateGroupCache(queryClient, groupId, (group) => ({
        ...group,
        payments: group.payments.map((payment) =>
          payment.id === data.payment.id ? data.payment : payment,
        ),
      }));
      await invalidateGroup(queryClient, groupId);
    },
  });
}

export function useDeletePayment(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => api.deletePayment(groupId, paymentId),
    onSuccess: async (_data, paymentId) => {
      updateGroupCache(queryClient, groupId, (group) => ({
        ...group,
        payments: group.payments.filter((payment) => payment.id !== paymentId),
      }));
      await invalidateGroup(queryClient, groupId);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
