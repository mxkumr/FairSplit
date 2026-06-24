import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const verifiedAt = new Date();

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: { emailVerifiedAt: verifiedAt },
    create: {
      name: "Alice",
      email: "alice@example.com",
      passwordHash,
      emailVerifiedAt: verifiedAt,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: { emailVerifiedAt: verifiedAt },
    create: {
      name: "Bob",
      email: "bob@example.com",
      passwordHash,
      emailVerifiedAt: verifiedAt,
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@example.com" },
    update: { emailVerifiedAt: verifiedAt },
    create: {
      name: "Charlie",
      email: "charlie@example.com",
      passwordHash,
      emailVerifiedAt: verifiedAt,
    },
  });

  const existingGroup = await prisma.group.findFirst({
    where: { name: "Weekend Trip", createdByUserId: alice.id },
  });

  if (!existingGroup) {
    const group = await prisma.group.create({
      data: {
        name: "Weekend Trip",
        createdByUserId: alice.id,
        members: {
          create: [{ userId: alice.id }, { userId: bob.id }, { userId: charlie.id }],
        },
      },
    });

    await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          groupId: group.id,
          description: "Dinner",
          amount: 3000,
          paidByUserId: alice.id,
        },
      });

      await tx.expenseSplit.createMany({
        data: [
          { expenseId: expense.id, userId: alice.id, amountOwed: 1000 },
          { expenseId: expense.id, userId: bob.id, amountOwed: 1000 },
          { expenseId: expense.id, userId: charlie.id, amountOwed: 1000 },
        ],
      });
    });
  }

  console.log("Seed complete:");
  console.log("  Alice:   alice@example.com / password123");
  console.log("  Bob:     bob@example.com / password123");
  console.log("  Charlie: charlie@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
