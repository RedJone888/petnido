# T03 旧模型到目标模型映射

| 旧字段/模型 | 目标 | 迁移规则 | 回退 |
|---|---|---|---|
| `Profile.isSitter` | `ProviderProfile.status` | true→ACTIVE，false 且有档案→PAUSED，无档案→NONE | 双写期继续更新旧布尔值 |
| `ServiceCategory.VISIT/FOSTER/OTHER` | `HOME_VISIT/BOARDING/CUSTOM` | 显式 mapper | 兼容读取旧 enum |
| `Need.status` | 新 Need 状态机 | OPEN/MATCHED/CLOSED/CANCELLED 对应迁移；过期由 endDate 推导 | 保留旧列至切流完成 |
| `Need.addressLat/Lon` | `MapLocation.lat/lon` | 原样复制并校验范围 | 旧字段兼容读 |
| `Need.addressRaw` | `MapLocation.regionLabel?` | 不复制原文；按坐标反向生成非精确区域 | 禁止回写 Raw |
| `Service.area*` | `Service.location` | 坐标复制，Raw 丢弃 | 同上 |
| `ServiceProfile.baseArea*` | `ProviderProfile.defaultLocation` | 坐标复制，Raw 丢弃 | 同上 |
| `NeedPet` | `NeedPetSnapshot` + 可选 Pet 关联 | 保存发布时快照；仅可靠 petId 才关联 | 原 JSON/数组只读保留 |
| `PriceRule.price`、`Need.totalPrice` | `Money.amountMinor` | 按币种规则转换；现有整数先视作主要货币单位，迁移前抽样确认 | 保存 legacyAmount |
| Float price | `Money.amountMinor` | 明确舍入策略后转换，禁止直接 cast | 生成差异报告 |
| `Application` | Application + Conversation | 增加唯一键、状态时间和会话关联 | 旧表只读 |
| `Booking.needId?` | BookingSource | 明确 NEED_APPLICATION 或 SERVICE_REQUEST；新增 `serviceId`/`petCount` | 兼容 nullable 来源 |
| 点对点 `Message` | Conversation/Participant/Message | 按用户对及业务上下文分会话；当前无历史数据 | 无需历史回填 |

## 执行阶段

1. Expand：新增目标表/列和 mapper，不删除旧字段。
2. Backfill dry-run：只生成计数、失败原因、舍入差异，不写入。
3. Backfill：事务分批写入，检查源/目标数量与约束。
4. Dual read/write：feature flag 控制新旧读写，对比结果。
5. Cutover：新模型成为事实来源；监控错误和差异。
6. Contract：至少一个稳定版本后再删除旧字段。

## 自验收

- [x] 每个核心旧模型均有目标、迁移与回退策略。
- [x] 明确 Raw 地址不迁移、金额不直接强转、宠物关系不做无依据猜测。
- [x] 采用 expand/backfill/cutover/contract 的可回滚顺序。

**T03 映射验收结论：通过。**
