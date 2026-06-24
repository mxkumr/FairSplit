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
});
