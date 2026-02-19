/*
  Warnings:

  - The `session_state` column on the `Account` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "session_state",
ADD COLUMN     "session_state" JSONB;
