import { describe, expect, it } from "vitest";
import { computeGroupBalances } from "../balances";
import {
  buildSettlementExplanation,
  buildUserBalanceExplanation,
} from "../balance-explanation";
import { simplifyDebts } from "../debt-simplification";

const rakesh = { id: "r", name: "Rakesh", email: "r@x.com" };
const you = { id: "y", name: "You", email: "y@x.com" };
const uma = { id: "u", name: "Uma", email: "u@x.com" };
const manish = { id: "m", name: "Manish", email: "m@x.com" };

const jishitha = { id: "j", name: "Jishitha", email: "j@x.com" };
const niranjan = { id: "n", name: "Niranjan Madan", email: "n@x.com" };
const raveena = { id: "rv", name: "Raveena Ramamurthy", email: "r@x.com" };

describe("buildUserBalanceExplanation", () => {
  it("explains net owe like the user example", () => {
    const expenses = [
      {
        id: "e1",
        description: "Dinner",
        expenseDate: "2025-06-01",
        paidByUserId: rakesh.id,
        amount: 10000,
        paidBy: rakesh,
        splits: [{ userId: you.id, amountOwed: 10000, user: you }],
      },
      {
        id: "e2",
        description: "Lunch",
        expenseDate: "2025-06-02",
        paidByUserId: you.id,
        amount: 8000,
        paidBy: you,
        splits: [{ userId: uma.id, amountOwed: 8000, user: uma }],
      },
      {
        id: "e3",
        description: "Snacks",
        expenseDate: "2025-06-03",
        paidByUserId: you.id,
        amount: 1000,
        paidBy: you,
        splits: [{ userId: manish.id, amountOwed: 1000, user: manish }],
      },
    ];

    const { lines, netBalance } = buildUserBalanceExplanation(you.id, expenses, []);

    expect(netBalance).toBe(-1000);
    expect(lines).toHaveLength(3);
    expect(lines[0].text).toContain("Rakesh paid for you");
    expect(lines[1].text).toContain("You paid for Uma");
    expect(lines[2].text).toContain("You paid for Manish");
  });

  it("matches computeGroupBalances net when credits offset debts", () => {
    const expenses = [
      {
        id: "e1",
        description: "Flower pot",
        expenseDate: "2025-06-01",
        paidByUserId: jishitha.id,
        amount: 54,
        paidBy: jishitha,
        splits: [
          { userId: raveena.id, amountOwed: 27, user: raveena },
          { userId: jishitha.id, amountOwed: 27, user: jishitha },
        ],
      },
      {
        id: "e2",
        description: "Cake",
        expenseDate: "2025-06-02",
        paidByUserId: niranjan.id,
        amount: 90,
        paidBy: niranjan,
        splits: [
          { userId: raveena.id, amountOwed: 45, user: raveena },
          { userId: niranjan.id, amountOwed: 45, user: niranjan },
        ],
      },
      {
        id: "e3",
        description: "Dinner",
        expenseDate: "2025-06-03",
        paidByUserId: raveena.id,
        amount: 60,
        paidBy: raveena,
        splits: [{ userId: niranjan.id, amountOwed: 60, user: niranjan }],
      },
    ];

    const { netBalance: explainedNet, lines } = buildUserBalanceExplanation(
      raveena.id,
      expenses,
      [],
      "€",
      { subjectName: raveena.name },
    );
    const { netBalances, debts } = computeGroupBalances(expenses);
    const raveenaNet = netBalances.find((b) => b.userId === raveena.id)?.amount ?? 0;

    expect(explainedNet).toBe(-12);
    expect(raveenaNet).toBe(-12);
    expect(lines).toHaveLength(3);

    const settlements = simplifyDebts(
      netBalances.map((b) => ({ userId: b.userId, amount: b.amount })),
    );
    const raveenaToJishitha = settlements.find(
      (s) => s.fromUserId === raveena.id && s.toUserId === jishitha.id,
    );
    expect(raveenaToJishitha?.amount).toBe(12);

    const directDebt =
      debts.find((d) => d.fromUserId === raveena.id && d.toUserId === jishitha.id)?.amount ?? 0;
    expect(directDebt).toBe(27);

    const { summary } = buildSettlementExplanation({
      fromUser: raveena,
      toUser: jishitha,
      amount: 12,
      lines,
      netBalance: raveenaNet,
      directDebtAmount: directDebt,
      currencySymbol: "€",
    });

    expect(summary).toContain("€0.12");
    expect(summary).not.toContain("€0.72");
    expect(summary).toContain("settle up");
  });
});
