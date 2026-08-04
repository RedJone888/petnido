# T02 Mock、占位与未接线登记

| 位置 | 当前行为 | 风险 | 处理 |
|---|---|---|---|
| 导航通知铃 | `mockNotifications` | 用户看到非真实通知 | 接通知查询；无数据用真实空状态 |
| `/dashboard/messages` | 硬编码会话，发送仅改内存 | 刷新丢失、误导用户 | 重建为 Conversation/Message API |
| `/dashboard/matches` | 硬编码匹配并残留 `test` | 无实际价值 | 接匹配服务并删除测试文本 |
| `/dashboard/notifications` | 只有标题 | 核心状态不可追踪 | 实现通知列表与已读状态 |
| `/dashboard/settings` | `useState` + 模拟保存提示 | 偏好不持久化 | 接 Profile/NotificationPreference |
| `/public/sitters` | 骨架与旧注释样例 | 服务不可发现 | 实现真实公开列表 |
| 需求详情收藏/应聘 | 本地 `isFavorite`/`isApplied` | 刷新丢失且无对方通知 | 接幂等 mutation 与状态查询 |
| 引导需求发布 | 成功时仅清 localStorage | 实际未创建需求 | 接 publish mutation，失败保留草稿 |
| `/auth/verify` | 主要代码被注释 | 邮箱流程中断 | 完成验证状态与错误恢复 |
| 邮件通知 | 直接 Nodemailer 发送 | 缺偏好、重试、去重 | Outbox + worker + preference |

## 清理门槛

- 生产页面不得引用文件名或变量名含 `mock` 的业务数据。
- 成功提示必须以服务端提交成功为前提。
- mutation 后从服务端重新验证关键状态，不能只依赖本地布尔值。
- 每个占位入口要么实现，要么在正式导航中移除并用 feature flag 隔离。

## 自验收

- [x] 对用户可见的主要 mock、占位和假成功路径完成登记。
- [x] 每项给出替换目标和清理门槛。

**T02 Mock 登记验收结论：通过。**
