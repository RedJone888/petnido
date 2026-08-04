# 阶段 3 / 任务 3.2：版本化草稿基础检查点

> 状态：草稿服务端基础通过；任务 3.2 继续进行  
> 日期：2026-08-04

## 已完成

- Need 与 Service 共用 `PublishDraftV2` 元数据、schema version、revision 和状态。
- API payload 按 NEED/SERVICE 分支使用严格 Zod 合同；数据库只保存序列化文本，不接受未经校验的任意 payload。
- 客户端 UUID 作为幂等草稿 ID；重复 create 返回同一草稿。
- save 使用 `expectedRevision` 乐观锁，过期编辑返回 `DRAFT_REVISION_CONFLICT`。
- get/list/save/abandon 全部按当前用户隔离；跨用户统一返回不存在。
- abandon 幂等；已发布草稿不可放弃，已放弃草稿不可继续保存。
- `FEATURE_PUBLISHING_V2` 默认关闭，未显式开启时 Router 失败关闭，不访问未迁移的 V2 表。
- SQLite 验证 schema 与 PostgreSQL production schema 使用相同字段语义。
- 共用 `PublishingFlowShell` 提供响应式步骤导航、完成/当前/锁定语义、保存状态 live region 和前后步骤操作。
- 类型安全的 `usePublishDraft` 客户端统一创建、保存、revision 接替和冲突/失败状态。

## 自行验收

| 验收项 | 结果 |
|---|---|
| 草稿集成测试 | 4 项通过 |
| 全量单元测试 | 8 个文件、35 项通过 |
| 全量集成测试 | 4 个文件、20 项通过 |
| `npm run quality` | 通过 |
| Production build | 通过，43 个 App Router 页面；验证页在生产环境失败关闭 |
| 共用步骤壳专项 E2E | 桌面与移动 2 项通过：保存、刷新恢复、键盘、200% 缩放、无控制台错误 |
| 桌面/移动 E2E 回归 | 14 项通过 |

专项用例覆盖幂等创建、结构化 payload 返回、revision 冲突、跨用户隐藏、Raw 地址字段拒绝、幂等放弃和放弃后保存失败。

## 任务 3.2 剩余

1. 将共用步骤壳和草稿客户端接入正式需求/服务页面，并补充可操作的冲突恢复按钮。
2. 在宠物、地点、日期时间、Money、附件和预览步骤接入统一组件。
3. 把新版需求巨型组件按模式和步骤拆分，并用 mapper 迁移 localStorage v3 草稿。
4. 新建与编辑共用草稿/模式组件；补齐 1024px 验收（1440、390、键盘和 200% 缩放已在验证页通过）。

当前没有把草稿 Router 接到正式页面，也没有把前端预览伪装成发布成功。
