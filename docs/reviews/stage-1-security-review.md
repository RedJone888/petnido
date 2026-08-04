# 阶段 1 验收：安全与服务端事实来源

> 验收日期：2026-08-04
> 结论：**Go，可进入阶段 2；生产迁移仍为 No-Go。**

## 1. 完成范围

### 资源权限

- Need 私有详情、编辑、命令和归档均校验 `id + ownerId`。
- Service 私有详情、编辑、暂停/恢复和归档均校验 Service → ServiceProfile → 当前用户。
- ServiceProfile 更新只允许当前用户。
- NeedPet 更新限制在当前 Need 内，不能借宠物明细 ID 修改其他需求。
- 附件认领和同步必须同时满足 attachment ID 与当前 userId。
- 非本人和不存在资源统一返回 `RESOURCE_NOT_FOUND`。

### 状态与删除

- 删除了 Need 任意 `updateStatus(status)` 和 Service 任意 `toggleActive(boolean)` API。
- Need 当前只暴露 `CLOSE/CANCEL` 领域命令，不允许手工标记 MATCHED。
- Service 当前只暴露 `PAUSE/RESUME` 领域命令。
- 命令使用旧状态值作为乐观锁条件，并发变化返回 `CONFLICTING_UPDATE`。
- Need 和 Service 新增可空 `archivedAt`，旧删除入口改为软归档，不再物理删除主记录、附件和价格关系。
- 创建 Need/Service 不再信任客户端提供的初始状态。

### 认证

- 注册验证码改用独立 `EmailVerificationChallenge`，不再将明文验证码写入 NextAuth `VerificationToken`。
- 验证码只保存 bcrypt hash，10 分钟过期，60 秒冷却，每小时最多发送 5 次，最多错误输入 5 次。
- `AuthRateLimitBucket` 对邮箱和请求 IP 进行持久化固定窗口限制，桶 key 使用 HMAC，不保存原始邮箱/IP。
- 验证码采用原子一次性消费；并发验证只有一个请求能创建用户。
- 移除 Credentials 中 `password === "MAGIC_LINK"` 的认证绕过；注册完成后使用用户真实密码登录。
- 邮件、验证码、密码和 token 不进入业务日志。

### 错误合同

- tRPC 返回 `data.appError = {code, messageKey, retryable, correlationId}`。
- 顶层 message 只返回稳定 code；未知内部异常映射为 `UNEXPECTED_ERROR`。
- 新增认证错误码和中英日三语言 key，三语言叶子键数量均为 144。

## 2. 数据库变更

本阶段生成一个 expand-only migration：

- 新增 `EmailVerificationChallenge`。
- 新增 `AuthRateLimitBucket`。
- Need、Service 新增可空 `archivedAt`。
- 未删除、改名或回填任何旧字段。
- 未执行生产 migration deploy，也未写入现有业务数据库。

认证事务在独立 SQLite 验证库复验。正式部署前仍需在 staging PostgreSQL 执行 migration、事务和并发复验。

## 3. 自动化验收

| 检查 | 结果 |
|---|---|
| TypeScript | 通过 |
| ESLint | 通过；仅保留第一批已登记 warning |
| 单元测试 | 22/22 通过 |
| 集成测试 | 8/8 通过 |
| 认证明文/冷却/一次性/并发场景 | 3/3 通过 |
| i18n parity | 144 个叶子键，三语言一致 |
| 位置隐私扫描 | 通过 |
| Prisma validate | 通过 |
| Production build | 通过，34 个路由生成完成 |
| `git diff --check` | 提交前复验 |

## 4. 回归与限制

- 旧需求、服务创建和编辑合同仍保留，但状态操作已收窄为合法命令。
- `/public/needs/[id]` 目前仍依赖旧的私有详情合同；为避免泄露，本阶段先严格限制 Owner DTO。真正的游客 Public DTO 在阶段 4 实现，不以复用私有实体作为临时方案。
- 当前删除按钮名称和提示仍写“删除”，服务端已改为软归档；阶段 2/7 页面统一文案时改为“归档”。
- IP 获取依赖部署代理传入 `x-forwarded-for` / `x-real-ip`。上线前需固定可信代理策略，不能直接信任任意公网客户端头。
- 新 Schema migration 尚未部署，因此包含新认证接口的运行环境必须先在受控开发/staging 数据库应用 migration。

## 5. 阶段结论

阶段 1 的安全阻塞已经消除，测试和构建通过，可以进入阶段 2 的 Profile、Pet、UserLocation、首次引导和 PendingAction 开发。

生产迁移、公开市场和发布流程切换仍不允许执行。
