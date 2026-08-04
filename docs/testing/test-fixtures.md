# T10 测试数据库与 Fixtures

## 安全边界

- 集成测试只读取 `TEST_DATABASE_URL`，不得回退到开发/生产 `DATABASE_URL`。
- 重置同时要求 `NODE_ENV=test`、`ALLOW_TEST_DB_RESET=true`，且数据库名称包含 `test`；任一不满足即拒绝执行。
- `.env.test` 不提交，CI 使用临时 Postgres service 和短生命周期凭据。
- 种子邮箱均为 `example.invalid`，地点和内容均为虚构数据。

## 使用

```bash
NODE_ENV=test ALLOW_TEST_DB_RESET=true TEST_DATABASE_URL=postgresql://.../petnido_test npm run test:db:reset
TEST_DATABASE_URL=postgresql://.../petnido_test npm run test:integration
```

`tests/fixtures/petnido-fixtures.ts` 提供固定时钟、Asia/Tokyo、游客/owner/provider/双角色/新用户、宠物、默认位置、三模式和寄养容量边界。`prisma/seed-test.mjs` 仅为当前 legacy schema 提供最小兼容数据；目标 V2 表的 seed 随 expand migration 增加。

## 隔离

- 每个集成测试使用唯一 UUID 前缀，并在测试事务中回滚；并发容量测试使用独立 service。
- 时间不得调用裸 `new Date()` 判断业务规则，统一注入固定 clock。
- E2E 失败产生的截图、trace、report 在 `.gitignore` 中排除。

## 自验收

- [x] fixture 覆盖首次/非首次、宠物/位置有无、三模式、过期与容量边界。
- [x] reset/seed 对非测试数据库默认拒绝，且不含真实个人信息。
- [x] 本地执行拒绝路径通过；未对当前线上数据库执行任何写操作。

**T10 测试数据基座验收结论：通过（独立测试库接入后执行写入型集成测试）。**
