ALTER TYPE "PetType" ADD VALUE IF NOT EXISTS 'TURTLE';
ALTER TYPE "PetType" ADD VALUE IF NOT EXISTS 'FERRET';

ALTER TABLE "NeedPetSnapshotV2"
ADD COLUMN "customPetType" TEXT;

UPDATE "NeedPetSnapshotV2"
SET "customPetType" = BTRIM("petType")
WHERE UPPER(REPLACE(REPLACE(BTRIM("petType"), '-', '_'), ' ', '_')) NOT IN (
  'DOG', 'CAT', 'RABBIT', 'BIRD', 'HAMSTER', 'GUINEA_PIG',
  'CHINCHILLA', 'TURTLE', 'FERRET', 'OTHER'
)
AND BTRIM("petType") NOT IN (
  '狗', '犬', '猫', '兔', '兔子', 'うさぎ', '鸟', '鳥',
  '仓鼠', 'ハムスター', '豚鼠', '荷兰猪', 'モルモット',
  '龙猫', 'チンチラ', '龟', '乌龟', 'カメ',
  '雪貂', 'フェレット', '其他', '其他宠物', 'その他', 'その他のペット'
);

UPDATE "NeedPetSnapshotV2"
SET "petType" = CASE
  WHEN UPPER(BTRIM("petType")) = 'DOG' OR BTRIM("petType") IN ('狗', '犬') THEN 'DOG'
  WHEN UPPER(BTRIM("petType")) = 'CAT' OR BTRIM("petType") = '猫' THEN 'CAT'
  WHEN UPPER(BTRIM("petType")) = 'RABBIT' OR BTRIM("petType") IN ('兔', '兔子', 'うさぎ') THEN 'RABBIT'
  WHEN UPPER(BTRIM("petType")) = 'BIRD' OR BTRIM("petType") IN ('鸟', '鳥') THEN 'BIRD'
  WHEN UPPER(BTRIM("petType")) = 'HAMSTER' OR BTRIM("petType") IN ('仓鼠', 'ハムスター') THEN 'HAMSTER'
  WHEN UPPER(REPLACE(REPLACE(BTRIM("petType"), '-', '_'), ' ', '_')) = 'GUINEA_PIG'
    OR BTRIM("petType") IN ('豚鼠', '荷兰猪', 'モルモット') THEN 'GUINEA_PIG'
  WHEN UPPER(BTRIM("petType")) = 'CHINCHILLA' OR BTRIM("petType") IN ('龙猫', 'チンチラ') THEN 'CHINCHILLA'
  WHEN UPPER(BTRIM("petType")) = 'TURTLE' OR BTRIM("petType") IN ('龟', '乌龟', 'カメ') THEN 'TURTLE'
  WHEN UPPER(BTRIM("petType")) = 'FERRET' OR BTRIM("petType") IN ('雪貂', 'フェレット') THEN 'FERRET'
  WHEN UPPER(BTRIM("petType")) = 'OTHER'
    OR BTRIM("petType") IN ('其他', '其他宠物', 'その他', 'その他のペット') THEN 'OTHER'
  ELSE 'OTHER'
END;

ALTER TABLE "NeedPetSnapshotV2"
ALTER COLUMN "petType" TYPE "PetType"
USING ("petType"::"PetType");

ALTER TABLE "NeedPetSnapshotV2"
ADD CONSTRAINT "NeedPetSnapshotV2_custom_pet_type_check"
CHECK ("petType" = 'OTHER' OR "customPetType" IS NULL);
