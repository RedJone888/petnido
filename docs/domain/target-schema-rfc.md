# T07 目标 Prisma Schema RFC（非生产迁移）

本文件冻结字段语义；正式 `schema.prisma` 变更须由独立 expand migration 实现。

## 核心字段草案

```prisma
model UserLocation {
  id String @id @default(cuid())
  userId String
  label String?
  lat Decimal @db.Decimal(9, 6)
  lon Decimal @db.Decimal(9, 6)
  regionLabel String?
  displayPrecision LocationPrecision @default(MAP_POINT)
  isDefault Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([userId, isDefault])
}

model NeedV2 {
  id String @id @default(cuid())
  ownerId String
  mode ServiceMode
  state NeedState @default(DRAFT)
  title String
  startsAt DateTime
  endsAt DateTime
  timeZone String
  locationSnapshotId String @unique
  budgetKind MoneyKind
  minAmountMinor BigInt?
  maxAmountMinor BigInt?
  currency Currency
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([state, endsAt, createdAt])
  @@index([mode, endsAt])
}

model ServiceV2 {
  id String @id @default(cuid())
  providerProfileId String
  mode ServiceMode
  state ServiceState @default(DRAFT)
  locationSnapshotId String @unique
  maxPetCapacity Int? // BOARDING only; CHECK constraint in SQL
  timeZone String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([state, mode, createdAt])
}

model ApplicationV2 {
  id String @id @default(cuid())
  needId String
  applicantId String
  conversationId String
  attemptNo Int
  state ApplicationState @default(PENDING)
  idempotencyKey String @unique
  snapshotId String @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([needId, applicantId, attemptNo])
  @@index([needId, state])
}

model BookingV2 {
  id String @id @default(cuid())
  serviceId String
  applicationId String? @unique
  ownerId String
  providerId String
  conversationId String
  state BookingState @default(PENDING)
  startsAt DateTime
  endsAt DateTime
  timeZone String
  petCount Int
  amountMinor BigInt
  currency Currency
  idempotencyKey String @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([serviceId, startsAt, endsAt, state])
}
```

模式明细、任务、宠物/位置快照、会话参与者、收藏、通知和 Outbox 按 ADR-001 拆表；所有聚合明细显式 `onDelete: Cascade`，历史主体关系默认 Restrict/匿名化。

## 自验收

- [x] RFC 明确可实现的字段、类型、索引、唯一键和模式约束。
- [x] 这是独立草案，未修改或迁移生产 schema。

**T07 Schema RFC 验收结论：通过。**
