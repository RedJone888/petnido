-- NeedV2 no longer accepts or stores excluded home-visit dates. Existing
-- records are retired with the schema field because the new publishing flow
-- derives its complete visit cadence from the request dates and interval.
DROP TABLE IF EXISTS "NeedDateExceptionV2";
