import { describe, expect, it } from "vitest";
import { buildUserBalanceExplanation } from "../balance-explanation";

const rakesh = { id: "r", name: "Rakesh", email: "r@x.com" };
const you = { id: "y", name: "You", email: "y@x.com" };
const uma = { id: "u", name: "Uma", email: "u@x.com" };
const manish = { id: "m", name: "Manish", email: "m@x.com" };

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
});
