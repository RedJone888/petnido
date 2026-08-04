# T03 脱敏数据画像

生成时间：2026-08-04（数据库只读查询）
脚本：`scripts/audit-data-profile.mjs`

## 数量

| User | Profile | Pet | Need | NeedPet | ServiceProfile | Service | Application | Booking | Message | Attachment |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 6 | 6 | 0 | 11 | 12 | 4 | 4 | 0 | 0 | 0 | 17 |

## 状态分布

- Need：OPEN 8、MATCHED 1、CLOSED 2、CANCELLED 0。
- Service：FOSTER 3、OTHER 1、VISIT 0。
- Application、Booking：均无数据，无法用现存数据验证状态迁移。

## 空值、重复与日期

- User：邮箱/姓名空值 0，头像空值 2；Profile.bio 空值 6/6。
- NeedPet.description 空值 11/12；Service.description 空值 2/4；ServiceProfile.introduction 空值 2/4。
- Need 的 priceAmount、frequencyType、fosterRange、transportMethod 均 0 空值，说明模式专属字段可能被一并填充，迁移时不能只凭“非空”判断模式语义。
- Need 标题和 User 邮箱重复组均为 0。
- Need 开始日期范围：2026-01-16 至 2026-06-18；结束日期范围：2026-01-30 至 2026-08-26。
- Service 创建日期范围：2026-01-23 至 2026-03-06。

## 旧地点字段

| 表 | 非空 Raw 文本 | 简单规则疑似含楼层/房号 |
|---|---:|---:|
| Need | 11 | 0 |
| Service | 4 | 0 |
| ServiceProfile | 3 | 0 |

“疑似”只是关键词扫描，不能证明文本不精确；迁移时仍应丢弃 Raw 文本，只保留坐标并重新生成非精确区域标签。脚本从不输出邮箱、昵称、位置文本、消息或宠物内容。

## 迁移影响

- Pet 为 0 但 NeedPet 为 12，证明当前需求宠物没有形成可复用档案；迁移不能假定 `petIds` 有效。
- Application/Booking/Message 都为 0，可在不迁移业务历史的情况下先建立新模型，但仍需保留回滚和兼容读。
- 11 条需求与 4 条服务数量较小，适合写可重复 dry-run 迁移并逐条核对数量，不允许手工改线上数据。
- NeedPet 的 `petIds` 引用总数为 0，不能由其自动重建 Pet 档案。
- 17 个 Attachment 中 12 个无业务父级、2 个 TEMP、10 个 DELETED；需要先辨别上传暂存策略，再清理孤儿，不能按“无父级”直接删除。
- 没有 Application/Booking，Float 金额无样本可验证；迁移前仍须保留舍入差异检测。
- Need/Service 坐标均在合法范围内。
- 文本聚合中有 11 条 demo/test 类信号，但邮箱不是 `example.invalid`；数据所有权无法仅凭内容证明，按“混合/未知”处理，等待所有者确认。

## 自验收

- [x] 查询仅包含 count、groupBy 和内存关键词计数。
- [x] 输出不包含用户可识别内容或位置原文。
- [x] 数量关系已转化为具体迁移风险。
- [x] 空值、重复、日期、附件归属、宠物引用、金额和坐标均已聚合检查。

**T03 数据画像验收结论：通过。**
