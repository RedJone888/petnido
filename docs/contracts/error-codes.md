# T08 稳定错误码

| Code | HTTP/tRPC 类别 | 可重试 | i18n key | 使用场景 |
|---|---|---:|---|---|
| `AUTH_REQUIRED` | UNAUTHORIZED | 否 | `errors.authRequired` | 登录后动作 |
| `ONBOARDING_REQUIRED` | PRECONDITION_FAILED | 否 | `errors.onboardingRequired` | 首次资料未完成 |
| `RESOURCE_NOT_FOUND` | NOT_FOUND | 否 | `errors.resourceNotFound` | 不存在或无权枚举 |
| `FORBIDDEN_RESOURCE_ACTION` | FORBIDDEN | 否 | `errors.forbiddenAction` | 已知参与者但无命令权限 |
| `INVALID_STATE_TRANSITION` | CONFLICT | 否 | `errors.invalidStateTransition` | 非法命令 |
| `NEED_EXPIRED` | CONFLICT | 否 | `errors.needExpired` | 结束时间已到 |
| `NEED_NOT_OPEN` | CONFLICT | 否 | `errors.needNotOpen` | 已匹配/关闭/取消 |
| `SERVICE_NOT_ACTIVE` | CONFLICT | 否 | `errors.serviceNotActive` | 暂停/归档服务的新预约 |
| `DUPLICATE_ACTIVE_ATTEMPT` | CONFLICT | 否 | `errors.duplicateActiveAttempt` | 重复应聘/预约 |
| `BOARDING_CAPACITY_EXCEEDED` | CONFLICT | 否 | `errors.boardingCapacityExceeded` | 寄养容量不足 |
| `PRECISE_LOCATION_TEXT_NOT_ALLOWED` | BAD_REQUEST | 否 | `errors.preciseLocationNotAllowed` | 输入精确位置文本 |
| `INVALID_MONEY_RANGE` | BAD_REQUEST | 否 | `errors.invalidMoneyRange` | 区间上限小于下限 |
| `INVALID_TIME_RANGE` | BAD_REQUEST | 否 | `errors.invalidTimeRange` | 结束不晚于开始 |
| `INVALID_FILTER` | BAD_REQUEST | 否 | `errors.invalidFilter` | 列表 URL 参数无效 |
| `IDEMPOTENCY_CONFLICT` | CONFLICT | 否 | `errors.idempotencyConflict` | 同 key 不同载荷 |
| `CONFLICTING_UPDATE` | CONFLICT | 是 | `errors.conflictingUpdate` | 乐观锁/并发变化 |
| `RATE_LIMITED` | TOO_MANY_REQUESTS | 是 | `errors.rateLimited` | 验证码、消息、搜索限流 |
| `INVALID_CODE` | BAD_REQUEST | 是 | `errors.invalidCode` | 验证码不正确 |
| `CODE_EXPIRED` | BAD_REQUEST | 是 | `errors.codeExpired` | 验证码已过期 |
| `TOO_MANY_CODE_ATTEMPTS` | BAD_REQUEST | 是 | `errors.tooManyCodeAttempts` | 验证码错误次数达到上限 |
| `EMAIL_ALREADY_REGISTERED` | CONFLICT | 否 | `errors.emailAlreadyRegistered` | 注册邮箱已经存在 |
| `DEPENDENCY_UNAVAILABLE` | INTERNAL_SERVER_ERROR | 是 | `errors.dependencyUnavailable` | 地图、邮件、上传依赖失败 |
| `UNEXPECTED_ERROR` | INTERNAL_SERVER_ERROR | 是 | `errors.unexpected` | 未知异常的安全外部表示 |

错误信息位于 tRPC 响应 `data.appError`，固定为 `{code, messageKey, retryable, correlationId}`；Zod 字段错误继续位于 `data.zodError`。顶层 `message` 只返回稳定 `code`，不返回 Prisma、数据库或依赖异常正文。`messageKey` 只用于 UI 映射；服务端日志不写请求正文、位置、消息或健康内容。未知异常对外映射 `UNEXPECTED_ERROR`，内部用 correlationId 追踪。

## 自验收

- [x] 状态、权限、容量、位置、金额、幂等、限流和依赖错误均有稳定 code。
- [x] 每项有三语 key 和重试语义。

**T08 错误码验收结论：通过。**
