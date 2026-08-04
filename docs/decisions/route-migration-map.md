# T04 路由迁移图

| 当前 | 目标 | 迁移措施 | 删除条件 |
|---|---|---|---|
| `/home-v2` | `/` | 合并组件后 308 到 `/` | 首页视觉/SEO/三语言验收 |
| `/public/needs` | `/needs` | 新路径先上线；旧路径 308 | 搜索、详情和收藏链接迁移完成 |
| `/public/needs/[id]` | `/needs/[id]` | 保留拦截式详情体验 | 外部链接回归通过 |
| `/public/sitters` | `/providers` | 重建列表后重定向 | provider API 上线 |
| `/dashboard/needs/new` | `/needs/create` | feature flag 切换入口 | 新发布闭环稳定一个版本 |
| `/dashboard/messages` | `/messages` | Dashboard 保留导航壳 | Conversation API 上线 |
| `/dashboard/notifications` | `/notifications` | 可先保留旧别名 | 通知偏好和列表上线 |
| `/dashboard/settings` | `/settings` | 分拆 profile/security/notifications | 设置持久化完成 |

## 登录回跳契约

登录前动作保存 `{returnTo, actionKind, targetId, draftId?, expiresAt}`，服务端签名或保存在 session；不得只依赖可篡改 localStorage。成功登录后先恢复页面，再由用户确认执行一次，幂等键防止重复应聘/预约。

## 自验收

- [x] 所有重复或旧公开入口均有目标路径和删除条件。
- [x] 登录回跳覆盖动作载荷、过期与幂等，而不只是 URL。

**T04 路由迁移验收结论：通过。**
