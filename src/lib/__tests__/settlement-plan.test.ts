import { describe, expect, it } from "vitest";
import { simplifyDebts, sumSettlementsForUser, validateSettlements } from "../debt-simplification";
import {
  applyPaymentsToLockedPlan,
  computeExpenseFingerprint,
  pruneSettlementsToOutstandingNets,
  resolveSettlementPlanState,
} from "../settlement-plan";

describe("applyPaymentsToLockedPlan", () => {
  it("keeps remaining payees stable after a matching payment", () => {
    const locked = [
      { fromUserId: "manish", toUserId: "sanju", amount: 485 },
      { fromUserId: "manish", toUserId: "niranjan", amount: 8 },
    ];

    const after = applyPaymentsToLockedPlan(locked, [
      { fromUserId: "manish", toUserId: "sanju", amount: 485 },
    ]);

    expect(after).toEqual([{ fromUserId: "manish", toUserId: "niranjan", amount: 8 }]);
  });

  it("does not reroute remaining debt to a previous payee", () => {
    const locked = [
      { fromUserId: "manish", toUserId: "sanju", amount: 485 },
      { fromUserId: "manish", toUserId: "niranjan", amount: 8 },
    ];

    const after = applyPaymentsToLockedPlan(locked, [
      { fromUserId: "manish", toUserId: "sanju", amount: 485 },
    ]);

    expect(after.some((row) => row.toUserId === "sanju")).toBe(false);
    expect(after.some((row) => row.toUserId === "niranjan")).toBe(true);
  });
});

describe("computeExpenseFingerprint", () => {
  it("changes when a new expense is added", () => {
    const base = [
      {
        id: "e1",
        amount: 500,
        paidByUserId: "a",
        expenseDate: "2026-01-01T00:00:00.000Z",
        splits: [
          { userId: "a", amountOwed: 250 },
          { userId: "b", amountOwed: 250 },
        ],
      },
    ];
    const withNew = [
      ...base,
      {
        id: "e2",
        amount: 300,
        paidByUserId: "b",
        expenseDate: "2026-01-02T00:00:00.000Z",
        splits: [
          { userId: "a", amountOwed: 150 },
          { userId: "b", amountOwed: 150 },
        ],
      },
    ];

    expect(computeExpenseFingerprint(base)).not.toBe(computeExpenseFingerprint(withNew));
  });
});

describe("resolveSettlementPlanState", () => {
  const expenses = [
    {
      id: "e1",
      amount: 1000,
      paidByUserId: "creditor",
      expenseDate: "2026-01-01T00:00:00.000Z",
      splits: [
        { userId: "debtor", amountOwed: 1000 },
        { userId: "creditor", amountOwed: 0 },
      ],
    },
  ];

  const expenseOnlyNets = [
    { userId: "creditor", amount: 1000 },
    { userId: "debtor", amount: -1000 },
  ];
  const expenseOnlyDebts = [
    { fromUserId: "debtor", toUserId: "creditor", amount: 1000 },
  ];

  it("locks from expense-only nets and reduces by payments (no double-count)", () => {
    const fingerprint = computeExpenseFingerprint(expenses);
    const payments = [{ fromUserId: "debtor", toUserId: "creditor", amount: 400 }];
    const currentNets = [
      { userId: "creditor", amount: 600 },
      { userId: "debtor", amount: -600 },
    ];

    const resolved = resolveSettlementPlanState({
      expenses,
      payments,
      expenseOnlySettlementNets: expenseOnlyNets,
      expenseOnlyDirectDebts: expenseOnlyDebts,
      settlementNets: currentNets,
      directDebts: [{ fromUserId: "debtor", toUserId: "creditor", amount: 600 }],
      storedFingerprint: fingerprint,
      storedPlan: {
        simplified: [{ fromUserId: "debtor", toUserId: "creditor", amount: 1000 }],
        direct: [{ fromUserId: "debtor", toUserId: "creditor", amount: 1000 }],
      },
    });

    expect(resolved.simplified).toEqual([
      { fromUserId: "debtor", toUserId: "creditor", amount: 600 },
    ]);
    expect(resolved.usedLiveFallback).toBe(false);
  });

  it("heals plan locked from post-payment nets that emptied settle-up", () => {
    const fingerprint = computeExpenseFingerprint(expenses);
    // After a 500¢ payment, residual nets are 500¢. A corrupt lock stores 500¢,
    // then applying the same 500¢ payment again empties suggestions while nets remain.
    const payments = [{ fromUserId: "debtor", toUserId: "creditor", amount: 500 }];
    const currentNets = [
      { userId: "creditor", amount: 500 },
      { userId: "debtor", amount: -500 },
    ];

    const corruptPlan = {
      simplified: [{ fromUserId: "debtor", toUserId: "creditor", amount: 500 }],
      direct: [{ fromUserId: "debtor", toUserId: "creditor", amount: 500 }],
    };

    const withoutHeal = applyPaymentsToLockedPlan(corruptPlan.simplified, payments);
    expect(withoutHeal).toEqual([]);

    const resolved = resolveSettlementPlanState({
      expenses,
      payments,
      expenseOnlySettlementNets: expenseOnlyNets,
      expenseOnlyDirectDebts: expenseOnlyDebts,
      settlementNets: currentNets,
      directDebts: [{ fromUserId: "debtor", toUserId: "creditor", amount: 500 }],
      storedFingerprint: fingerprint,
      storedPlan: corruptPlan,
    });

    expect(resolved.simplified).toEqual([
      { fromUserId: "debtor", toUserId: "creditor", amount: 500 },
    ]);
    expect(resolved.planRefreshed).toBe(true);
    expect(resolved.planToPersist?.simplified).toEqual([
      { fromUserId: "debtor", toUserId: "creditor", amount: 1000 },
    ]);
  });

  it("falls back to live nets when off-route payments clear locked routes", () => {
    const fingerprint = computeExpenseFingerprint(expenses);
    // Debtor paid a third party instead of the locked creditor.
    const payments = [{ fromUserId: "debtor", toUserId: "other", amount: 1000 }];
    const currentNets = [
      { userId: "creditor", amount: 1000 },
      { userId: "other", amount: -1000 },
    ];
    const currentDebts = [{ fromUserId: "other", toUserId: "creditor", amount: 1000 }];

    const resolved = resolveSettlementPlanState({
      expenses,
      payments,
      expenseOnlySettlementNets: expenseOnlyNets,
      expenseOnlyDirectDebts: expenseOnlyDebts,
      settlementNets: currentNets,
      directDebts: currentDebts,
      storedFingerprint: fingerprint,
      storedPlan: {
        simplified: [{ fromUserId: "debtor", toUserId: "creditor", amount: 1000 }],
        direct: [{ fromUserId: "debtor", toUserId: "creditor", amount: 1000 }],
      },
    });

    expect(resolved.usedLiveFallback).toBe(true);
    expect(resolved.simplified).toEqual([
      { fromUserId: "other", toUserId: "creditor", amount: 1000 },
    ]);
    // Live residual is not persisted (would double-count on next read).
    expect(resolved.planToPersist).toBeNull();
  });

  it("prunes locked routes that involve already-settled users", () => {
    const pruned = pruneSettlementsToOutstandingNets(
      [
        { fromUserId: "settled", toUserId: "creditor", amount: 100 },
        { fromUserId: "debtor", toUserId: "creditor", amount: 500 },
        { fromUserId: "debtor", toUserId: "alsoSettled", amount: 50 },
      ],
      [
        { userId: "creditor", amount: 500 },
        { userId: "debtor", amount: -500 },
      ],
    );

    expect(pruned).toEqual([{ fromUserId: "debtor", toUserId: "creditor", amount: 500 }]);
  });

  it("builds expense-only plan on first lock when fingerprint is missing", () => {
    const payments = [{ fromUserId: "debtor", toUserId: "creditor", amount: 250 }];
    const currentNets = [
      { userId: "creditor", amount: 750 },
      { userId: "debtor", amount: -750 },
    ];

    const resolved = resolveSettlementPlanState({
      expenses,
      payments,
      expenseOnlySettlementNets: expenseOnlyNets,
      expenseOnlyDirectDebts: expenseOnlyDebts,
      settlementNets: currentNets,
      directDebts: [{ fromUserId: "debtor", toUserId: "creditor", amount: 750 }],
      storedFingerprint: null,
      storedPlan: null,
    });

    expect(resolved.planRefreshed).toBe(true);
    expect(resolved.planToPersist?.simplified).toEqual([
      { fromUserId: "debtor", toUserId: "creditor", amount: 1000 },
    ]);
    expect(resolved.simplified).toEqual([
      { fromUserId: "debtor", toUserId: "creditor", amount: 750 },
    ]);
  });

  it("supplements residual when off-route payments clear a second creditor's routes", () => {
    // Dinner-style: Manish + Ahalya owed; Anuraag was locked to pay Ahalya but paid Manish.
    const currentNets = [
      { userId: "manish", amount: 8127 },
      { userId: "ahalya", amount: 1836 },
      { userId: "ria", amount: 21 },
      { userId: "reshma", amount: -29 },
      { userId: "anuraag", amount: -29 },
      { userId: "devika", amount: -283 },
      { userId: "kiruthi", amount: -1221 },
      { userId: "karan", amount: -1222 },
      { userId: "sanju", amount: -1484 },
      { userId: "raveena", amount: -1484 },
      { userId: "aparna", amount: -1693 },
      { userId: "niranjan", amount: -2539 },
    ];
    const expenseOnlyNetsMulti = currentNets.map((balance) => ({ ...balance }));
    const bump = (id: string, delta: number) => {
      const row = expenseOnlyNetsMulti.find((balance) => balance.userId === id)!;
      row.amount += delta;
    };
    bump("ria", -1557);
    bump("manish", 1557);
    bump("anuraag", -2860);
    bump("manish", 2860);
    bump("reshma", -1661);
    bump("manish", 1661);

    const locked = simplifyDebts(expenseOnlyNetsMulti);
    const payments = [
      { fromUserId: "ria", toUserId: "manish", amount: 1557 },
      { fromUserId: "anuraag", toUserId: "manish", amount: 2860 },
      { fromUserId: "reshma", toUserId: "manish", amount: 1661 },
    ];
    const fingerprint = computeExpenseFingerprint(expenses);

    const resolved = resolveSettlementPlanState({
      expenses,
      payments,
      expenseOnlySettlementNets: expenseOnlyNetsMulti,
      expenseOnlyDirectDebts: [],
      settlementNets: currentNets,
      directDebts: [],
      storedFingerprint: fingerprint,
      storedPlan: { simplified: locked, direct: locked },
    });

    expect(sumSettlementsForUser(resolved.simplified, "ahalya", "to")).toBe(1836);
    expect(sumSettlementsForUser(resolved.simplified, "manish", "to")).toBe(8127);
    expect(validateSettlements(resolved.simplified, currentNets).valid).toBe(true);
    expect(resolved.usedLiveFallback).toBe(true);
    // Residual supplement is not written back into the locked plan.
    expect(resolved.planToPersist).toBeNull();
  });
});
