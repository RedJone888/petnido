# T03 Prisma 数据字典与结构审计

审计日期：2026-08-04
验证：`prisma validate` 通过；23 个 migration 与数据库一致。

## 当前模型

| 模型 | 当前用途 | 关键关系 | 主要不足 |
|---|---|---|---|
| User | 账户、角色、认证主体 | Profile、Pet、Need、ServiceProfile 等 | 缺通知偏好、首次引导完成状态 |
| Profile | 简介和 owner/sitter 布尔值 | 1:1 User | 缺昵称/头像领域边界，双布尔状态含义模糊 |
| Pet | 宠物档案 | N:1 User | 年龄用 Int、健康/照护结构化不足，无 updatedAt |
| ServiceProfile | 接单者默认信息 | 1:1 User，1:N Service | 保存 `baseAreaRaw`；缺整体暂停状态和批量设置审计 |
| Service | 服务发布 | N:1 ServiceProfile | 三模式字段不足；可用性过简；无寄养容量 |
| PriceRule | 服务价格规则 | N:1 Service | 无货币最小单位命名和唯一约束 |
| Need | 需求发布 | N:1 User，1:N NeedPet/Application/Booking | 扁平字段无法表达逐次任务；保存 `addressRaw` |
| NeedPet | 需求内宠物快照 | N:1 Need | `petIds` 是字符串数组而非关系；快照规则不明确 |
| Application | 对需求应聘 | N:1 Need/User | 无唯一约束，可能重复应聘；缺会话关联和状态时间 |
| Booking | 确认后的安排 | Need 可选，双方 User | 注释称可来自服务但无 `serviceId`；默认即 CONFIRMED；无宠物数量 |
| Message | 点对点消息 | from/to User | 无 Conversation、已读、关联业务、幂等键 |
| Attachment | 上传文件元数据 | 可挂 Service/Need/Pet/NeedPet | 多个可选父级未约束“只能属于一个”；状态用裸 Int |
| Account/Session/VerificationToken | NextAuth | User | 外键缺显式级联策略，按认证库要求复核 |

## 枚举审计

- `NeedStatus` 缺 DRAFT；EXPIRED 应由 `endDate <= now` 推导，不另存状态。
- `ServiceCategory.OTHER` 应在领域层映射为 CUSTOM，避免 UI 中混用。
- `BookingStatus` 缺 REJECTED；`ApplicationStatus` 与确认后 Booking 的边界需固定。
- `Availability*` 无法表达节假日、排除日期、多个日期段。
- `DistanceRange` 固定档位可保留为 UI preset，但查询应使用数值米数。

## 约束与索引缺口

- 除认证唯一键外几乎没有业务复合唯一键或查询索引。
- 公开需求查询需要 `(status, endDate, createdAt)`，地理搜索需 PostGIS 或明确的坐标范围策略。
- Application 需要 `(needId, sitterId)` 唯一约束。
- Favorite 需要 `(userId, targetType, targetId)` 或分表唯一约束。
- Booking 需要来源约束：need/application 或 service/request 之一，且寄养确认要事务内锁定容量。
- Message 需要 `(conversationId, createdAt)` 索引。
- 多数业务关系没有显式 `onDelete`；不可依赖数据库默认行为。

## 隐私与金额

- `addressRaw`、`areaRaw`、`baseAreaRaw` 与目标策略冲突，应迁移为经纬度和可选非精确 `regionLabel`。
- `Application.price`、`Booking.price` 使用 Float，而需求/价格规则使用 Int；目标统一为整数最小货币单位。
- 宠物健康与照护备注按普通受保护照护数据处理：授权双方可见，不进入公开摘要、邮件正文和应用日志。

## 自验收

- [x] Prisma schema 在虚拟连接串下通过静态验证。
- [x] 线上数据库 migration status 显示 23 个迁移全部同步。
- [x] 模型、枚举、关系、删除、索引、隐私和金额均完成审计。

**T03 数据字典验收结论：通过。**
