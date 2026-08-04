# 后续 1–3 日开发任务板

## I1：安全与事实来源（先执行）

| ID | 任务 | 依赖 | 验收 |
|---|---|---|---|
| I1-01 | 修复 Need update/status/delete 所有权条件 | 无 | 非 owner 返回 NOT_FOUND；并发状态命令测试通过 |
| I1-02 | 修复 Service update/toggle/archive/get 权限和公开 DTO 分离 | 无 | 私有 mutation 带 provider 条件；游客只能 Public DTO |
| I1-03 | 移除 UI 任意 status mutation，接领域命令 mapper | I1-01/02 | 搜索不到通用前端 status setter |
| I1-04 | 认证/验证码限流和统一错误 envelope | 无 | 频率、过期、错误码测试通过；日志无验证码/邮箱正文 |

## I2：认证与档案

| ID | 任务 | 依赖 | 验收 |
|---|---|---|---|
| I2-01 | Profile/Pet/UserLocation expand schema 与 migration review | I1 | 只有坐标/非精确标签；migration 未写线上 |
| I2-02 | Profile/Pet/Location tRPC + ownership tests | I2-01 | CRUD/归档/默认值与 Public DTO 测试通过 |
| I2-03 | 首次注册头像昵称页 | I2-02 | 首次/非首次分流 E2E |
| I2-04 | 意图选择与 ProviderProfile 开通确认 | I2-03 | 发布需求/服务分支正确；取消可回 dashboard |
| I2-05 | pendingAction 服务端签名/过期/幂等恢复 | I1-04 | 收藏/应聘/预约动作登录后一次确认，不重复执行 |
| I2-06 | 未登录 Dashboard 入口修复 | I2-03 | 不再出现无操作“请先登录”死胡同 |

## I3：上门需求正式切片

| ID | 任务 | 依赖 | 验收 |
|---|---|---|---|
| I3-01 | 拆分 guided flow 壳和步骤组件 | I2 | 单文件不再承担全部领域/视图；草稿 v4 migration 测试 |
| I3-02 | 修复桌面横向裁切和 390px 移动布局 | I3-01 | 截图对比 + 键盘/200% zoom 冒烟 |
| I3-03 | Need V2 expand schema、发布事务和快照 | I2-02 | 失败原子回滚；不写旧 Raw 地点 |
| I3-04 | 宠物/位置步骤读取档案与成功后 upsert | I3-03 | 有/无档案分支集成测试 |
| I3-05 | 公开列表/详情游客 API、cursor/filter/过期 | I3-03 | endDate 边界、Public DTO、最大 page size 测试 |
| I3-06 | 发布成功推荐与邮件通知提示 | I3-03 | 精确/降级/附近三分支；未开邮箱提示一次 |
| I3-07 | 切换 `/dashboard/needs/new` 到新入口 | I3-01–06 | flag 回滚可用；旧入口不再正式曝光 |

## 任务板自验收

- [x] 每项为 1–3 日大小，有明确依赖和自动/视觉验收。
- [x] 安全修复先于新功能，数据库 expand 先于切流。
- [x] 当前所有 P0 均能映射到 I1–I3 或后续明确迭代。

**后续任务板验收结论：可进入 I1。**
