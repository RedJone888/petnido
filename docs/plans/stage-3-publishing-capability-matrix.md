# 阶段 3.1：新旧发布能力融合与目标字段矩阵

> 状态：目标合同冻结，可进入 expand schema 与发布命令实现  
> 日期：2026-08-04  
> 原则：不选择整套旧实现或整套新实现；按字段和能力执行 `KEEP / TRANSFORM / REPLACE / DEFER`。

## 1. 决策含义

| 决策 | 含义 |
|---|---|
| `KEEP` | 现有交互或后端能力语义正确，可整理后复用 |
| `TRANSFORM` | 保留用户价值，但改为目标领域类型、快照或规则表 |
| `REPLACE` | 现有事实来源或数据语义不安全/不完整，使用新合同替换 |
| `DEFER` | MVP 暂不自动计算，但必须保存为可讨论或说明字段，不能假装已实现 |

所有正式发布时间使用 UTC，同时保存 IANA `timeZone`；金额使用整数最小货币单位；位置只保存经纬度、可选非精确区域名和展示精度，不保存楼号、楼层、房号等精确地址。

## 2. 六种模式的共同字段

| 能力 | 新需求引导页 | 旧需求/服务实现 | 目标字段或行为 | 决策 |
|---|---|---|---|---|
| 版本化草稿 | `localStorage` v3，可恢复 | 无服务端草稿 | `PublishDraft(schemaVersion, revision, payload, currentStep, status)`；服务端为事实来源，本地仅缓存 | TRANSFORM |
| 创建与编辑 | 新需求只有新建/预览 | 旧表单支持创建和编辑 | 同一份模式 schema 与步骤组件；Publish Command 与 Draft Command 分离 | TRANSFORM |
| 标题和说明 | 预览可生成摘要 | 旧表单直接填写 | 正式记录保存标题、公开摘要；模式任务保存详细说明 | KEEP |
| 宠物 | 新页字段丰富但只在草稿 | 旧 `NeedPet` 有 count、字符串数组和图片 | 发布时保存受保护宠物快照；可关联 `Pet`，新宠物在发布事务成功后写入档案 | TRANSFORM |
| 地点 | 坐标和区域文本 | `addressRaw/areaRaw/baseAreaRaw` | `LocationSnapshot(lat, lon, regionLabel, displayPrecision)`；拒绝 Raw 地址字段 | REPLACE |
| 金额 | 精确/区间/开放报价，交通与物资费用 | Int/Float 混用，部分只有总价 | `Money(kind, minAmountMinor, maxAmountMinor, currency)` 与附加费用规则 | REPLACE |
| 附件 | 新需求宠物照片仍是前端值 | 旧流程已有上传、归属和排序 | 复用本人附件所有权校验，改为 V2 显式关联表；发布事务内激活 | TRANSFORM |
| 状态 | 新页显示前端“成功” | 旧记录能写库但状态过粗 | 草稿、发布、暂停/重开、匹配/关闭均由领域命令改变；UI 不提交任意状态 | REPLACE |
| 幂等 | 无 | 旧创建无幂等键 | Draft revision + Publish `idempotencyKey`；重复提交返回同一结果 | REPLACE |
| 默认档案 | 新页未接个人档案 | 旧页使用 Raw 默认值 | 在宠物/地点/货币相应步骤读取；仅发布事务成功后回写档案 | REPLACE |
| 发布后推荐 | 无 | 无 | 响应返回匹配/降级推荐摘要；具体算法阶段 6 实现 | DEFER |
| 邮件提示 | 无 | 无 | 响应返回 `notificationPrompt`；阶段 3 接成功页，邮件发送阶段 6 实现 | TRANSFORM |

## 3. 需求：上门照护（HOME_VISIT）

| 产品字段 | 现有来源 | 目标表示 | 公开性 | 决策 |
|---|---|---|---|---|
| 照顾哪些宠物 | 新页 `pets`；旧 `NeedPet/petIds` | `NeedPetSnapshot` + 可选 `sourcePetId` | 公开只显示类型/数量；姓名和照护备注受保护 | TRANSFORM |
| 日期范围 | 两套都有 | `startsAt/endsAt/timeZone` | 公开 | KEEP |
| 几天上一次门 | 新页 `visitFrequency/customInterval/firstVisitDate`；旧 enum + customDays | `HomeVisitNeedDetail.intervalDays/firstServiceDate` | 公开摘要 | TRANSFORM |
| 排除日期 | 新页 `excludedVisitDates` | `NeedDateException` | 公开可显示不可用日，不显示私人原因 | KEEP |
| 上门当天次数 | 新页 `visitsPerDay`；旧 `customTimes` | `visitsPerServiceDay` | 公开 | TRANSFORM |
| 每次希望时间 | 新页灵活/精确时间数组 | `NeedVisitWindow(visitNumber, kind, startLocalTime, endLocalTime)` | 公开 | TRANSFORM |
| 每次对每只宠物的任务 | 新页 `visitPlans` | `NeedTask` + `NeedTaskPet` + visitNumber | 任务类别公开；详细照护说明仅参与者 | KEEP |
| 地点 | 新页地图；旧 Raw+坐标 | 位置快照 | 公开仅近似区域/模糊坐标 | REPLACE |
| 预算 | 新页金额模型；旧单价/总价 | Money | 公开 | REPLACE |
| 交通费 | 新页 none/fixed/actual/discuss | `AdditionalCostRule(kind=TRAVEL)` | 公开规则，不公开票据 | KEEP |

## 4. 需求：寄养（BOARDING）

| 产品字段 | 现有来源 | 目标表示 | 公开性 | 决策 |
|---|---|---|---|---|
| 寄养宠物和时间 | 新页丰富；旧通用宠物/日期 | 宠物快照 + `startsAt/endsAt` | 类型/数量和时间公开 | TRANSFORM |
| 宠物主人自带物资 | 新页 supply plan | `NeedSupply(providedBy=OWNER)` | 公开类别；备注受保护 | KEEP |
| 寄养家庭准备物资 | 新页 supply plan | `NeedSupply(providedBy=PROVIDER)` + 费用规则 | 公开 | KEEP |
| 每只宠物每日任务 | 新页 boarding routines | `NeedTask(scheduleKind=DAILY)` + 宠物关联 | 类别公开；细节受保护 | KEEP |
| 定期/单次/按需任务 | 新页 repeating/once/as-needed | `NeedTask` 的 schedule 字段 | 同上 | KEEP |
| 家庭环境要求 | 新页 requirements | `NeedRequirement(kind=ENVIRONMENT_REQUIRED)` | 公开 | KEEP |
| 不能接受的情况 | 新页 compatibility/warnings | `NeedRequirement(kind=UNACCEPTABLE)` | 公开但不含健康详情 | TRANSFORM |
| 接送方式和方向 | 新页 transport/splitDirection；旧 `TransportMethod` | `BoardingNeedDetail.transportMode/handoffDirection` | 公开 | TRANSFORM |
| 出发地与接受距离 | 新页位置+distance；旧 fosterRange | 位置快照 + `maxProviderDistanceMeters` | 公开近似区域和距离 | TRANSFORM |
| 寄养预算 | 新页金额模型；旧总价 | Money | 公开 | REPLACE |
| 物资和接送费用 | 新页 supply/travel 金额与讨论模式 | 两类 `AdditionalCostRule` | 公开规则 | TRANSFORM |

## 5. 需求：自定义（CUSTOM）

| 产品字段 | 现有来源 | 目标表示 | 公开性 | 决策 |
|---|---|---|---|---|
| 哪些宠物 | 新页宠物草稿；旧 NeedPet | 宠物快照 | 类型/数量公开；姓名受保护 | TRANSFORM |
| 时间 | 新页日期；旧日期 | `startsAt/endsAt/timeZone`，任务可带具体时间 | 公开 | KEEP |
| 地点 | 新页地图；旧 Raw+坐标 | 位置快照 | 近似公开 | REPLACE |
| 任务 | 新页 custom plans/notes；旧 requirement | 至少一条 `NeedTask` | 类别公开；说明按敏感级别拆分 | TRANSFORM |
| 费用 | 新页金额模型；旧价格字段 | Money | 公开 | REPLACE |

## 6. 服务：上门照护（HOME_VISIT）

| 产品字段 | 现有来源 | 目标表示 | 决策 |
|---|---|---|---|
| 自己位置与服务范围 | 旧服务坐标+Raw 区域 | 位置快照 + `serviceRadiusMeters` | REPLACE |
| 平日/周末/节假日/日期范围/排除日 | 旧范围+周模式只覆盖部分 | `AvailabilityRule` + `AvailabilityException` | TRANSFORM |
| 宠物类型、体型、年龄段 | 旧版从价格标签推断宠物类型 | 显式 `ServicePetPolicy`，禁止字符串推断 | REPLACE |
| 经验、证明照片 | 服务档案+旧经验照片 | 档案介绍 + V2 附件关联 | TRANSFORM |
| 可提供的服务内容 | 旧 description | 多条 `ServiceOffering`（类别、说明、时长/次数约束） | TRANSFORM |
| 收费和优惠 | 旧 PriceRule 只有标签/整数 | `ServicePriceRule` + `ServiceDiscountRule` | REPLACE |

## 7. 服务：寄养（BOARDING）

| 产品字段 | 现有来源 | 目标表示 | 决策 |
|---|---|---|---|
| 可服务宠物、时间 | 旧通用字段 | PetPolicy + Availability | TRANSFORM |
| 寄养地点 | 旧 Raw+坐标 | 位置快照；公开近似 | REPLACE |
| 环境照片 | 旧 HOME 图片类别 | V2 附件关联 `kind=ENVIRONMENT` | KEEP |
| 环境其他宠物情况 | 无结构化字段 | `ServiceEnvironmentFact(kind=RESIDENT_PET)` | REPLACE |
| 可提供物资和条件 | 旧 description | `ServiceEnvironmentFact` + `ServiceOffering` | TRANSFORM |
| 收费与优惠 | 旧 PriceRule | PriceRule + DiscountRule | REPLACE |
| 一次最大宠物数 | 无 | `maxPetCapacity`，仅 BOARDING 必填且大于 0 | REPLACE |

## 8. 服务：自定义（CUSTOM）

| 产品字段 | 现有来源 | 目标表示 | 决策 |
|---|---|---|---|
| 时间与例外 | 旧通用可用时间 | AvailabilityRule + Exception | TRANSFORM |
| 地点与范围 | 旧 Raw+坐标 | 位置快照 + 可选范围 | REPLACE |
| 服务内容 | 旧 customType/description | 标题 + 至少一条 ServiceOffering | TRANSFORM |
| 宠物类型/体型/年龄 | 旧类型推断 | 显式 PetPolicy | REPLACE |
| 费用和优惠 | 旧 PriceRule | PriceRule + DiscountRule | REPLACE |
| 经验和照片 | 档案与旧附件 | 档案介绍 + V2 附件关联 | TRANSFORM |

## 9. 校验、快照与迁移归属

| 领域 | API 校验 | 数据库约束 | 快照策略 | 旧数据处理 |
|---|---|---|---|---|
| 模式 | discriminated union | enum + 一对一模式明细 | 发布时冻结 | VISIT→HOME_VISIT，FOSTER→BOARDING，OTHER→CUSTOM |
| 时间 | 开始早于结束，IANA 时区 | 索引 `state, endsAt` | 正式记录保存 UTC+时区 | 直接映射合法值 |
| 位置 | 只接受 Location DTO | Decimal 范围 check；无 Raw 列 | 每次发布复制 | 只复制合法坐标，区域名重新生成；Raw 丢弃 |
| 宠物 | 本人档案或 NEW；任务引用必须存在 | 外键/唯一键 | 发布时复制受保护信息 | 旧 NeedPet 只生成未关联快照，不猜 Pet |
| Money | 币种、最小单位、区间顺序 | 非负和 min≤max check | 发布/应聘/预约分别冻结 | Float 先 dry-run 舍入差异 |
| 上门频率 | interval≥1、次数≥1、visitNumber 有效 | mode detail check | 发布时冻结 | 旧 enum 显式 mapper |
| 寄养容量 | 仅服务 BOARDING 且 ≥1 | mode+capacity check | 预约保存 petCount | 旧服务容量为空，需用户编辑后才开放寄养预约 |
| 附件 | 本人、TEMP、类型/数量限制 | 关联唯一和归属检查 | 业务关联不复制文件 | 合法附件映射；孤儿保持旧表等待审计 |

## 10. 不在任务 3.1 内假装完成的内容

- 推荐结果目前只冻结响应合同，不实现匹配排序。
- 邮件提示只冻结 `notificationPrompt`，不发送业务邮件。
- 不把新版前端的 localStorage “成功”改名后继续使用；必须等待真实 Publish Command。
- 不执行 `.env.local` 指向数据库的 migration 或 backfill。
- 不删除旧 Need、Service、NeedPet、PriceRule 或 Raw 字段；切流前继续作为受控兼容来源。

## 11. 任务 3.1 验收清单

- [x] 六种模式逐项包含产品字段、现有来源、目标表示和取舍。
- [x] 宠物、位置、金额、任务、时间、可用性、附件均指定快照或规则归属。
- [x] 明确新 UI 与旧持久化能力的共同点和冲突，不做二选一。
- [x] 明确生产迁移、推荐、邮件和旧表删除不在本任务中隐式执行。
- [x] 版本化 Zod Draft/Publish 合同通过单元测试；顶层与位置对象严格拒绝未知/Raw 地址字段。
- [ ] expand-only Prisma schema 与 migration 已通过 Prisma 校验和静态安全检查；本机没有 PostgreSQL runtime，隔离空库实际应用仍需在 staging migration gate 完成。
- [x] 旧记录只读 dry-run 输出可对账统计且不读取/输出 Raw 地址、个人文本或消息。

## 12. 只读 dry-run 结果

2026-08-04 对当前配置数据源执行 `scripts/dry-run-publishing-v2.mjs`，结果：

- 写入尝试 0；读取 Raw 位置值 0；读取个人文本值 0。
- 需求 11 条：HOME_VISIT 8、BOARDING 2、CUSTOM 1；日期和坐标异常均为 0。
- 12 条旧 NeedPet 全部无法可靠关联 Pet，只能生成未关联快照；11 条需求均需要补齐结构化任务。
- 服务 4 条：BOARDING 3、CUSTOM 1；坐标异常为 0。
- 3 条旧寄养服务必须由提供者补填容量后才能在 V2 激活；4 条服务都需要显式宠物策略和结构化可用性。
- 附件 17 个，其中 TEMP 2 个、无旧业务父级 12 个；本任务只登记审查，不删除或猜测归属。
- 金额转换可计算性失败为 0，但币种最小单位的业务含义仍须在 backfill 前抽样确认，不能据此直接写入。
