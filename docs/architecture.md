# 开发架构

本文说明 webvuln-analyzer 如何组织代码、数据如何流动，以及为什么采用这种拆分。

## 目标

工具的职责是：**读取 Web 服务源代码 → 应用检测规则 → 产出结构化发现**。它不编译目标项目，不启动目标服务，也不向远程主机发请求。

## 分层

```
┌─────────────────────────────────────────────┐
│ CLI（src/cli）                              │
│  解析参数、退出码、把结果写到 stdout / 文件  │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│ Application（src/core）                     │
│  配置合并、扫描流水线编排                    │
└───────┬──────────────────────────┬──────────┘
        │                          │
┌───────▼──────────┐    ┌──────────▼──────────┐
│ Ingest           │    │ Engine + Rules      │
│ 文件、语言、读取  │    │ 匹配、去重、评分     │
└──────────────────┘    └──────────┬──────────┘
                                   │
                        ┌──────────▼──────────┐
                        │ Report              │
                        │ table/json/md/sarif │
                        └─────────────────────┘
```

| 层 | 目录 | 职责 | 副作用 |
| --- | --- | --- | --- |
| CLI | `src/cli` | 命令定义、用户交互 | 读 argv、写 stdout/文件、设退出码 |
| Core | `src/core` | 配置与流水线 | 通过 ingest 读文件 |
| Ingest | `src/ingest` | 发现源文件并标注语言 | 读文件系统 |
| Engine | `src/engine` | 把规则应用到源码 | 无 |
| Rules | `src/rules` | 规则数据 | 无 |
| Report | `src/report` | 把结果变成某种格式的字符串 | 无（写文件在 `writeReport`） |
| Utils | `src/utils` | 路径 glob、文本片段 | 读文件的封装在 `utils/fs.js` |

库入口 `src/index.js` 只导出扫描与报告 API，方便其它 Node 程序嵌入，而不必解析 CLI。

## 扫描流水线

`scanProject({ target, config })` 是编排函数，步骤固定：

1. **collectFiles**  
   从 `target` 递归列出文件，按扩展名识别语言，再用 include / exclude glob 过滤。默认忽略 `node_modules`、`.git`、`dist`、虚拟环境等。
2. **loadSources**  
   为每个文件读取 UTF-8 文本。这是明确的 I/O 边界；之后的匹配不再访问磁盘。
3. **getRules**  
   按语言、enable 白名单、disable 黑名单过滤规则表。
4. **applyRules**  
   对每个文件、每条适用规则执行正则匹配，生成 finding 对象，并按 `file:line:ruleId:snippet` 去重。
5. **meetsSeverity + sortFindings**  
   丢掉低于 `minSeverity` 的项，再按严重级别与路径排序。
6. **summarizeFindings**  
   统计各严重级别数量。

返回值形状：

```ts
{
  target: string
  scannedAt: string
  filesScanned: number
  rulesApplied: number
  summary: { total, critical, high, medium, low, info }
  findings: Finding[]
}
```

`Finding` 包含规则元数据、文件相对路径、行号、代码片段和修复建议。引擎只指出“这里像某种缺陷”，不构造利用输入。

## 规则模型

规则是数据，不是过程。每条规则是冻结对象：

```js
{
  id, title, severity, cwe, owasp,
  languages: string[],
  patterns: RegExp[],
  message, remediation
}
```

`applyRules` 对 `patterns` 做 `flatMap`。新增检测时优先在 `src/rules/catalog.js` 增加一条记录，而不是在流水线里加分支。

当前实现是 **启发式正则 SAST**：

- 优点：零构建、跨语言、易于扩展、适合 CLI 快速审计
- 局限：没有完整 AST / 数据流，因此会有误报和漏报

后续若要提高精度，可在不改 CLI 契约的前提下替换 `engine`：例如为 JavaScript 接入 Acorn/TypeScript AST，仍输出同样的 `Finding` 结构。

## 配置合并

优先级从低到高：

1. `src/core/config.js` 中的默认值
2. 工作目录下的 `webvuln.config.json` 或 `.webvuln.json`
3. `--config` 指定的文件
4. CLI 显式传入的覆盖项

`exclude` 是并集（默认忽略列表始终生效）。`rules.enable` 为空表示“全部启用”；非空则只跑列出的规则。

## 报告

`renderReport(result, format)` 是从 `Finding[]` 到字符串的纯映射：

- `table`：终端阅读
- `json`：脚本与二次处理
- `markdown`：评审评论或 Wiki
- `sarif`：GitHub Code Scanning 等平台

渲染器不得修改 `result`。

## 控制流与函数式约束

- 转换用 `map` / `filter` / `flatMap` / `reduce`，不在核心路径上 `push` 可变数组
- finding 与 config 都当不可变数据；合并配置时返回新对象
- 规则查找用数组过滤，不写长大的 `switch`
- `child_process`、网络请求不得出现在 engine / rules 中

## 扩展点

| 需求 | 改哪里 |
| --- | --- |
| 新漏洞类型 | `src/rules/catalog.js` + 测试 |
| 新语言扩展名 | `src/core/constants.js` 的 `EXTENSION_LANGUAGE` |
| 新报告格式 | `src/report/<format>.js` 并注册到 `src/report/index.js` |
| 新子命令 | `src/cli/commands/` + `src/cli/index.js` |
| 更精确的 JS 分析 | 新增 `src/engine/ast.js`，由 `applyRules` 组合调用 |

## 运行时

- ESM（`"type": "module"`）
- 唯一生产依赖：`commander`（CLI 解析）
- 测试：Node.js 内置 `node:test`，无额外测试框架
