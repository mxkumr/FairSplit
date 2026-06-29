import { describe, expect, it } from "vitest";
import { computeGroupBalances } from "../balances";
import { buildUserBalanceExplanation } from "../balance-explanation";
import { simplifyDebts, simplifyDebtsPreferDirect } from "../debt-simplification";
import {
  BUG_CHECK_EXPECTED_NET_CENTS,
  BUG_CHECK_MEMBERS,
  BUG_CHECK_PAYMENT,
  buildBugCheckExpensesForTest,
  buildBugCheckPaymentsForTest,
  buildBugCheckUsersRecord,
  type BugCheckMemberKey,
} from "../fixtures/bug-check-group";

const users = buildBugCheckUsersRecord();
const expenses = buildBugCheckExpensesForTest(users);
const payments = buildBugCheckPaymentsForTest(users);

function netByKey(netBalances: { userId: string; amount: number }[]) {
  const map = new Map<BugCheckMemberKey, number>();
  for (const key of Object.keys(BUG_CHECK_EXPECTED_NET_CENTS) as BugCheckMemberKey[]) {
    const entry = netBalances.find((b) => b.userId === key);
    map.set(key, entry?.amount ?? 0);
  }
  return map;
}

describe("bug-check group (11 members, EUR)", () => {
  const { netBalances, debts } = computeGroupBalances(expenses, payments);
  const nets = netByKey(netBalances);

  it("net balances sum to zero", () => {
    const total = netBalances.reduce((sum, b) => sum + b.amount, 0);
    expect(total).toBe(0);
  });

  it.each(
    BUG_CHECK_MEMBERS.map((m) => [m.key, m.name, BUG_CHECK_EXPECTED_NET_CENTS[m.key]] as const),
  )("%s (%s) has expected net balance", (key, _name, expectedCents) => {
    expect(nets.get(key)).toBe(expectedCents);
  });

  it("Raveena owes €0.72 (not €0.12 from partial settlement)", () => {
    expect(nets.get("raveena")).toBe(-72);
  });

  it("Manish Kumar owes €0.74", () => {
    expect(nets.get("manish")).toBe(-74);
  });

  it("Niranjan gets back €4.28", () => {
    expect(nets.get("niranjan")).toBe(428);
  });

  it("Jishitha gets back €2.01 after Anuraag payment", () => {
    expect(nets.get("jishitha")).toBe(201);
  });

  it("Anuraag owes €0.45 after paying Jishitha €0.27", () => {
    expect(nets.get("anuraag")).toBe(-45);
  });

  it("balance explanation net matches computeGroupBalances for each member", () => {
    for (const member of BUG_CHECK_MEMBERS) {
      const { netBalance } = buildUserBalanceExplanation(
        member.key,
        expenses,
        payments,
        "€",
        { subjectName: member.name },
      );
      expect(netBalance).toBe(nets.get(member.key));
    }
  });

  it("simplified settlements from each debtor sum to their net debt", () => {
    const settlements = simplifyDebtsPreferDirect(
      netBalances.map((b) => ({ userId: b.userId, amount: b.amount })),
      debts.map((d) => ({
        fromUserId: d.fromUserId,
        toUserId: d.toUserId,
        amount: d.amount,
      })),
    );

    for (const member of BUG_CHECK_MEMBERS) {
      const net = nets.get(member.key) ?? 0;
      if (net >= 0) continue;

      const totalPaid = settlements
        .filter((s) => s.fromUserId === member.key)
        .reduce((sum, s) => sum + s.amount, 0);

      expect(totalPaid).toBe(Math.abs(net));
    }
  });

  it("Anuraag pays Niranjan €0.45 (not Jishitha after settling flower pot)", () => {
    const settlements = simplifyDebtsPreferDirect(
      netBalances.map((b) => ({ userId: b.userId, amount: b.amount })),
      debts.map((d) => ({
        fromUserId: d.fromUserId,
        toUserId: d.toUserId,
        amount: d.amount,
      })),
    );
    const anuraagPayments = settlements.filter((s) => s.fromUserId === "anuraag");
    expect(anuraagPayments).toEqual([
      { fromUserId: "anuraag", toUserId: "niranjan", amount: 45 },
    ]);
  });

  it("Raveena simplified payments total €0.72", () => {
    const settlements = simplifyDebtsPreferDirect(
      netBalances.map((b) => ({ userId: b.userId, amount: b.amount })),
      debts.map((d) => ({
        fromUserId: d.fromUserId,
        toUserId: d.toUserId,
        amount: d.amount,
      })),
    );
    const raveenaPays = settlements
      .filter((s) => s.fromUserId === "raveena")
      .reduce((sum, s) => sum + s.amount, 0);
    expect(raveenaPays).toBe(72);
  });

  it("recorded payment matches Anuraag → Jishitha €0.27", () => {
    expect(payments).toHaveLength(1);
    expect(payments[0].amount).toBe(BUG_CHECK_PAYMENT.amountCents);
    expect(payments[0].fromUserId).toBe("anuraag");
    expect(payments[0].toUserId).toBe("jishitha");
  });

  it("raw debt count is greater than or equal to simplified settlement count", () => {
    const settlements = simplifyDebtsPreferDirect(
      netBalances.map((b) => ({ userId: b.userId, amount: b.amount })),
      debts.map((d) => ({
        fromUserId: d.fromUserId,
        toUserId: d.toUserId,
        amount: d.amount,
      })),
    );
    expect(debts.length).toBeGreaterThanOrEqual(settlements.length);
  });
});
