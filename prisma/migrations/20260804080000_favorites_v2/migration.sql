CREATE TYPE "FavoriteTargetKindV2" AS ENUM ('NEED', 'SERVICE');
CREATE TYPE "FavoriteTargetSourceV2" AS ENUM ('V2', 'LEGACY');

CREATE TABLE "FavoriteV2" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "targetKind" "FavoriteTargetKindV2" NOT NULL,
  "targetSource" "FavoriteTargetSourceV2" NOT NULL,
  "targetId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FavoriteV2_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FavoriteV2_userId_targetKind_targetSource_targetId_key"
ON "FavoriteV2"("userId", "targetKind", "targetSource", "targetId");
CREATE INDEX "FavoriteV2_userId_createdAt_idx" ON "FavoriteV2"("userId", "createdAt");
CREATE INDEX "FavoriteV2_targetKind_targetSource_targetId_idx"
ON "FavoriteV2"("targetKind", "targetSource", "targetId");

ALTER TABLE "FavoriteV2" ADD CONSTRAINT "FavoriteV2_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
