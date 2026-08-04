# T02 重复类型、常量与领域逻辑审计

## 发现

| 类别 | 重复/漂移方式 | 后果 | 目标单一来源 |
|---|---|---|---|
| 服务类型 | Prisma `VISIT/FOSTER/OTHER`，产品文案为上门/寄养/自定义，多处组件各自映射 | 筛选和文案易错位 | `domain/service-mode` + i18n key |
| 需求状态 | Prisma 只有 OPEN/MATCHED/CLOSED/CANCELLED，产品还需要草稿、已过期及确认流 | UI 推导不一致 | 显式状态机；过期由 `endDate` 推导 |
| 应聘/预约状态 | enum 已存在但无 Router，页面另用本地布尔值 | 无服务端事实 | 领域状态机 + 数据库状态 |
| 地点 | `addressRaw/baseAreaRaw/areaRaw` 和多处 lat/lon 表单 | 可能保存精确地址 | 统一 MapLocation 契约 |
| 金额 | `Int`/`Float` 混用，表单字符串各自转换 | 精度、币种和单位漂移 | Money `{amountMinor,currency,unit}` |
| 宠物 | Pet、NeedPet、表单临时类型和 `petIds: String[]` 并存 | 档案与发布快照不同步 | PetProfile + NeedPetSnapshot |
| 时间/可用性 | 服务只有范围+周模式；引导页有更丰富临时结构 | 无法表达例外日期 | AvailabilityRule/Exception |
| 地址标签 | geocode 返回 `display_name`，数据库 Raw 字段可直接接受 | 与隐私决定冲突 | 只允许坐标+非精确 regionLabel |

## 整理原则

1. Prisma enum 只承担持久化；业务迁移期通过显式 mapper 转换，禁止隐式字符串强转。
2. Zod schema 是 API 边界的唯一输入契约，React 表单类型从 schema 推导。
3. 展示文案只使用 i18n key，不把中文/日文作为枚举值。
4. 过期不是人工按钮状态：`endDate <= now` 即过期，公开查询必须排除。
5. 健康信息只进入受保护详情，不进入公开摘要、邮件正文或日志。

## 自验收

- [x] 覆盖状态、模式、位置、金额、宠物和时间六类高风险重复。
- [x] 每项指定目标单一来源和迁移方式。

**T02 重复逻辑验收结论：通过。**
