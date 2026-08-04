# T09 测试与 CI 策略

## 本地和 CI 命令

| 层级 | 命令 | 当前覆盖 |
|---|---|---|
| Lint | `npm run lint` | Next/React/无障碍静态规则 |
| 类型 | `npm run typecheck` | App、合同、测试、验证切片 |
| 单元 | `npm test` | 状态机、过期、容量、位置、金额 |
| 集成 | `npm run test:integration` | 临时 SQLite validation schema、事务、公开查询、并发容量 |
| E2E | `npm run test:e2e` | Chromium 桌面/Pixel 7：首页、发布/过期、并发容量 |
| i18n | `npm run test:i18n` | zh/en/ja 叶子 key parity |
| 位置隐私 | `npm run test:location-privacy` | 新源码禁用旧 Raw 字段和精确地址词；旧文件显式 allowlist |
| Prisma | `npm run prisma:validate` | 当前生产 schema 静态校验 |
| 聚合门禁 | `npm run quality` | 生成验证 client 后顺序运行以上非 E2E 门禁 |

GitHub Actions 在 Node 20.19.1 上执行 clean `npm ci`、quality、build、安装 Chromium 和 E2E。测试截图、trace、coverage、SQLite 和生成 client 均被忽略。

## 基线与升级规则

- 本次 lint 首次发现并修复 5 个 error：2 个条件 Hook、1 个列表 key、2 处未转义引号。
- 仍有既存 warnings：裸 `<img>`、Hook 依赖和两处不支持的 aria 属性。它们已在 T12 backlog 登记，不提升为“零警告”。
- 新状态机/合同代码必须零 error；不得用全局 disable 绕过。
- 状态/权限/位置/金额 bug 至少有单元测试；事务和查询规则用集成测试；核心用户轨迹用 E2E。
- 测试时钟固定并注入；不得等待真实时间经过。

## 数据库层级

- 第一批验证使用独立 SQLite schema，证明契约与 Prisma 可协作且不会连接线上库。
- 正式 V2 migration 后，CI 增加临时 PostgreSQL，复验部分唯一索引、事务隔离、地理索引和寄养容量锁；SQLite 结果不能替代 PostgreSQL 并发结论。
- 生产 migration drift 需要受保护的只读 shadow/preview DB；无凭据的 PR 只做 schema validate。

## 自验收

- [x] `npm run quality` 全部通过。
- [x] 12 个单元测试、5 个集成测试、6 个桌面/移动 E2E 全部通过。
- [x] 生产构建通过；首次沙箱失败仅因 Google Fonts 网络限制，联网复验成功。
- [x] 故障产物均在 `.gitignore`，真实 env 未提交。

**T09 工程门禁验收结论：通过。**
