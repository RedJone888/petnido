# T08 页面、表单与 tRPC 合同

## 1. 页面到 API

| 页面/动作 | Query | Command | 权限 |
|---|---|---|---|
| `/needs` | `need.publicList` | `favorite.toggle` | Query public；收藏登录 |
| `/needs/[id]` | `need.publicDetail` | `conversation.consultNeed`、`application.create` | 详情 public；动作登录 |
| `/services` | `service.publicList` | `favorite.toggle` | 同上 |
| `/services/[id]` | `service.publicDetail`、`booking.capacityByDate` | `conversation.consultService`、`booking.request` | 详情 public；动作登录 |
| `/providers/[id]` | `provider.publicDetail` | 会话或预约命令 | public/登录 |
| `/needs/create` | `profile.pets`、`profile.locations` | `need.publish` | 登录 |
| `/services/create` | `provider.defaults` | `service.publish` | 登录且已开通 ProviderProfile |
| `/applications` | `application.listMine` | `accept/decline/cancel` | 参与者 |
| `/bookings` | `booking.listMine` | `confirm/reject/cancel` | 参与者 |
| `/messages/[id]` | `conversation.detail`、`message.list` | `message.send/markRead` | 参与者 |
| `/profile/*` | profile/pet/location queries | 对应 upsert/archive | 所有者 |

## 2. 发布事务

### Need.publish

输入使用 `needPublishSchema`。事务顺序：验证/授权→创建必要 Pet→创建 Need 和不可变快照/任务→成功后 upsert 默认 UserLocation→提交。任何一步失败全部回滚。响应 `{needId, matchedServices[], fallbackServices[], notificationPrompt}`，Public DTO 另查。

步骤条件：基础信息→宠物（有档案可选，无则 NEW）→模式字段→时间/任务→位置（默认可改）→费用→预览。字段出现在其业务步骤，不人为把宠物或位置提前/推后。

### Service.publish

输入使用 `servicePublishSchema`。事务顺序：验证 ProviderProfile→创建 Service/模式明细/规则/快照→关联已归属附件→成功后 upsert 服务档案默认位置和币种→提交。响应 `{serviceId, matchedNeeds[], nearbyNeeds[], notificationPrompt}`。

BOARDING 必须有 `maxPetCapacity`；其他模式禁止该字段。

## 3. 登录回跳

`pendingActionSchema` 保存 `returnTo/actionKind/targetId/draftId?/expiresAt`。载荷保存在服务端 session 或签名 token；登录后回到目标页面，展示一次确认，再用 idempotency key 执行。首次注册先完成 `/onboarding/profile` 和 `/onboarding/intent`；非首次直接 `/dashboard`。

## 4. 应聘、预约和会话

- `application.create`：要求 Need 可交互、非本人、无 active attempt；原子创建 PENDING Application、复用/创建 Conversation、写系统消息和首条用户消息。
- `application.accept`：只有 Need owner；事务内结束其他 pending attempt（UI 显示 NEED_ENDED）、Need→MATCHED，并创建/关联 PENDING Booking，不直接显示预约完成。
- `booking.request`：明确时间段和 petIds；创建 PENDING BookingRequest 与会话。
- `booking.confirm`：只有 provider；Service ACTIVE；若 BOARDING，在同一锁内按重叠时段汇总 CONFIRMED `petCount`，通过后才 CONFIRMED。
- 所有命令必须携带 UUID idempotency key；取消后新 attempt 使用新 key 和 attemptNo。

## 5. 列表合同

- Cursor 为不透明字符串，默认 20，最大 50；服务端稳定排序 `createdAt DESC, id DESC`。
- Need filters：坐标+半径、预算类型/范围/币种、宠物类型、任务类别、时间范围、模式。
- Service filters：坐标+半径、价格、宠物策略、可用时间、模式。
- 公开 Need 强制 `state=OPEN AND endsAt>now`；收藏查询不加公开过滤并返回 `isExpired`。
- URL 参数是可分享的规范值；无效参数返回 `INVALID_FILTER`，不静默扩大结果。

## 6. Public DTO 最小化

公开 DTO 仅含展示 ID、标题/介绍、模式、近似位置、时间、价格、宠物类型/体型/年龄段和公开附件。排除：邮箱、完整坐标、旧位置文本、宠物姓名与健康/照护备注、内部状态历史、消息、未公开档案和附件签名。

## 7. 邮件提示

Need/Service 发布成功后查询 `notificationPreference`. 未开启时响应 `notificationPrompt=true`，页面询问是否开启即时邮件。邮件只含事件类型、对方公开昵称和站内链接，不含消息正文、地图坐标或宠物健康内容。

## 自验收

- [x] 首次/非首次、回跳、三类发布、档案默认、匹配、邮件提示均有合同。
- [x] 应聘/预约只有确认后成功，并明确会话复用、幂等与容量事务。
- [x] 列表 cursor/filter 和 Public DTO 字段边界固定。
- [x] 页面无需直接提交任意 status。

**T08 页面/API 合同验收结论：通过。**
