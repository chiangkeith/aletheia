# 使用说明

## 命令

```
aletheia <command>
```

| 命令 | 作用 |
| --- | --- |
| `scan [target]` | 扫描一个目录或单个文件，默认 `.` |
| `rules` | 列出内置规则 |
| `init` | 在当前目录生成 `aletheia.config.json` |

全局选项：

```
aletheia --help
aletheia --version
```

## scan

```
aletheia scan [target] [options]
```

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `-c, --config <path>` | 自动发现 | 配置文件路径 |
| `-f, --format <format>` | `table` | `table` `json` `markdown` `sarif` |
| `-o, --output <path>` | stdout | 把报告写入文件 |
| `--min-severity <level>` | `info` | 低于该级别的发现不输出 |
| `--fail-on <level>` | `high` | 存在该级别及以上发现时退出码为 2 |
| `--languages <list>` | 全部支持语言 | 逗号分隔 |
| `--include <globs>` | `**/*` | 逗号分隔的包含 glob |
| `--exclude <globs>` | 默认忽略列表 | **额外**忽略，会与默认列表合并 |
| `--only <ids>` | 全部规则 | 只启用这些规则 |
| `--disable <ids>` | 无 | 禁用这些规则 |

严重级别从高到低：`critical` > `high` > `medium` > `low` > `info`。

### 示例

扫描相邻的 Web 服务仓库：

```bash
node bin/aletheia.js scan ../AK01-Service --format table
```

只要 Python 与通用配置文件：

```bash
node bin/aletheia.js scan ./service --languages python,generic
```

关闭 CORS 规则，只关注注入类：

```bash
node bin/aletheia.js scan ./service \
  --only sql-injection,command-injection,code-injection \
  --format markdown \
  --output reports/injection.md
```

生成 SARIF 供代码扫描平台消费：

```bash
mkdir -p reports
node bin/aletheia.js scan . --format sarif --output reports/aletheia.sarif
```

## rules

```
aletheia rules [--id <ruleId>] [--json]
```

```bash
node bin/aletheia.js rules
node bin/aletheia.js rules --id hardcoded-secret --json
```

## init

```
aletheia init [--force]
```

若当前目录已有 `aletheia.config.json`，必须加 `--force` 才会覆盖。

## 配置文件

工具按以下名字查找（当前工作目录）：

1. `aletheia.config.json`
2. `.aletheia.json`

也可用 `--config` 显式指定。完整示例见 `examples/aletheia.config.json`。

字段：

```json
{
  "include": ["**/*"],
  "exclude": ["**/vendor/**"],
  "languages": ["javascript", "typescript", "python"],
  "minSeverity": "low",
  "failOn": "high",
  "format": "table",
  "rules": {
    "enable": [],
    "disable": ["xxe"]
  }
}
```

- `include` / `exclude` 使用 glob，`**` 可匹配跨目录路径。
- `rules.enable` 为空表示启用全部；非空表示白名单。
- `rules.disable` 在白名单之后再剔除。
- CLI 与文件同时存在时，**CLI 覆盖文件**；`exclude` 则是合并。

默认始终忽略：`node_modules`、`.git`、`dist`、`build`、`coverage`、`vendor`、虚拟环境、锁文件、压缩后的 `*.min.js` 等。完整列表见 `src/core/constants.js` 的 `DEFAULT_IGNORE`。

本仓库根目录的 `aletheia.config.json` 还会排除 `test/` 与 `fixtures/`。这两处是检测器自己的样本，不是待审计的 Web 服务。对 **其它项目** 做扫描时，请把 `scan` 的目标指向那个项目；需要的话再用 `--config` 指向该项目自己的配置。

## 退出码

| 码 | 何时 |
| --- | --- |
| 0 | 成功，且没有达到 `--fail-on` 的发现 |
| 2 | 成功完成扫描，但有达到阈值的发现 |
| 1 | 异常（配置损坏、未知规则、I/O 失败） |

脚本里不要把 `2` 当成崩溃；它表示“有需要处理的安全发现”。

## CI 示例

### GitHub Actions

```yaml
name: aletheia
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
      - name: Install scanner
        run: |
          cd aletheia
          npm install
      - name: Scan this repository
        run: node aletheia/bin/aletheia.js scan . --format sarif --output aletheia.sarif --fail-on high
      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: aletheia.sarif
```

把 `scan` 的目标换成待审计的服务路径即可。扫描器与目标仓库可以是同一份 checkout，也可以是单独检出的依赖工程。

### 本地 pre-commit

```bash
node bin/aletheia.js scan . --min-severity medium --fail-on critical
```

## 解读报告

每条发现包含：

- **ruleId**：规则标识，可用 `aletheia rules --id` 查看详情
- **severity / cwe / owasp**：分级与对照
- **file:line**：源码位置（相对扫描根目录）
- **snippet**：命中附近的文本
- **remediation**：修复方向

发现是启发式结果。修复前请打开对应源码，确认数据是否真的来自不可信输入。误报处理见 [rules.md](rules.md)。

## 权限与范围

- 只扫描你有权阅读的源代码。
- 不要把本工具当作对第三方在线站点的入侵测试平台。
- 生产密钥不应出现在被扫描仓库中；若规则报 `hardcoded-secret`，应轮换密钥并把秘密移出仓库。
