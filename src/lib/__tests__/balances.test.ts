import { describe, expect, it } from "vitest";
import { computeGroupBalances, computeDashboardBalance } from "../balances";

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
    expect(after.debts.find((d) => d.fromUserId === "bob" && d.toUserId === "alice")?.amount).toBe(2000);
    expect(after.debts.some((d) => d.fromUserId === "bob" && d.toUserId === "carol")).toBe(false);
  });

  it("accumulates expense debt on the same creditor edge", () => {
    const expenses = [
      {
        paidByUserId: "alice",
        amount: 1000,
        paidBy: alice,
        splits: [{ userId: "bob", amountOwed: 1000, user: bob }],
      },
      {
        paidByUserId: "alice",
        amount: 500,
        paidBy: alice,
        splits: [{ userId: "bob", amountOwed: 500, user: bob }],
      },
    ];

    const result = computeGroupBalances(expenses);
    expect(result.debts).toHaveLength(1);
    expect(result.debts[0]).toMatchObject({ fromUserId: "bob", toUserId: "alice", amount: 1500 });
  });
});

describe("computeDashboardBalance", () => {
  it("hides friend balances from groups where the user is fully settled", () => {
    const manish = { id: "manish", name: "Manish Kumar", email: "manish@test.com" };
    const karan = { id: "karan", name: "Karan", email: "karan@test.com" };
    const jishitha = { id: "jishitha", name: "Jishitha", email: "jishitha@test.com" };
    const niranjan = { id: "niranjan", name: "Niranjan", email: "niranjan@test.com" };

    const expenses = [
      {
        paidByUserId: "jishitha",
        amount: 58,
        paidBy: jishitha,
        splits: [{ userId: "manish", amountOwed: 58, user: manish }],
      },
      {
        paidByUserId: "niranjan",
        amount: 38,
        paidBy: niranjan,
        splits: [{ userId: "manish", amountOwed: 38, user: manish }],
      },
    ];
    const payments = [
      {
        fromUserId: "manish",
        toUserId: "karan",
        amount: 96,
        fromUser: manish,
        toUser: karan,
      },
    ];

    const settledGroup = computeGroupBalances(expenses, payments);
    expect(settledGroup.netBalances.find((b) => b.userId === "manish")).toBeUndefined();

    const dashboard = computeDashboardBalance("manish", [
      {
        groupId: "g1",
        groupName: "Kiru farewell",
        netBalances: settledGroup.netBalances,
        debts: settledGroup.debts,
      },
    ]);

    expect(dashboard.groups[0]?.netAmount).toBe(0);
    expect(dashboard.friends).toEqual([]);
    expect(dashboard.totalOwing).toBe(0);
    expect(dashboard.totalOwed).toBe(0);
  });

  it("still shows friends for groups with an outstanding net balance", () => {
    const manish = { id: "manish", name: "Manish Kumar", email: "manish@test.com" };
    const jishitha = { id: "jishitha", name: "Jishitha", email: "jishitha@test.com" };

    const group = computeGroupBalances([
      {
        paidByUserId: "jishitha",
        amount: 58,
        paidBy: jishitha,
        splits: [{ userId: "manish", amountOwed: 58, user: manish }],
      },
    ]);

    const dashboard = computeDashboardBalance("manish", [
      {
        groupId: "g1",
        groupName: "Devika Bday",
        netBalances: group.netBalances,
        debts: group.debts,
      },
    ]);

    expect(dashboard.friends).toHaveLength(1);
    expect(dashboard.friends[0]).toMatchObject({
      userId: "jishitha",
      netAmount: -58,
    });
  });
});
