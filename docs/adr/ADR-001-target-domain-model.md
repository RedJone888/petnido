# ADR-001：目标领域模型

- 状态：Accepted for implementation draft
- 日期：2026-08-04

## 决策

采用关系型、按业务聚合拆分的目标模型；三种模式的可筛选核心字段不得塞进无约束 JSON。现有 Prisma schema 暂不破坏性修改，先以扩展表和兼容 mapper 验证。

## 聚合边界

- Identity：User、Profile、NotificationPreference。
- Owner assets：Pet、UserLocation。
- Provider：ProviderProfile、Service、模式明细、AvailabilityRule/Exception、PriceRule、PetPolicy。
- Need：Need、模式明细、NeedPetSnapshot、NeedTask、NeedLocationSnapshot。
- Interaction：Conversation/Participant/Message、Application、Booking、BookingPetSnapshot、Favorite。
- Delivery：Notification、EmailOutbox。

## 不变量

1. Need 的 `endsAt` 同时是公开过期时间；公开查询要求 OPEN 且 `endsAt > now`。
2. Booking 必须明确来自具体 Service 或已接受 Application；默认 PENDING。
3. 同一 Need/Service 与用户在有效状态下只有一个 active attempt；取消后可新建且历史保留。
4. BOARDING 才有 `maxPetCapacity`，确认时在事务内汇总重叠 CONFIRMED Booking 的 `petCount`。
5. Money 使用整数 `amountMinor` + Currency；时间保存 UTC，并在业务记录保存 IANA `timeZone`。
6. Location 只有 lat/lon、非精确标签和显示精度，数据库无精确地址文本列。
7. 应聘/预约保存来源、宠物、位置、价格与服务规则快照，源记录后改不影响历史。
8. Attachment 每个激活文件必须有唯一业务归属或经明确共享表关联。

## 索引与删除

- Need：`(state, endsAt, createdAt)`；Service：`(state, mode, createdAt)`。
- Application：`(needId, applicantId, attemptNo)` unique；另以部分唯一索引限制 active attempt（原生 SQL migration）。
- Booking：`(serviceId, startsAt, endsAt, state)`，确认容量用行锁/可串行化事务或 advisory lock。
- Conversation：`contextKey` unique；Message：`(conversationId, createdAt, id)`。
- Favorite：`(userId, targetType, targetId)` unique。
- 业务历史默认 RESTRICT/匿名化，不级联删除；纯明细随聚合 CASCADE；账户删除将主体替换为匿名稳定引用。

## 取舍

- 模式明细增加表数量，但换来可验证约束和可索引筛选。
- 公开坐标采用近似 DTO；业务双方确认后才拿任务快照完整选点。
- EXPIRED 不单独存储，避免定时任务延迟造成状态不一致。

## 自验收

- [x] 三种需求/服务、会话、收藏、通知、Outbox 和快照均有模型位置。
- [x] Booking、容量、金额、时区、位置和主要索引有数据库级策略。
- [x] 不依赖 JSON 临时兜底实现核心筛选。

**T07 目标模型 ADR 验收结论：通过。**
