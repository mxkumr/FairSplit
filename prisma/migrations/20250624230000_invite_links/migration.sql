-- AlterTable
ALTER TABLE "users" ADD COLUMN "friend_invite_token" TEXT;

-- AlterTable
ALTER TABLE "groups" ADD COLUMN "invite_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_friend_invite_token_key" ON "users"("friend_invite_token");

-- CreateIndex
CREATE UNIQUE INDEX "groups_invite_token_key" ON "groups"("invite_token");
