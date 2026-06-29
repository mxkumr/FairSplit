import { describe, expect, it } from "vitest";
import { computeGroupBalances } from "../balances";
import {
  simplifyDebts,
  sumSettlementsForUser,
  validateSettlements,
  type Settlement,
} from "../debt-simplification";
import {
  BUG_CHECK_MEMBERS,
  buildBugCheckExpensesForTest,
  buildBugCheckPaymentsForTest,
  buildBugCheckUsersRecord,
  type BugCheckMemberKey,
} from "../fixtures/bug-check-group";

type User = { id: string; name: string; email: string };

type PaymentRecord = {
  id: string;
  amount: number;
  createdAt: string;
  fromUserId: string;
  toUserId: string;
  fromUser: User;
  toUser: User;
};

function canRecordPayment(
  netBalances: { userId: string; amount: number }[],
  fromUserId: string,
  toUserId: string,
  amount: number,
): boolean {
  const payerNet = netBalances.find((balance) => balance.userId === fromUserId)?.amount ?? 0;
  const recipientNet =
    netBalances.find((balance) => balance.userId === toUserId)?.amount ?? 0;

  if (payerNet >= 0 || recipientNet <= 0) return false;
  if (amount > Math.abs(payerNet)) return false;
  if (amount > recipientNet) return false;
  return true;
}

function appendPayment(
  payments: PaymentRecord[],
  users: Record<BugCheckMemberKey, User>,
  fromUserId: string,
  toUserId: string,
  amount: number,
): PaymentRecord[] {
  return [
    ...payments,
    {
      id: `payment-${payments.length + 1}`,
      amount,
      createdAt: "2026-06-30",
      fromUserId,
      toUserId,
      fromUser: users[fromUserId as BugCheckMemberKey],
      toUser: users[toUserId as BugCheckMemberKey],
    },
  ];
}

function trackPaymentTotals(
  totals: { paid: Map<string, number>; received: Map<string, number> },
  settlement: Settlement,
) {
  totals.paid.set(
    settlement.fromUserId,
    (totals.paid.get(settlement.fromUserId) ?? 0) + settlement.amount,
  );
  totals.received.set(
    settlement.toUserId,
    (totals.received.get(settlement.toUserId) ?? 0) + settlement.amount,
  );
}

function assertNoOverpayOrUnderReceive(
  originalNets: Map<string, number>,
  totals: { paid: Map<string, number>; received: Map<string, number> },
) {
  const violations: string[] = [];

  for (const [userId, originalNet] of originalNets) {
    const paid = totals.paid.get(userId) ?? 0;
    const received = totals.received.get(userId) ?? 0;

    if (originalNet < 0) {
      const owed = Math.abs(originalNet);
      if (paid > owed) {
        violations.push(`${userId} paid ${paid} but only owed ${owed}`);
      }
    } else if (originalNet > 0) {
      if (received > originalNet) {
        violations.push(`${userId} received ${received} but was only owed ${originalNet}`);
      }
    }
  }

  return violations;
}

/**
 * Mirrors the app: suggested simplified payment is only recorded if a raw debt edge exists.
 * After each payment, balances and suggestions are recomputed.
 */
function simulateSettleUpFollowingSuggestions(
  expenses: ReturnType<typeof buildBugCheckExpensesForTest>,
  initialPayments: PaymentRecord[],
  users: Record<BugCheckMemberKey, User>,
  options?: { payerOrder?: string[] },
) {
  let payments = [...initialPayments];
  const recordedFromSuggestions: Settlement[] = [];
  const blocked: { settlement: Settlement; rawDebt: number; payerNet: number }[] = [];
  const totals = { paid: new Map<string, number>(), received: new Map<string, number>() };

  const initialBalance = computeGroupBalances(expenses, initialPayments);
  const originalNets = new Map(
    initialBalance.netBalances.map((balance) => [balance.userId, balance.amount]),
  );

  const payerOrder = options?.payerOrder ?? [];
  let guard = 0;

  while (guard++ < 200) {
    const { debts, netBalances } = computeGroupBalances(expenses, payments);
    const nets = netBalances.map((balance) => ({
      userId: balance.userId,
      amount: balance.amount,
    }));

    if (nets.every((balance) => balance.amount === 0)) {
      break;
    }

    const settlements = simplifyDebts(nets);
    if (settlements.length === 0) {
      break;
    }

    const next =
      settlements.find((settlement) => payerOrder.includes(settlement.fromUserId)) ??
      settlements[0];

    if (!canRecordPayment(nets, next.fromUserId, next.toUserId, next.amount)) {
      const payerNet = nets.find((balance) => balance.userId === next.fromUserId)?.amount ?? 0;
      const recipientNet = nets.find((balance) => balance.userId === next.toUserId)?.amount ?? 0;
      blocked.push({ settlement: next, rawDebt: recipientNet, payerNet });
      break;
    }

    payments = appendPayment(payments, users, next.fromUserId, next.toUserId, next.amount);
    recordedFromSuggestions.push(next);
    trackPaymentTotals(totals, next);
  }

  const finalBalance = computeGroupBalances(expenses, payments);

  return {
    payments,
    recordedFromSuggestions,
    blocked,
    totals,
    originalNets,
    finalNets: finalBalance.netBalances,
    violations: assertNoOverpayOrUnderReceive(originalNets, totals),
    fullySettled: finalBalance.netBalances.length === 0,
  };
}

describe("bug-check full settle-up simulation", () => {
  const users = buildBugCheckUsersRecord();
  const expenses = buildBugCheckExpensesForTest(users);
  const initialPayments = buildBugCheckPaymentsForTest(users);

  it("allows anuraag to pay jishitha 45c via simplified route (no raw debt edge)", () => {
    const { netBalances } = computeGroupBalances(expenses, initialPayments);
    const nets = netBalances.map((balance) => ({
      userId: balance.userId,
      amount: balance.amount,
    }));

    expect(canRecordPayment(nets, "anuraag", "jishitha", 45)).toBe(true);

    const payments = appendPayment(initialPayments, users, "anuraag", "jishitha", 45);
    const after = computeGroupBalances(expenses, payments);
    expect(after.netBalances.find((b) => b.userId === "anuraag")).toBeUndefined();
  });

  it("initial simplified plan respects net limits before any new payments", () => {
    const { netBalances } = computeGroupBalances(expenses, initialPayments);
    const nets = netBalances.map((balance) => ({
      userId: balance.userId,
      amount: balance.amount,
    }));
    const settlements = simplifyDebts(nets);
    const validation = validateSettlements(settlements, nets);

    expect(validation.valid).toBe(true);
    const anuraagSettlement = settlements.find((s) => s.fromUserId === "anuraag");
    expect(anuraagSettlement?.amount).toBe(45);
    expect(anuraagSettlement?.toUserId).toMatch(/^(jishitha|niranjan)$/);
  });

  it("anuraag settles first, then others follow suggestions without overpaying", () => {
    const result = simulateSettleUpFollowingSuggestions(expenses, initialPayments, users, {
      payerOrder: ["anuraag"],
    });

    expect(result.blocked).toEqual([]);
    expect(result.violations).toEqual([]);
    expect(result.fullySettled).toBe(true);

    const anuraagPaid = (result.totals.paid.get("anuraag") ?? 0) + 27;
    expect(anuraagPaid).toBe(72);
    expect(result.totals.paid.get("anuraag")).toBe(45);

    for (const member of BUG_CHECK_MEMBERS) {
      const original = result.originalNets.get(member.key) ?? 0;
      const paid = result.totals.paid.get(member.key) ?? 0;
      const received = result.totals.received.get(member.key) ?? 0;

      if (original < 0) {
        expect(paid).toBeLessThanOrEqual(Math.abs(original));
        expect(paid).toBe(Math.abs(original));
      }
      if (original > 0) {
        expect(received).toBeLessThanOrEqual(original);
        expect(received).toBe(original);
      }
    }
  });

  it("creditors are not short-changed after everyone settles via suggestions", () => {
    const result = simulateSettleUpFollowingSuggestions(expenses, initialPayments, users);

    expect(result.fullySettled).toBe(true);
    expect(result.violations).toEqual([]);

    expect(result.totals.received.get("niranjan")).toBe(428);
    expect(result.totals.received.get("jishitha")).toBe(201);
  });

  it("recomputed suggestions stay valid after each recorded payment", () => {
    let payments = [...initialPayments];

    for (let step = 0; step < 15; step++) {
      const { debts, netBalances } = computeGroupBalances(expenses, payments);
      const nets = netBalances.map((balance) => ({
        userId: balance.userId,
        amount: balance.amount,
      }));

      if (nets.length === 0) break;

      const settlements = simplifyDebts(nets);
      expect(validateSettlements(settlements, nets).valid).toBe(true);

      const next = settlements[0];
      if (!next) break;

      expect(canRecordPayment(nets, next.fromUserId, next.toUserId, next.amount)).toBe(true);
      payments = appendPayment(
        payments,
        users,
        next.fromUserId,
        next.toUserId,
        next.amount,
      );
    }

    const finalNets = computeGroupBalances(expenses, payments).netBalances;
    expect(finalNets).toHaveLength(0);
  });

  it("reports per-user paid vs owed after full settlement", () => {
    const result = simulateSettleUpFollowingSuggestions(expenses, initialPayments, users);

    const report = BUG_CHECK_MEMBERS.map((member) => {
      const original = result.originalNets.get(member.key) ?? 0;
      return {
        member: member.key,
        originalNet: original,
        totalPaid: result.totals.paid.get(member.key) ?? 0,
        totalReceived: result.totals.received.get(member.key) ?? 0,
        paidMoreThanOwed:
          original < 0 && (result.totals.paid.get(member.key) ?? 0) > Math.abs(original),
        receivedLessThanOwed:
          original > 0 && (result.totals.received.get(member.key) ?? 0) < original,
      };
    });

    expect(report.every((row) => !row.paidMoreThanOwed)).toBe(true);
    expect(report.every((row) => !row.receivedLessThanOwed)).toBe(true);
    expect(result.recordedFromSuggestions.length).toBeGreaterThan(0);
  });
});

describe("payment recording order", () => {
  const alice = { id: "alice", name: "Alice", email: "a@test.com" };
  const bob = { id: "bob", name: "Bob", email: "b@test.com" };
  const carol = { id: "carol", name: "Carol", email: "c@test.com" };

  const expenses = [
    {
      paidByUserId: "carol",
      amount: 3000,
      paidBy: carol,
      splits: [
        { userId: "alice", amountOwed: 1000, user: alice },
        { userId: "bob", amountOwed: 1000, user: bob },
        { userId: "carol", amountOwed: 1000, user: carol },
      ],
    },
  ];

  function pay(from: typeof alice, to: typeof carol, amount: number) {
    return {
      id: `p-${from.id}-${to.id}-${amount}`,
      amount,
      createdAt: "2026-06-30",
      fromUserId: from.id,
      toUserId: to.id,
      fromUser: from,
      toUser: to,
    };
  }

  it("final balances are the same regardless of recording order", () => {
    const paymentsA = [pay(alice, carol, 1000), pay(bob, carol, 1000)];
    const paymentsB = [pay(bob, carol, 1000), pay(alice, carol, 1000)];

    const resultA = computeGroupBalances(expenses, paymentsA);
    const resultB = computeGroupBalances(expenses, paymentsB);

    expect(resultA.netBalances).toHaveLength(0);
    expect(resultB.netBalances).toHaveLength(0);
  });

  it("allows late recording if the creditor is still owed", () => {
    const afterBobPaid = computeGroupBalances(expenses, [pay(bob, carol, 1000)]);
    const nets = afterBobPaid.netBalances.map((balance) => ({
      userId: balance.userId,
      amount: balance.amount,
    }));

    expect(canRecordPayment(nets, "alice", "carol", 1000)).toBe(true);

    const allPaid = computeGroupBalances(expenses, [
      pay(bob, carol, 1000),
      pay(alice, carol, 1000),
    ]);
    expect(allPaid.netBalances).toHaveLength(0);
  });

  it("blocks late recording when the creditor is already settled", () => {
    const afterEveryoneElsePaid = computeGroupBalances(expenses, [
      pay(bob, carol, 1000),
      pay(alice, carol, 1000),
    ]);
    expect(afterEveryoneElsePaid.netBalances).toHaveLength(0);

    const nets = afterEveryoneElsePaid.netBalances.map((balance) => ({
      userId: balance.userId,
      amount: balance.amount,
    }));
    expect(canRecordPayment(nets, "alice", "carol", 1000)).toBe(false);
  });

  it("blocks late recording to a creditor who was already paid in full via other routes", () => {
    const expensesWithTwoCreditors = [
      {
        paidByUserId: "carol",
        amount: 2000,
        paidBy: carol,
        splits: [
          { userId: "alice", amountOwed: 1000, user: alice },
          { userId: "bob", amountOwed: 1000, user: bob },
          { userId: "carol", amountOwed: 0, user: carol },
        ],
      },
      {
        paidByUserId: "dave",
        amount: 2000,
        paidBy: { id: "dave", name: "Dave", email: "d@test.com" },
        splits: [
          { userId: "alice", amountOwed: 1000, user: alice },
          { userId: "bob", amountOwed: 1000, user: bob },
          { userId: "dave", amountOwed: 0, user: { id: "dave", name: "Dave", email: "d@test.com" } },
        ],
      },
    ];

    const dave = { id: "dave", name: "Dave", email: "d@test.com" };
    const afterBobSettledDave = computeGroupBalances(expensesWithTwoCreditors, [
      pay(bob, dave, 1000),
    ]);

    const nets = afterBobSettledDave.netBalances.map((balance) => ({
      userId: balance.userId,
      amount: balance.amount,
    }));

    expect(canRecordPayment(nets, "alice", "dave", 1000)).toBe(true);
    expect(canRecordPayment(nets, "alice", "carol", 1000)).toBe(true);

    const afterAllSettled = computeGroupBalances(expensesWithTwoCreditors, [
      pay(bob, dave, 1000),
      pay(bob, carol, 1000),
      pay(alice, dave, 1000),
      pay(alice, carol, 1000),
    ]);
    expect(afterAllSettled.netBalances).toHaveLength(0);
  });
});

describe("settle-up invariant helpers", () => {
  it("sumSettlementsForUser aggregates outgoing payments", () => {
    const settlements = [
      { fromUserId: "bob", toUserId: "alice", amount: 500 },
      { fromUserId: "bob", toUserId: "carol", amount: 500 },
    ];
    expect(sumSettlementsForUser(settlements, "bob", "from")).toBe(1000);
  });
});
