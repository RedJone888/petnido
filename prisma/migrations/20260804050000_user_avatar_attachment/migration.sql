-- Expand-only: associate an owned attachment with the user's current avatar.
ALTER TABLE "User" ADD COLUMN "avatarAttachmentId" TEXT;

CREATE UNIQUE INDEX "User_avatarAttachmentId_key"
ON "User"("avatarAttachmentId");

ALTER TABLE "User" ADD CONSTRAINT "User_avatarAttachmentId_fkey"
FOREIGN KEY ("avatarAttachmentId") REFERENCES "Attachment"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
