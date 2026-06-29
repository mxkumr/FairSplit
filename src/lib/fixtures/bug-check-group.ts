/**
 * Mock group matching production bug-check scenario (11 members, EUR).
 * Flower pot €3.00 + Cake €5.00 + Anuraag → Jishitha payment €0.27
 */

export const BUG_CHECK_GROUP_NAME = "Bug Check - Team Expenses";

export const BUG_CHECK_PASSWORD = "password123";

export type BugCheckMemberKey =
  | "karan"
  | "aparna"
  | "manish"
  | "sanju"
  | "niranjan"
  | "ahalya"
  | "jishitha"
  | "raveena"
  | "samihan"
  | "reshma"
  | "anuraag";

export const BUG_CHECK_MEMBERS: {
  key: BugCheckMemberKey;
  name: string;
  email: string;
}[] = [
  { key: "karan", name: "Karan", email: "karan@bugcheck.test" },
  { key: "aparna", name: "aparna abhishree", email: "aparna@bugcheck.test" },
  { key: "manish", name: "Manish Kumar", email: "manish@bugcheck.test" },
  { key: "sanju", name: "Sanju", email: "sanju@bugcheck.test" },
  { key: "niranjan", name: "Niranjan Madan", email: "niranjan@bugcheck.test" },
  { key: "ahalya", name: "Ahalya", email: "ahalya@bugcheck.test" },
  { key: "jishitha", name: "Jishitha", email: "jishitha@bugcheck.test" },
  { key: "raveena", name: "Raveena Ramamurthy", email: "raveena@bugcheck.test" },
  { key: "samihan", name: "Samihan", email: "samihan@bugcheck.test" },
  { key: "reshma", name: "Reshma", email: "reshma@bugcheck.test" },
  { key: "anuraag", name: "Anuraag", email: "anuraag@bugcheck.test" },
];

/** Net balance in cents (positive = gets back, negative = owes) */
export const BUG_CHECK_EXPECTED_NET_CENTS: Record<BugCheckMemberKey, number> = {
  niranjan: 428,
  jishitha: 201,
  anuraag: -45,
  raveena: -72,
  samihan: -72,
  reshma: -72,
  aparna: -73,
  sanju: -73,
  karan: -74,
  manish: -74,
  ahalya: -74,
};

export const BUG_CHECK_FLOWER_POT = {
  description: "Flower pot",
  amountCents: 300,
  paidBy: "jishitha" as BugCheckMemberKey,
  expenseDate: "2026-06-28",
  splits: {
    28: ["karan", "manish", "ahalya"] as BugCheckMemberKey[],
    27: [
      "aparna",
      "sanju",
      "niranjan",
      "jishitha",
      "raveena",
      "samihan",
      "reshma",
      "anuraag",
    ] as BugCheckMemberKey[],
  },
};

export const BUG_CHECK_CAKE = {
  description: "Cake",
  amountCents: 500,
  paidBy: "niranjan" as BugCheckMemberKey,
  expenseDate: "2026-06-28",
  category: "Food & Drink",
  splits: {
    46: ["karan", "aparna", "manish", "sanju", "ahalya"] as BugCheckMemberKey[],
    45: [
      "niranjan",
      "jishitha",
      "raveena",
      "samihan",
      "reshma",
      "anuraag",
    ] as BugCheckMemberKey[],
  },
};

export const BUG_CHECK_PAYMENT = {
  from: "anuraag" as BugCheckMemberKey,
  to: "jishitha" as BugCheckMemberKey,
  amountCents: 27,
  createdAt: "2026-06-29",
};

export function flattenSplits(
  splits: Record<number, BugCheckMemberKey[]>,
): { key: BugCheckMemberKey; amountOwed: number }[] {
  const result: { key: BugCheckMemberKey; amountOwed: number }[] = [];
  for (const [amount, keys] of Object.entries(splits)) {
    for (const key of keys) {
      result.push({ key, amountOwed: Number(amount) });
    }
  }
  return result;
}

export type BugCheckUser = { id: string; name: string; email: string };

export function buildBugCheckExpensesForTest(
  users: Record<BugCheckMemberKey, BugCheckUser>,
) {
  function toExpense(
    id: string,
    config: typeof BUG_CHECK_FLOWER_POT | typeof BUG_CHECK_CAKE,
  ) {
    const paidBy = users[config.paidBy];
    const splits = flattenSplits(config.splits).map((s) => ({
      userId: users[s.key].id,
      amountOwed: s.amountOwed,
      user: users[s.key],
    }));
    return {
      id,
      description: config.description,
      expenseDate: config.expenseDate,
      paidByUserId: paidBy.id,
      amount: config.amountCents,
      paidBy,
      splits,
    };
  }

  return [
    toExpense("flower-pot", BUG_CHECK_FLOWER_POT),
    toExpense("cake", BUG_CHECK_CAKE),
  ];
}

export function buildBugCheckPaymentsForTest(
  users: Record<BugCheckMemberKey, BugCheckUser>,
) {
  const fromUser = users[BUG_CHECK_PAYMENT.from];
  const toUser = users[BUG_CHECK_PAYMENT.to];
  return [
    {
      id: "payment-1",
      amount: BUG_CHECK_PAYMENT.amountCents,
      createdAt: BUG_CHECK_PAYMENT.createdAt,
      fromUserId: fromUser.id,
      toUserId: toUser.id,
      fromUser,
      toUser,
    },
  ];
}

export function buildBugCheckUsersRecord(): Record<BugCheckMemberKey, BugCheckUser> {
  const record = {} as Record<BugCheckMemberKey, BugCheckUser>;
  for (const m of BUG_CHECK_MEMBERS) {
    record[m.key] = { id: m.key, name: m.name, email: m.email };
  }
  return record;
}
