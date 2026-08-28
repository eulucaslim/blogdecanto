-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "User"
    ADD COLUMN "googleSubject" TEXT,
    ADD COLUMN "avatarUrl" TEXT,
    ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER',
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing accounts may be passwordless after Google OAuth is enabled.
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Post"
    ADD COLUMN "title" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "slug" TEXT,
    ADD COLUMN "excerpt" TEXT,
    ADD COLUMN "coverImageKey" TEXT,
    ADD COLUMN "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN "publishedAt" TIMESTAMP(3),
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Give pre-existing posts deterministic slugs before enforcing the required unique field.
UPDATE "Post"
SET "slug" = 'post-' || "id"
WHERE "slug" IS NULL;

ALTER TABLE "Post" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Post" ALTER COLUMN "title" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSubject_key" ON "User"("googleSubject");
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");
