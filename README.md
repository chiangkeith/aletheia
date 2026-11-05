# Aletheia（去蔽）

针对 **Web 服务源代码** 的静态漏洞分析 CLI。它在本地读取目标仓库，用一组可扩展的检测规则找出常见安全问题，并输出人类可读报告或 CI 可用的 JSON / SARIF。

本工具做的是 **静态代码分析（SAST）**，不是网络扫描器，也不会对运行中的系统发送攻击请求。分析对象应是你有权审计的代码。

## 功能概览

- 扫描 JavaScript / TypeScript / Python / PHP / Java / Go 以及常见配置文件
- 覆盖 OWASP Top 10 相关模式：注入、路径穿越、SSRF、密钥硬编码、弱加密、CORS 过宽等
- CLI 命令：`scan`、`rules`、`init`
- 报告格式：`table`、`json`、`markdown`、`sarif`
- 可用 `aletheia.config.json` 和 CLI 参数过滤语言、规则、严重级别
- `--fail-on` 便于接入 CI：达到阈值时以退出码 `2` 失败
- 扫描过程默认写到 stderr（收集文件、读取、匹配、耗时），可用 `--quiet` 关闭
- 默认跳过 `.output` / `.next` 等打包目录，只分析源码

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

扫描过程写在 stderr（收集文件、规则匹配、耗时）。stdout 仍只有报告，因此 JSON / SARIF 可以安全管道给下游。不需要进度时加 `--quiet`。

扫描其它 Web 服务仓库，并写出 Markdown 报告：

```bash
node bin/aletheia.js scan /path/to/web-service \
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

## 规则与参考基础

规则找的是仍常见的源码缺陷，不是某个 CVE 库，也不会对运行中的服务发请求。每条规则对照 **CWE** 缺陷类型和 **OWASP Top 10:2021** 分类；修复方向与 [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) 一类的验证要求一致（参数化查询、密钥不进仓库、校验证书等）。

检测方法是 **启发式正则 SAST**：匹配危险 sink（拼接 SQL、`exec`、`eval`、`pickle.loads` 等）以及不可信输入痕迹（`req.query`、字符串 `+`、`${}`）。适合本地和 CI 的第一道门。没有 AST 与污点跟踪，中间变量、跨文件封装可能漏报；命中后应打开源码确认数据是否真的来自用户。完整误报/漏报说明见 [docs/rules.md](docs/rules.md)。

实务对照：

| 来源 | 本工具怎么用 |
| --- | --- |
| [CWE](https://cwe.mitre.org/) | 每条规则的缺陷编号（如 CWE-89 SQL 注入） |
| [OWASP Top 10:2021](https://owasp.org/Top10/) | 注入、失效访问控制、加密失败等分类 |
| [CWE Top 25](https://cwe.mitre.org/top25/) | 近年仍高频的注入、路径穿越、反序列化、硬编码凭证 |
| [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) | 报告里的修复方向（参数化查询、密钥外置、TLS 校验） |

规则与编号对照（完整列表以 `aletheia rules` 为准）：

| 规则 | 级别 | CWE | OWASP Top 10:2021 |
| --- | --- | --- | --- |
| `sql-injection` | critical | CWE-89 | A03 Injection |
| `command-injection` | critical | CWE-78 | A03 Injection |
| `code-injection` | critical | CWE-94 | A03 Injection |
| `insecure-deserialization` | critical | CWE-502 | A08 Software and Data Integrity Failures |
| `path-traversal` | high | CWE-22 | A01 Broken Access Control |
| `ssrf` | high | CWE-918 | A10 SSRF |
| `xss-sink` | high | CWE-79 | A03 Injection |
| `hardcoded-secret` | high | CWE-798 | A07 Identification and Authentication Failures |
| `insecure-tls` | high | CWE-295 | A02 Cryptographic Failures |
| `jwt-none-alg` | high | CWE-347 | A07 Identification and Authentication Failures |
| `prototype-pollution` | high | CWE-1321 | A03 Injection |
| `xxe` | high | CWE-611 | A05 Security Misconfiguration |
| `open-redirect` | medium | CWE-601 | A01 Broken Access Control |
| `weak-crypto` | medium | CWE-327 | A02 Cryptographic Failures |
| `debug-enabled` | medium | CWE-489 | A05 Security Misconfiguration |
| `cors-misconfiguration` | medium | CWE-942 | A05 Security Misconfiguration |
| `cookie-security` | medium | CWE-614 | A05 Security Misconfiguration |
| `mass-assignment` | medium | CWE-915 | A04 Insecure Design |
| `missing-authz-todo` | low | CWE-285 | A01 Broken Access Control |

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
