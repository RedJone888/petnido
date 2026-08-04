# T02 tRPC / API 过程清单

## 1. 已注册 tRPC Router

| Router | Procedure | 鉴权/现状 | 主要问题 |
|---|---|---|---|
| `auth` | `checkEmailExist`、`sendVerificationCode`、`verifyCode` | public | 缺频率限制、统一错误契约和完整验证页 |
| `location` | `search`、`reverse`、`addressSearch` | public | 返回/输入可能包含精确地址文本，不能直接持久化 |
| `need` | `listMine` | protected | 可复用，需目标状态映射 |
| `need` | `listAll` | protected | 游客无法浏览；cursor 输入未实际传给查询层 |
| `need` | `getById` | protected | 公开详情目标冲突 |
| `need` | `createNeed` | protected | 旧扁平模型；事务末尾未返回创建结果；不写回档案 |
| `need` | `updateNeed` | protected | 按 ID 更新，缺 owner 条件 |
| `need` | `updateStatus` | protected | 资源不存在/非本人检查被注释，存在越权风险 |
| `need` | `deleteNeed` | protected | 需确认所有权、软删除和关联影响 |
| `serviceProfile` | `getMine`、`getLocationAndCurrency` | protected | 可复用，地点字段需迁移 |
| `serviceProfile` | `toggleSitterStatus`、`updateInfo` | protected | 使用布尔状态；保存 `baseAreaRaw` |
| `service` | `createService` | protected | 要求先有档案；未在成功后回写默认地点/币种 |
| `service` | `updateService`、`toggleActive`、`deleteService` | protected | 缺严格所有权条件；物理删除风险 |
| `service` | `getById` | protected | 缺所有权/公开视图边界，游客详情不可用 |
| `attachment` | 无 | — | 空 Router |

`bookings.ts` 文件为空且未注册；`posts.ts` 未纳入 `appRouter`。REST 端点另有 NextAuth、上传、地理编码和 tRPC handler。

## 2. 缺失的目标过程

- `profile.*`、`pet.*`、`savedLocation.*`
- `need.publicList/publicDetail/publish/archive/reopen/matches`
- `service.publicList/publicDetail/publish/bulkUpdate/matches`
- `favorite.add/remove/list`
- `application.create/accept/reject/cancel/list`
- `booking.request/confirm/reject/cancel/list/capacity`
- `conversation.list/getOrCreate`、`message.list/send/markRead`
- `notificationPreference.get/update`、`notification.list/markRead`
- `knowledge.list`（若内容不完全静态）

## 3. P0 风险

1. `need.updateStatus` 的权限异常被注释，理论上登录用户可修改他人需求状态。
2. `need.updateNeed` 与多项 service mutation 没有把资源所有者放进更新条件。
3. 浏览型接口错误使用 protected procedure，阻断游客核心路径。
4. 应聘、预约、消息、收藏均无服务端闭环，UI 状态不能作为真实业务状态。
5. 金额混用 `Int` 和 `Float`，会产生精度与汇总差异。

## 自验收

- [x] 对照 `appRouter` 核对了全部已注册 Router。
- [x] 对每个 procedure 标注鉴权、复用价值和主要缺口。
- [x] 列出目标流程缺失接口，并识别越权 P0 风险。

**T02 API 清单验收结论：通过。**
