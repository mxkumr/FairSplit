import { describe, expect, it } from "vitest";
import { simplifyDebts } from "../debt-simplification";

describe("simplifyDebts", () => {
  it("simplifies a 3-way equal split where payer is owed by two others", () => {
    const settlements = simplifyDebts([
      { userId: "alice", amount: 2000 },
      { userId: "bob", amount: -1000 },
      { userId: "charlie", amount: -1000 },
    ]);

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
  });

  it("nets opposing debts between two users", () => {
    const settlements = simplifyDebts([
      { userId: "alice", amount: 500 },
      { userId: "bob", amount: -1500 },
      { userId: "charlie", amount: 1000 },
    ]);

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
  });

  it("handles unequal splits across multiple creditors", () => {
    const settlements = simplifyDebts([
      { userId: "alice", amount: 1500 },
      { userId: "bob", amount: 500 },
      { userId: "charlie", amount: -1200 },
      { userId: "dave", amount: -800 },
    ]);

    const total = settlements.reduce((sum, s) => sum + s.amount, 0);
    expect(total).toBe(2000);
    expect(settlements.length).toBeLessThanOrEqual(3);
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
});
