"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

function invalidateGroup(queryClient: ReturnType<typeof useQueryClient>, groupId: string) {
  queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
  queryClient.invalidateQueries({ queryKey: ["groups", groupId, "balances"] });
  queryClient.invalidateQueries({ queryKey: ["groups", groupId, "settlements"] });
  queryClient.invalidateQueries({ queryKey: ["balances"] });
  queryClient.invalidateQueries({ queryKey: ["groups"] });
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
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
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
    mutationFn: (body: { email: string }) => api.addGroupMember(groupId, body),
    onSuccess: () => invalidateGroup(queryClient, groupId),
  });
}

export function useCreateExpense(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.createExpense>[1]) =>
      api.createExpense(groupId, body),
    onSuccess: () => invalidateGroup(queryClient, groupId),
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
    onSuccess: () => invalidateGroup(queryClient, groupId),
  });
}

export function useDeleteExpense(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => api.deleteExpense(groupId, expenseId),
    onSuccess: () => invalidateGroup(queryClient, groupId),
  });
}

export function useRecordPayment(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.recordPayment>[1]) =>
      api.recordPayment(groupId, body),
    onSuccess: () => invalidateGroup(queryClient, groupId),
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
