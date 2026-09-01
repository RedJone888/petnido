-- Preserve provider-specific display information so account settings can
-- identify connected OAuth accounts without exposing provider identifiers.
ALTER TABLE "Account" ADD COLUMN "providerDisplayName" TEXT;
