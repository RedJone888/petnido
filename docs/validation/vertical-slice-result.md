# T11 最小纵向验证结果

## 验证范围

验证切片位于 `prisma/validation`、`src/validation/vertical-slice`、非生产 API/page 和对应测试中。仅在 `FEATURE_VERTICAL_SLICE=true` 且非 production 时可访问；正式生产 build 中路由存在但运行时始终返回 404/Not Found。

## 已证明

1. 同一个 Zod 合同供 tRPC caller、服务层和页面/API 测试使用。
2. 上门需求发布事务验证宠物所有权，创建 Need、PetSnapshot、Task、LocationSnapshot，并在最后 upsert 默认位置。
3. 重复宠物造成中途唯一约束失败时，Need、快照和默认位置全部回滚。
4. 相同 idempotency key 返回同一 Need，不重复创建。
5. 公开查询使用 `state=OPEN AND endsAt>now`；到达结束时刻立即消失，无定时任务依赖。
6. Public location 只返回约到小数点后 2 位的坐标和非精确标签。
7. BOARDING 以数据库 trigger 在单条 INSERT 内原子校验宠物数；两个请求并发抢最后一位只有一个成功。
8. HOME_VISIT 不创建/扣减容量 bucket。
9. 桌面和移动端 Playwright 均通过发布/过期和容量并发流程。

## 限制

- 验证库是 SQLite；生产 PostgreSQL 必须用部分唯一索引和事务/锁重新实现容量，不复制 SQLite trigger。
- 验证页是架构探针，不是正式发布 UI；它不替换现有 `/needs/create`。
- 尚未验证真实 NextAuth 首次引导、邮件 Outbox、会话、Application→Booking 和服务推荐。
- 错误三语目前冻结了 key 合同并通过 key parity，尚未把全部新 error key 写入三语消息文件。

## 命令结果

- Unit：12/12 通过。
- Integration：5/5 通过。
- E2E：6/6 通过（桌面 + Pixel 7）。
- TypeScript、Lint、Prisma validate、i18n parity、位置隐私扫描、Next production build：通过。

## 自验收

- [x] 页面、Zod、tRPC、Prisma 使用同一领域定义。
- [x] 失败原子性、过期即时性、位置最小化、幂等和容量并发均有自动测试。
- [x] 验证数据/SQLite/截图/trace 未进入 Git，线上数据库未写入。

**T11 最小纵向验证验收结论：通过；准许复用其模式，不准将试验 SQLite 实现直接生产化。**
