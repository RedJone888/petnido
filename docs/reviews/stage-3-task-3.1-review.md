# 阶段 3 / 任务 3.1 自行验收报告

> 结论：开发继续 Go；生产 migration No-Go  
> 日期：2026-08-04

## 完成内容

- 六种发布模式的字段级 `KEEP / TRANSFORM / REPLACE / DEFER` 矩阵。
- 版本化 Need/Service Draft 与 Publish Zod 合同。
- 严格的位置、Money、附加费用、任务引用、上门次数、可用性和寄养容量校验。
- V2 expand-only Prisma 模型：草稿、需求/服务、模式明细、宠物/位置快照、任务、物资、要求、可用性、宠物策略、价格、优惠和附件关联。
- 自动生成并补充领域 CHECK 的 PostgreSQL migration。
- migration 静态安全门禁加入 `npm run quality`。
- 对当前旧数据执行只读、脱敏 dry-run；没有 migration、backfill、删除或远端写入。

## 验收结果

| 验收项 | 结果 |
|---|---|
| TypeScript | 通过 |
| 单元测试 | 8 个文件、35 项通过 |
| 发布合同专项 | 6 项通过 |
| Prisma schema validate | 通过 |
| expand-only 静态扫描 | 通过；无 DROP、旧表 ALTER/UPDATE、Raw 地址字段 |
| 旧数据 dry-run | 通过；写入 0、Raw 地址读取 0、个人文本读取 0 |
| 隔离 PostgreSQL 空库应用 | 未执行：本机没有 PostgreSQL runtime，远端库禁止充当测试库 |

合同测试实际发现并修复了 Zod 默认剥离未知字段的问题。六个顶层模式分支现为 strict object，因此上门服务夹带寄养容量、位置夹带 `addressRaw`、草稿 payload 夹带未知 Raw 地址都会失败关闭。

## Dry-run 决策

- 11 条需求都可以识别模式、状态、日期、坐标和金额，但都缺少 V2 结构化任务。
- 12 条旧 NeedPet 均没有可靠 Pet 关联，只允许转为未关联快照。
- 3 条旧寄养服务缺少容量，回填后必须保持不可预约，直到提供者主动补充并发布。
- 4 条服务均需补充显式宠物策略和结构化可用性，不能继续从价格标签推断。
- 12 个无旧业务父级附件只登记审查，不自动删除或绑定。

## 准入与阻塞

任务 3.2 可以基于已冻结合同开发草稿框架。以下动作仍禁止：

- 对 `.env.local` 指向数据库应用 `20260804060000_publishing_v2_expand`。
- 将旧记录直接 backfill 到 V2。
- 开启 V2 正式发布 feature flag。

进入 staging 前必须提供隔离 PostgreSQL 数据库，依次完成全量 migration、空库创建、约束反例、回滚应用切换和 dry-run 对账；失败则保持旧读写和关闭 V2 flag。
