ALTER TABLE "groups" ALTER COLUMN "settlement_mode" SET DEFAULT 'DIRECT';
UPDATE "groups" SET "settlement_mode" = 'DIRECT' WHERE "settlement_mode" = 'SIMPLIFIED';
