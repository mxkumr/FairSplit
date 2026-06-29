import { describe, expect, it } from "vitest";
import {
  applyPaymentsToLockedPlan,
  computeExpenseFingerprint,
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
        splits: [{ userId: "a", amountOwed: 250 }, { userId: "b", amountOwed: 250 }],
      },
    ];
    const withNew = [
      ...base,
      {
        id: "e2",
        amount: 300,
        paidByUserId: "b",
        expenseDate: "2026-01-02T00:00:00.000Z",
        splits: [{ userId: "a", amountOwed: 150 }, { userId: "b", amountOwed: 150 }],
      },
    ];

    expect(computeExpenseFingerprint(base)).not.toBe(computeExpenseFingerprint(withNew));
  });
});
