# Aletheia（去蔽）

针对 **Web 服务源代码** 的静态漏洞分析 CLI。它在本地读取目标仓库，用一组可扩展的检测规则找出常见安全问题，并输出人类可读报告或 CI 可用的 JSON / SARIF。

本工具做的是 **静态代码分析（SAST）**，不是网络扫描器，也不会对运行中的系统发送攻击请求。分析对象应是你有权审计的代码。

## 命名

**Aletheia** 来自希腊文 **ἀλήθεια**，读作 /əˈliːθiə/（阿-勒-忒-娅）。

它由否定前缀 *a-*（不）与 *lethe*（遗忘、遮蔽）组成。冥河勒忒（Lethe）让灵魂喝水而忘却；Aletheia 的字面意思是 **把被遗忘、被盖住的东西重新取出来**。海德格尔后来用这个词讲「真理」：不是把判断对齐事实，而是让事物从遮蔽中自行显现。

这正是本工具要做的事。漏洞往往不是另附在代码上的外来物，而是被字符串拼接、默认配置和「先这样写」遮住的结构。Aletheia 不攻击运行中的服务，也不发明利用；它只是把源码里已经存在、却尚未被看见的裂隙照出来，好让人修补。

命令行因此叫 `aletheia`：去蔽，而非征伐。

## 功能概览

- 扫描 JavaScript / TypeScript / Python / PHP / Java / Go 以及常见配置文件
- 覆盖 OWASP Top 10 相关模式：注入、路径穿越、SSRF、密钥硬编码、弱加密、CORS 过宽等
- CLI 命令：`scan`、`rules`、`init`
- 报告格式：`table`、`json`、`markdown`、`sarif`
- 可用 `aletheia.config.json` 和 CLI 参数过滤语言、规则、严重级别
- `--fail-on` 便于接入 CI：达到阈值时以退出码 `2` 失败

## 要求

- Node.js 20.19 或更高（开发环境已验证 Node.js 24）
- 对目标代码目录的读权限

## 安装

```bash
cd aletheia
npm install
chmod +x bin/aletheia.js
```

全局可用（可选）：

```bash
npm link
```

之后直接执行 `aletheia`。不 link 时用：

```bash
node bin/aletheia.js --help
```

## 快速开始

扫描当前目录：

```bash
node bin/aletheia.js scan .
```

扫描其它 Web 服务仓库，并写出 Markdown 报告：

```bash
node bin/aletheia.js scan /path/to/web-service \
  --format markdown \
  --output reports/aletheia.md
```

只看高危及以上，并在存在 high/critical 时让 CI 失败：

```bash
node bin/aletheia.js scan ./service --min-severity high --fail-on high
```

列出内置规则：

```bash
node bin/aletheia.js rules
node bin/aletheia.js rules --id sql-injection --json
```

生成配置文件：

```bash
node bin/aletheia.js init
```

用自带夹具验证工具是否工作：

```bash
node bin/aletheia.js scan ./fixtures/sample-web-service
```

`fixtures/sample-web-service` 里是 **故意不安全的示例代码**，只用于测试检测器，不要部署。

## 文档索引

| 文档 | 内容 |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | 模块划分、扫描流水线、数据流 |
| [docs/developer-handbook.md](docs/developer-handbook.md) | 本地开发、编码约定、如何加规则与测试 |
| [docs/usage.md](docs/usage.md) | 命令、配置项、退出码、CI 示例 |
| [docs/rules.md](docs/rules.md) | 内置规则、CWE / OWASP 对照、误报处理 |
| [docs/contributing.md](docs/contributing.md) | 贡献流程 |
| [docs/security-policy.md](docs/security-policy.md) | 使用边界与漏洞披露 |
| [docs/faq.md](docs/faq.md) | 常见问题 |
| [CHANGELOG.md](CHANGELOG.md) | 版本记录 |

## 架构速览

扫描是一条纯函数风格的流水线：

```
CLI 参数 / aletheia.config.json
        │
        ▼
   loadConfig()          合并默认值、文件配置、命令行覆盖
        │
        ▼
  collectFiles()         递归收集文件，按语言与 glob 过滤
        │
        ▼
   read sources          在 I/O 边界读取文本
        │
        ▼
   applyRules()          规则表驱动的模式匹配（无副作用）
        │
        ▼
  sort + summarize       按严重级别排序并汇总
        │
        ▼
  renderReport()         table | json | markdown | sarif
```

核心目录：

```
src/
  cli/         命令行入口与子命令
  core/        配置、常量、扫描流水线
  ingest/      文件收集与语言识别
  engine/      规则应用与评分
  rules/       数据驱动的规则目录
  report/      报告渲染
  utils/       纯工具函数
```

更完整的说明见 [开发架构](docs/architecture.md) 与 [开发人员手册](docs/developer-handbook.md)。

## 设计原则

- **去蔽**：只报告可疑代码位置与修复方向，不生成利用步骤或攻击载荷
- **函数式**：核心逻辑是纯函数；I/O 留在 CLI、文件读取和写报告的边缘
- **数据驱动**：新增检测优先加规则表，而不是加一长串 `if/else`
- **可组合**：`scanProject` 也可作为库调用，不一定走 CLI

## 退出码

| 码 | 含义 |
| --- | --- |
| `0` | 扫描完成，且没有达到 `--fail-on` 阈值的发现 |
| `2` | 扫描完成，但存在达到失败阈值的发现 |
| `1` | 运行错误（路径无效、配置不是 JSON 等） |

## 开发

```bash
npm test
npm run test:watch
```

开发约定、目录职责、如何新增规则，见 [开发人员手册](docs/developer-handbook.md)。

## 许可

MIT。见 [LICENSE](LICENSE)。
