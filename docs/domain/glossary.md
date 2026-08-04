# T05 领域词汇表

| 统一词汇 | 含义 | 旧词映射 |
|---|---|---|
| HOME_VISIT | 服务者到宠物所在地图位置照护 | VISIT、上门 |
| BOARDING | 宠物入住服务者寄养环境 | FOSTER、寄养 |
| CUSTOM | 不适合前两类的自定义任务 | OTHER、自定义 |
| Need | 宠物主人发布的照护需求 | 需求帖 |
| Service | 服务者公开提供的可预约服务 | 服务帖 |
| ProviderProfile | 用户选择接单后创建的服务档案 | ServiceProfile、服务账号 |
| Application | 服务者对 Need 发起的应聘 attempt | 应聘 |
| BookingRequest | 用户对 Service 发起、尚待确认的预约请求 | 预约 |
| Booking | 对方确认后的预约事实及快照 | 成功预约 |
| Conversation | 同一双方与业务上下文复用的会话 | 聊天 |
| MapLocation | 经纬度和可选非精确区域标签 | 地址/位置 |
| Snapshot | 业务动作发生时不可被源资料后续编辑改变的副本 | 快照 |
| Expired Need | `endDate <= now` 的需求 | 过期需求 |
| Money | 金额类型、整数最小货币单位、币种与计价单位 | 预算/价格 |

约定：数据库旧 enum 只通过 mapper 使用；页面、合同和新领域代码统一采用英文稳定标识，显示文字由三语 i18n key 提供。

## 自验收

- [x] 三类模式、五个核心聚合、位置、金额和快照均有唯一术语。
- [x] 旧 enum 到新术语映射明确。

**T05 词汇表验收结论：通过。**
