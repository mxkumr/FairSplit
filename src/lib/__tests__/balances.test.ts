import { describe, expect, it } from "vitest";
import { computeGroupBalances } from "../balances";

const alice = { id: "alice", name: "Alice", email: "alice@example.com" };
const bob = { id: "bob", name: "Bob", email: "bob@example.com" };

describe("computeGroupBalances with payments", () => {
  it("reduces debt when a payment is recorded", () => {
    const expenses = [
      {
        paidByUserId: "alice",
        amount: 3000,
        paidBy: alice,
        splits: [
          { userId: "alice", amountOwed: 1000, user: alice },
          { userId: "bob", amountOwed: 2000, user: bob },
        ],
      },
    ];

    const withoutPayment = computeGroupBalances(expenses);
    expect(withoutPayment.debts).toHaveLength(1);
    expect(withoutPayment.debts[0].amount).toBe(2000);

    const withPayment = computeGroupBalances(expenses, [
      {
        fromUserId: "bob",
        toUserId: "alice",
        amount: 2000,
        fromUser: bob,
        toUser: alice,
      },
    ]);

    expect(withPayment.debts).toHaveLength(0);
    expect(withPayment.netBalances.every((b) => b.amount === 0)).toBe(true);
  });

  it("allows payment along simplified route even without a direct raw debt edge", () => {
    const expenses = [
      {
        paidByUserId: "alice",
        amount: 3000,
        paidBy: alice,
        splits: [
          { userId: "alice", amountOwed: 1000, user: alice },
          { userId: "bob", amountOwed: 2000, user: bob },
        ],
      },
      {
        paidByUserId: "carol",
        amount: 2000,
        paidBy: { id: "carol", name: "Carol", email: "carol@example.com" },
        splits: [
          { userId: "carol", amountOwed: 1000, user: { id: "carol", name: "Carol", email: "carol@example.com" } },
          { userId: "bob", amountOwed: 1000, user: bob },
        ],
      },
    ];

    const before = computeGroupBalances(expenses);
    expect(before.netBalances.find((b) => b.userId === "bob")?.amount).toBe(-3000);

    const after = computeGroupBalances(expenses, [
      {
        fromUserId: "bob",
        toUserId: "carol",
        amount: 1000,
        fromUser: bob,
        toUser: { id: "carol", name: "Carol", email: "carol@example.com" },
      },
    ]);

    expect(after.netBalances.find((b) => b.userId === "bob")?.amount).toBe(-2000);
    expect(after.netBalances.find((b) => b.userId === "carol")).toBeUndefined();
  });
});
