-- CreateEnum
CREATE TYPE "SplitMode" AS ENUM ('EVENLY', 'BY_SHARES', 'BY_PERCENTAGE', 'BY_AMOUNT');
CREATE TYPE "RecurrenceRule" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');
CREATE TYPE "ActivityType" AS ENUM ('CREATE_GROUP', 'UPDATE_GROUP', 'CREATE_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE', 'CREATE_PAYMENT', 'ADD_MEMBER', 'REMOVE_MEMBER');

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "grouping" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- AlterTable groups
ALTER TABLE "groups" ADD COLUMN "information" TEXT;
ALTER TABLE "groups" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "groups" ADD COLUMN "currency_symbol" TEXT NOT NULL DEFAULT '$';

-- AlterTable group_members
ALTER TABLE "group_members" ADD COLUMN "is_favorite" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable expenses
ALTER TABLE "expenses" ADD COLUMN "category_id" INTEGER;
ALTER TABLE "expenses" ADD COLUMN "split_mode" "SplitMode" NOT NULL DEFAULT 'EVENLY';
ALTER TABLE "expenses" ADD COLUMN "notes" TEXT;
ALTER TABLE "expenses" ADD COLUMN "is_reimbursement" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "expenses" ADD COLUMN "recurrence_rule" "RecurrenceRule" NOT NULL DEFAULT 'NONE';

-- AlterTable expense_splits
ALTER TABLE "expense_splits" ADD COLUMN "shares" INTEGER NOT NULL DEFAULT 1;

-- CreateTable expense_documents
CREATE TABLE "expense_documents" (
    "id" TEXT NOT NULL,
    "expense_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    CONSTRAINT "expense_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable recurring_expense_links
CREATE TABLE "recurring_expense_links" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "current_frame_expense_id" TEXT NOT NULL,
    "next_expense_created_at" TIMESTAMP(3),
    "next_expense_date" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "recurring_expense_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable activities
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "activity_type" "ActivityType" NOT NULL,
    "user_id" TEXT,
    "expense_id" TEXT,
    "data" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recurring_expense_links_current_frame_expense_id_key" ON "recurring_expense_links"("current_frame_expense_id");
CREATE INDEX "recurring_expense_links_group_id_idx" ON "recurring_expense_links"("group_id");
CREATE INDEX "activities_group_id_created_at_idx" ON "activities"("group_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expense_documents" ADD CONSTRAINT "expense_documents_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_expense_links" ADD CONSTRAINT "recurring_expense_links_current_frame_expense_id_fkey" FOREIGN KEY ("current_frame_expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed categories (Spliit-style groupings)
INSERT INTO "categories" ("grouping", "name") VALUES
  ('General', 'Uncategorized'),
  ('Food & Drink', 'Restaurants'),
  ('Food & Drink', 'Groceries'),
  ('Food & Drink', 'Coffee'),
  ('Transportation', 'Gas'),
  ('Transportation', 'Public transit'),
  ('Transportation', 'Taxi'),
  ('Home', 'Rent'),
  ('Home', 'Utilities'),
  ('Home', 'Household supplies'),
  ('Entertainment', 'Movies'),
  ('Entertainment', 'Games'),
  ('Travel', 'Flights'),
  ('Travel', 'Hotels'),
  ('Travel', 'Activities');
