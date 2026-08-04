# T00 环境与仓库基线

> 验收日期：2026-08-04
>
> 分支：`codex/petnido-v2-development`
>
> 起始基线：`f172180`

## 1. 运行环境

| 项目 | 实测值 | 结论 |
|---|---|---|
| 操作系统 | macOS arm64 | 支持当前 Prisma binary target |
| Node.js | `v20.19.1` | 可构建当前 Next.js 14 项目 |
| npm | `11.4.1` | 隔离 `npm ci` 成功 |
| Next.js | `14.2.5` | 生产构建成功 |
| Prisma CLI/Client | `5.14.0` | generate 成功 |
| PostgreSQL CLI | 未安装 `psql` | 不阻塞 Prisma 构建；数据库审计需用 Prisma/Node 或补装客户端 |
| 项目 npm registry | 无项目级配置；继承用户级 `https://registry.npmmirror.com` | 沙箱内 DNS 失败，授权联网后安装成功 |

## 2. 可复现安装结果

执行方式：在独立临时目录中只复制 `package.json` 和 `package-lock.json`，运行：

```bash
npm ci --ignore-scripts --prefix /tmp/petnido-clean-install.<random>
```

结果：成功安装 774 个 package。

已确认警告：

- `@auth/core` 的可选 peer dependency 期望 Nodemailer 6，而项目直接依赖 Nodemailer 7。
- 警告不会阻止安装和当前构建，但认证邮件链路需要在 T02/T09 验证实际兼容性。

## 3. 生产构建结果

执行：

```bash
npm run build
```

结果：

- Prisma Client 生成成功。
- Next.js 编译成功。
- TypeScript 检查成功。
- 32 个静态页面生成成功。
- 动态路由和 API route 完成构建。

构建警告：Browserslist/caniuse-lite 数据已过期约 9 个月。该警告不阻塞 T00，但应在依赖维护任务处理。

## 4. 当前依赖状态

`npm ls --depth=0` 报告 5 个当前 `node_modules` 中的 extraneous WASM 包：

- `@emnapi/core`
- `@emnapi/runtime`
- `@emnapi/wasi-threads`
- `@napi-rs/wasm-runtime`
- `@tybys/wasm-util`

隔离 `npm ci` 不依赖工作区现有 `node_modules`，因此 lockfile 可以完成干净安装。工作区 extraneous 包在后续安全清理依赖时处理，不在 T00 删除用户本地依赖。

## 5. 环境变量

原仓库只有被忽略的 `.env.local`，没有可提交模板。本任务新增 `.env.example`，覆盖代码当前读取的：

- 应用 URL 与 NextAuth secret；
- PostgreSQL；
- Google、LINE 和尚未启用的 Apple OAuth；
- Cloudinary；
- SMTP；
- MapTiler 与地理编码；
- 当前本期不接入的 Redis/Stripe 预留项。

`.env.local` 的值未打印、未复制、未提交。

## 6. 根项目与原型边界

| 目录 | 定位 | 构建入口 | 约束 |
|---|---|---|---|
| 仓库根目录 | Petnido 正式应用 | 根 `package.json` / Next.js | 后续生产开发只在此项目进行 |
| `home-visits-prototype/` | 独立 Vite/Sites 视觉原型 | 该目录自己的 `package.json` | 不得被根应用 import；只作为设计参考 |
| `home-visits-prototype/dist/` | 原型生成产物 | `npm run build` 生成 | 已忽略，不提交 |
| `.audit/`、`.codex-audit/`、`.codex-qa/` | 本地审计与 QA 证据 | 无生产入口 | 已忽略，不提交 |

根项目与原型拥有不同 React/Vite 版本和独立 lockfile。禁止从根项目直接导入原型源码；若需要采用设计，必须在根项目重新实现或提取经评审的静态资产。

## 7. 已知基线问题

| ID | 问题 | 阻塞级别 | 后续任务 |
|---|---|---|---|
| BASE-01 | 本机没有 `psql` CLI | 非阻塞 | T03 使用 Prisma/Node 审计，必要时再安装客户端 |
| BASE-02 | Nodemailer 7 与部分 Auth peer 声明不一致 | 非阻塞，需验证 | T02、T09 |
| BASE-03 | Browserslist 数据过期 | 非阻塞 | T09/依赖维护 |
| BASE-04 | 工作区 node_modules 有 5 个 extraneous 包 | 非阻塞 | T09/依赖维护 |
| BASE-05 | 根 package scripts 缺 lint/typecheck/test/e2e/prisma validate | 阻塞质量门禁 | T09 |
| BASE-06 | 没有根项目 CI 配置 | 阻塞质量门禁 | T09 |
| BASE-07 | `.env.example` 原先缺失 | 已解决 | T00 |

## 8. T00 自验收

| 验收项 | 结果 | 证据 |
|---|---|---|
| 新成员可确认运行版本 | 通过 | 本文第 1 节 |
| 隔离环境可按 lockfile 安装 | 通过 | 774 packages 安装成功 |
| 当前生产构建有记录 | 通过 | Prisma、类型和 32 个页面构建成功 |
| 环境变量有安全模板 | 通过 | `.env.example`，不含真实值 |
| 根项目与原型边界明确 | 通过 | 本文第 6 节 |
| 本地 QA/渲染/字体缓存不进入 Git | 通过 | `.gitignore` 规则与上一检查点验证 |
| 已知阻塞不被静默忽略 | 通过 | BASE-01—07 |

**T00 结论：通过。**
