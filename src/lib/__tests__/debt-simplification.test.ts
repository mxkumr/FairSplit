import { describe, expect, it } from "vitest";
import {
  simplifyDebts,
  simplifyDebtsPreferDirect,
  validateSettlements,
  waiveSubThresholdBalances,
  MIN_SETTLEMENT_CENTS,
  netsForSettlementSuggestions,
} from "../debt-simplification";

describe("simplifyDebts", () => {
  it("simplifies a 3-way equal split where payer is owed by two others", () => {
    const netBalances = [
      { userId: "alice", amount: 2000 },
      { userId: "bob", amount: -1000 },
      { userId: "charlie", amount: -1000 },
    ];
    const settlements = simplifyDebts(netBalances);

    expect(settlements).toHaveLength(2);
    expect(settlements).toContainEqual({
      fromUserId: "bob",
      toUserId: "alice",
      amount: 1000,
    });
    expect(settlements).toContainEqual({
      fromUserId: "charlie",
      toUserId: "alice",
      amount: 1000,
    });
    expect(validateSettlements(settlements, netBalances).valid).toBe(true);
  });

  it("nets opposing debts between two users", () => {
    const netBalances = [
      { userId: "alice", amount: 500 },
      { userId: "bob", amount: -1500 },
      { userId: "charlie", amount: 1000 },
    ];
    const settlements = simplifyDebts(netBalances);

    expect(settlements).toHaveLength(2);
    expect(settlements).toContainEqual({
      fromUserId: "bob",
      toUserId: "alice",
      amount: 500,
    });
    expect(settlements).toContainEqual({
      fromUserId: "bob",
      toUserId: "charlie",
      amount: 1000,
    });
    expect(validateSettlements(settlements, netBalances).valid).toBe(true);
  });

  it("handles unequal splits across multiple creditors", () => {
    const netBalances = [
      { userId: "alice", amount: 1500 },
      { userId: "bob", amount: 500 },
      { userId: "charlie", amount: -1200 },
      { userId: "dave", amount: -800 },
    ];
    const settlements = simplifyDebts(netBalances);

    const total = settlements.reduce((sum, settlement) => sum + settlement.amount, 0);
    expect(total).toBe(2000);
    expect(settlements.length).toBeLessThanOrEqual(3);
    expect(validateSettlements(settlements, netBalances).valid).toBe(true);
  });

  it("returns empty array when all balances are zero", () => {
    expect(simplifyDebts([])).toEqual([]);
    expect(
      simplifyDebts([
        { userId: "alice", amount: 0 },
        { userId: "bob", amount: 0 },
      ]),
    ).toEqual([]);
  });

  it("keeps stable ordering when amounts tie", () => {
    const netBalances = [
      { userId: "zara", amount: 1000 },
      { userId: "alice", amount: 1000 },
      { userId: "mike", amount: -1000 },
      { userId: "bob", amount: -1000 },
    ];
    const first = simplifyDebts(netBalances);
    const second = simplifyDebts(netBalances);
    expect(first).toEqual(second);
  });

  it("never lets a debtor pay more than they owe", () => {
    const netBalances = [
      { userId: "creditor-a", amount: 428 },
      { userId: "creditor-b", amount: 201 },
      { userId: "debtor-a", amount: -74 },
      { userId: "debtor-b", amount: -72 },
      { userId: "debtor-c", amount: -45 },
    ];
    const settlements = simplifyDebts(netBalances);

    for (const balance of netBalances) {
      if (balance.amount >= 0) continue;
      const paid = settlements
        .filter((settlement) => settlement.fromUserId === balance.userId)
        .reduce((sum, settlement) => sum + settlement.amount, 0);
      expect(paid).toBe(Math.abs(balance.amount));
    }
  });
});

describe("validateSettlements", () => {
  it("rejects settlements that overpay a debtor", () => {
    const netBalances = [
      { userId: "alice", amount: 100 },
      { userId: "bob", amount: -100 },
    ];
    const settlements = [{ fromUserId: "bob", toUserId: "alice", amount: 150 }];
    expect(validateSettlements(settlements, netBalances).valid).toBe(false);
  });

  it("rejects settlements that over-credit a creditor", () => {
    const netBalances = [
      { userId: "alice", amount: 100 },
      { userId: "bob", amount: -100 },
    ];
    const settlements = [{ fromUserId: "bob", toUserId: "alice", amount: 50 }];
    expect(validateSettlements(settlements, netBalances).valid).toBe(false);
  });
});

describe("simplifyDebtsPreferDirect", () => {
  it("routes along expense creditors before greedy remainder", () => {
    const netBalances = [
      { userId: "jishitha", amount: 201 },
      { userId: "niranjan", amount: 428 },
      { userId: "anuraag", amount: -45 },
    ];
    const directDebts = [{ fromUserId: "anuraag", toUserId: "niranjan", amount: 45 }];

    expect(simplifyDebtsPreferDirect(netBalances, directDebts)).toEqual([
      { fromUserId: "anuraag", toUserId: "niranjan", amount: 45 },
    ]);
  });
});

describe("waiveSubThresholdBalances", () => {
  it("folds tiny creditor balance into debtor so one payment remains", () => {
    const nets = [
      { userId: "sanju", amount: 5093 },
      { userId: "niranjan", amount: 8 },
      { userId: "manish", amount: -493 },
    ];

    const waived = waiveSubThresholdBalances(nets);
    const settlements = simplifyDebts(waived);

    expect(waived.find((b) => b.userId === "niranjan")).toBeUndefined();
    expect(settlements).toEqual([{ fromUserId: "manish", toUserId: "sanju", amount: 485 }]);
  });

  it("clears remaining micro-debt after a large partial payment", () => {
    const nets = [{ userId: "sanju", amount: 4608 }, { userId: "manish", amount: -8 }];
    const waived = netsForSettlementSuggestions(nets);

    expect(waived.find((b) => b.userId === "manish")).toBeUndefined();
    expect(simplifyDebts(waived)).toEqual([]);
  });

  it("does not waive balances at or above the threshold", () => {
    const nets = [
      { userId: "alice", amount: 100 },
      { userId: "bob", amount: -100 },
    ];
    expect(waiveSubThresholdBalances(nets, MIN_SETTLEMENT_CENTS)).toEqual(nets);
  });
});
