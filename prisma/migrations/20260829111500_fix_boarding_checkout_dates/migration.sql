-- Boarding end dates are checkout dates, unlike the inclusive service-day
-- ranges used by home-visit and custom requests. Correct the reported row
-- that was published before the mode-specific conversion was fixed.
UPDATE "NeedV2"
SET "endsAt" = "endsAt" - INTERVAL '1 day'
WHERE "id" = 'cmt5fxqbh001dde4wzz58zhcj'
  AND "mode" = 'BOARDING';
