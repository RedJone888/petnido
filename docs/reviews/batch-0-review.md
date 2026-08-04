# T12 第一批评审与开发准入

评审日期：2026-08-04
结论：**Conditional Go——允许进入“认证与档案”正式开发；不允许生产迁移或公开市场上线。**

## 1. 第一批完成情况

| 任务 | 结论 | 证据 |
|---|---|---|
| T00 环境基线 | 通过 | 环境、clean install/build、env 模板、边界记录 |
| T01 页面/视觉审计 | 通过，有 P0 后续项 | 路由/数据源/两表单对比；6 个本地截图步骤；移动端阻塞明确 |
| T02 API/Mock 审计 | 通过 | 已注册 procedures、权限漏洞、空 router、mock 与重复逻辑 |
| T03 数据库/旧数据 | 通过 | 23 migrations 同步；只读脱敏画像；空值/重复/日期/附件/金额风险 |
| T04 Fit-Gap | 通过 | 正式入口、路由、feature flag 和退出条件冻结 |
| T05 状态机/权限 | 通过 | 纯函数、权限矩阵、稳定错误码；单元测试通过 |
| T06 位置合同 | 通过 | strict Zod、公开最小化、源码扫描和合同测试 |
| T07 目标模型/迁移 ADR | 通过 | ADR、ER、RFC；未写生产库 |
| T08 页面/API 合同 | 通过 | 发布、回跳、会话、应聘/预约、列表与 Public DTO |
| T09 CI/测试 | 通过 | quality/build/E2E；GitHub Actions |
| T10 测试数据 | 通过（分层） | 安全 reset guard、synthetic fixtures、SQLite 验证库；正式 Postgres 待 V2 expand |
| T11 纵向验证 | 通过 | 12 unit、5 integration、6 E2E；事务/过期/容量/隐私 |

## 2. 仍未完成或不足

### P0：进入相应功能前必须解决

1. 当前 `need.updateStatus/updateNeed` 和多个 Service mutation 的所有权校验不足；先修复，不放 feature flag。
2. `/needs/create` 仍是假发布且移动端严重破版；需拆分 8545 行组件、接正式事务并修复响应式。
3. 当前生产 Prisma 仍保存旧 Raw 地点、Float 金额、点对点 Message、无 Conversation/Favorite/UserLocation；目标模型尚未 expand migration。
4. 公开需求 detail/list 的游客权限与 procedure 类型不一致；服务/服务者公开 API 和详情页缺失。
5. 首次注册 profile→intent、非首次直达 dashboard、pendingAction 服务端恢复尚未实现。
6. Pet/UserLocation/Provider default 的读取、成功后写回和业务快照尚未生产化。
7. Application、Booking、Conversation/Message、Notification/Outbox Router 尚未实现；现有按钮和页面多为本地状态/mock。
8. 寄养容量只在验证 schema 证明；必须在 PostgreSQL 用并发安全事务/锁实现并压测。
9. 错误码 i18n key 尚未加入三语消息；验证码限流、邮件重试/偏好未完成。
10. 未登录 Dashboard 是死胡同；必须重定向/弹出认证并携带 returnTo。

### P1：MVP 完整性

- 收藏夹保留过期需求、匹配/降级推荐、服务批量开关/地点/币种、寄养容量日历。
- 服务三模式完整字段、优惠说明、附件归属/证明照片、服务暂停与归档。
- 照护知识静态来源、分类、来源记录与免责声明。
- 真实消息已读、通知中心、邮件偏好、验证页错误恢复。
- 三语内容统一；当前公开需求/服务者/dashboard 存在中英日混排。
- 空状态、无权限、冲突重试、离线草稿、焦点/键盘/屏幕阅读器测试。

### P2：质量与维护

- 既存 lint warnings：Hook 依赖、裸 `<img>`、aria role 属性。
- Dashboard 首屏约 472 kB、需求表单约 485 kB；需拆包和性能预算。
- `caniuse-lite` 过期；Google Fonts 构建依赖外网，需自托管字体或缓存策略。
- Nodemailer 7 与旧 `@auth/core` peer 要求冲突；5 个 extraneous WASM 包需依赖树清理。
- Prisma 5、Next 14 均较旧，升级应单独迭代，不与领域迁移混做。
- Attachment 12/17 无父级且 10 个 DELETED；确认暂存策略后再执行可恢复清理。

## 3. 重新估算的后续迭代

| 迭代 | 范围 | 估算 |
|---|---|---:|
| I1 | 权限 P0 修复、错误包装、回归测试 | 2–3 人日 |
| I2 | Profile/Pet/UserLocation + 首次引导 + returnTo/pendingAction | 7–10 人日 |
| I3 | V2 Postgres expand migration、backfill dry-run、双读 mapper | 7–10 人日 |
| I4 | 上门 Need 正式发布、编辑、移动响应式、公开查询 | 8–12 人日 |
| I5 | BOARDING/CUSTOM Need 模式明细与推荐 | 8–12 人日 |
| I6 | ProviderProfile + 三类 Service + 批量设置 | 10–14 人日 |
| I7 | 公开 Service/Provider 市场、筛选与详情 | 6–9 人日 |
| I8 | Conversation/Message + pending action 恢复 | 8–12 人日 |
| I9 | Application/Booking + PostgreSQL 容量并发 | 10–14 人日 |
| I10 | Favorite/Notification/Email Outbox | 6–9 人日 |
| I11 | 三语、无障碍、性能、安全、迁移切流 | 10–15 人日 |

估算不含支付、评价和运营治理。

## 4. Go 条件

认证与档案迭代可以开始，但必须：

- 先合并 P0 权限修复；
- 只用 `MapLocation`，不新增旧 Raw 地点写入；
- 新 API 从本批 Zod/状态机导入，不复制页面类型；
- migration 只 expand，禁止直接改线上数据；
- 每个 1–3 日任务独立验收后再开启下一个依赖项。

## 自验收

- [x] 所有第一批任务都有结论和证据路径。
- [x] P0/P1/P2 不足全部归档，并给出后续迭代归属。
- [x] 准入范围明确区分“可继续开发”与“可生产上线”。
- [x] 无未归属 P0 冲突。

**T12 评审验收结论：Conditional Go。**
