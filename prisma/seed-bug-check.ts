import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import {
  BUG_CHECK_CAKE,
  BUG_CHECK_FLOWER_POT,
  BUG_CHECK_GROUP_NAME,
  BUG_CHECK_MEMBERS,
  BUG_CHECK_PASSWORD,
  BUG_CHECK_PAYMENT,
  flattenSplits,
} from "../src/lib/fixtures/bug-check-group";

const prisma = new PrismaClient();

function inviteToken() {
  return randomBytes(18).toString("base64url");
}

async function main() {
  const passwordHash = await bcrypt.hash(BUG_CHECK_PASSWORD, 12);
  const verifiedAt = new Date();

  const userIds: Record<string, string> = {};

  for (const member of BUG_CHECK_MEMBERS) {
    const user = await prisma.user.upsert({
      where: { email: member.email },
      update: { name: member.name, emailVerifiedAt: verifiedAt },
      create: {
        name: member.name,
        email: member.email,
        passwordHash,
        emailVerifiedAt: verifiedAt,
      },
    });
    userIds[member.key] = user.id;
  }

  const manishId = userIds.manish;

  let group = await prisma.group.findFirst({
    where: { name: BUG_CHECK_GROUP_NAME },
  });

  if (!group) {
    group = await prisma.group.create({
      data: {
        name: BUG_CHECK_GROUP_NAME,
        information: "11-member EUR group for balance & settle-up bug checking",
        currency: "EUR",
        currencySymbol: "€",
        inviteToken: inviteToken(),
        createdByUserId: manishId,
        members: {
          create: BUG_CHECK_MEMBERS.map((m) => ({
            userId: userIds[m.key],
            joinedAt: new Date("2026-06-27"),
          })),
        },
      },
    });
  } else {
    await prisma.payment.deleteMany({ where: { groupId: group.id } });
    await prisma.expense.deleteMany({ where: { groupId: group.id } });

    for (const member of BUG_CHECK_MEMBERS) {
      await prisma.groupMember.upsert({
        where: {
          groupId_userId: { groupId: group.id, userId: userIds[member.key] },
        },
        update: {},
        create: { groupId: group.id, userId: userIds[member.key] },
      });
    }
  }

  const foodCategory = await prisma.category.findFirst({
    where: { grouping: "Food & Drink", name: "Food & Drink" },
  });

  async function createExpense(
    config: typeof BUG_CHECK_FLOWER_POT | typeof BUG_CHECK_CAKE,
  ) {
    const paidByUserId = userIds[config.paidBy];
    const splits = flattenSplits(config.splits);

    return prisma.expense.create({
      data: {
        groupId: group!.id,
        description: config.description,
        amount: config.amountCents,
        paidByUserId,
        expenseDate: new Date(config.expenseDate),
        categoryId:
          "category" in config && config.category && foodCategory
            ? foodCategory.id
            : undefined,
        splits: {
          create: splits.map((s) => ({
            userId: userIds[s.key],
            amountOwed: s.amountOwed,
          })),
        },
      },
    });
  }

  await createExpense(BUG_CHECK_FLOWER_POT);
  await createExpense(BUG_CHECK_CAKE);

  await prisma.payment.create({
    data: {
      groupId: group.id,
      fromUserId: userIds[BUG_CHECK_PAYMENT.from],
      toUserId: userIds[BUG_CHECK_PAYMENT.to],
      amount: BUG_CHECK_PAYMENT.amountCents,
      createdAt: new Date(BUG_CHECK_PAYMENT.createdAt),
      note: "Payment recorded",
    },
  });

  console.log("\n✓ Bug-check mock group seeded\n");
  console.log(`  Group: "${BUG_CHECK_GROUP_NAME}"`);
  console.log(`  Group ID: ${group.id}`);
  console.log(`  Currency: EUR (€)`);
  console.log("\n  Login as any member (password for all):");
  console.log(`    ${BUG_CHECK_PASSWORD}\n`);

  for (const m of BUG_CHECK_MEMBERS) {
    const marker = m.key === "manish" ? "  → " : "    ";
    console.log(`${marker}${m.email}  (${m.name})`);
  }

  console.log("\n  Open: http://localhost:3000 → log in as manish@bugcheck.test");
  console.log(`  Then open group "${BUG_CHECK_GROUP_NAME}"\n`);
  console.log("  Run automated checks: npm test -- bug-check-group\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
