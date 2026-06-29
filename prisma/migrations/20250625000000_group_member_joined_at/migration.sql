-- AlterTable
ALTER TABLE "group_members" ADD COLUMN "joined_at" TIMESTAMP(3);

-- Backfill: group creator joined when the group was created
UPDATE "group_members" AS gm
SET "joined_at" = g."created_at"
FROM "groups" AS g
WHERE gm."group_id" = g."id" AND gm."user_id" = g."created_by";

-- Remaining members: use current timestamp (new joins will get accurate times)
UPDATE "group_members"
SET "joined_at" = CURRENT_TIMESTAMP
WHERE "joined_at" IS NULL;

ALTER TABLE "group_members" ALTER COLUMN "joined_at" SET NOT NULL;
ALTER TABLE "group_members" ALTER COLUMN "joined_at" SET DEFAULT CURRENT_TIMESTAMP;
