# T04 Feature Flag 与回滚计划

## Flags

| Flag | 默认 | 控制范围 | 回滚动作 |
|---|---|---|---|
| `FEATURE_GUIDED_NEED_PUBLISH` | off | 新引导流程真实发布 | 切回旧新建页；保留草稿 |
| `FEATURE_PUBLIC_MARKETPLACE_V2` | off | `/needs`、`/services`、`/providers` | 旧公开页继续只读 |
| `FEATURE_CONVERSATIONS_V2` | off | 会话、应聘/预约消息 | 禁止新动作，已建数据保持可读 |
| `FEATURE_PROFILE_DEFAULTS_V2` | off | 宠物、地点、币种自动写回 | 停止双写，继续读旧默认 |
| `FEATURE_BOARDING_CAPACITY` | off | 寄养宠物数容量检查 | 暂停新确认，不回滚已确认预约 |
| `FEATURE_EMAIL_OUTBOX` | off | 异步邮件通知 | 停 worker；站内通知继续 |

## 实施要求

- Flag 在服务端判定，公开环境变量只用于纯展示差异。
- 每个 flag 有 owner、启用时间、监控指标和最晚清理日期。
- 写路径 flag 必须定义关闭后的数据可读性，不能通过关 flag 丢失已创建记录。
- 数据库变更使用 expand/contract，不用回滚 migration 删除线上列。
- P0 权限修复不放 flag，直接修复并回归。

## 自验收

- [x] 覆盖发布、公开市场、会话、档案默认、容量和邮件六个高风险切片。
- [x] 每项说明关闭后的真实数据处理。
- [x] 明确权限问题不能用 flag 延后。

**T04 Feature Flag 验收结论：通过。**
