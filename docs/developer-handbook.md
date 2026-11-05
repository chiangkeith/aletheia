# 开发人员手册

面向要改这个仓库的人：如何跑起来、代码怎么写、怎样加规则和测试。

## 环境

- Node.js `>= 20.19`（仓库在 Node 24 下开发）
- npm 10+
- git

克隆后：

```bash
cd aletheia
npm install
npm test
node bin/aletheia.js scan ./fixtures/sample-web-service
```

建议把 `./bin/aletheia.js` 放进 PATH，或使用 `npm link`。

## 目录约定

```
aletheia/
├── bin/aletheia.js          # shebang 入口，只负责调用 CLI
├── src/
│   ├── index.js            # 库导出
│   ├── cli/                # commander 命令
│   ├── core/               # 配置与流水线
│   ├── ingest/             # 文件发现
│   ├── engine/             # 匹配与评分
│   ├── rules/catalog.js    # 规则表
│   ├── report/             # 渲染器
│   └── utils/
├── test/                   # node:test
├── fixtures/               # 故意有问题的示例服务
├── examples/               # 示例配置
└── docs/
```

不要把扫描缓存、报告输出、`.env` 提交进 git。

## 编码约定

本仓库要求 **函数式风格**（见工作区规则）：

1. 纯函数：同样输入得到同样输出；匹配与评分不得读全局可变状态。
2. 不可变：用展开运算符返回新对象 / 新数组，不要 `push` 后再返回同一个数组。
3. 小函数：一个函数只做过滤、映射、合并或 I/O 中的一件事。
4. 数据驱动：规则、严重级别、报告格式都用表查找，而不是深层 `if/else`。
5. 副作用靠边缘：`readFile`、`writeFile`、`process.exitCode` 只出现在 CLI、`pipeline` 的读源码步骤和 `writeReport`。

推荐形态：

```js
const enabledRules = (rules, config) =>
  rules
    .filter((rule) => config.languages.some((language) => rule.languages.includes(language)))
    .filter((rule) => !config.rules.disable.includes(rule.id));
```

避免在核心逻辑里写：

```js
const out = [];
for (const rule of rules) {
  if (ok) out.push(rule);
}
```

## 如何新增一条规则

1. 在 `src/rules/catalog.js` 追加一个 `rule({...})`。
2. `id` 使用 kebab-case，且全局唯一。
3. `severity` 只能是 `critical | high | medium | low | info`。
4. 填写 `cwe` 与 `owasp`，便于报告和合规对照。
5. `patterns` 写成尽可能收的正则，优先匹配 **sink + 动态拼接** 而不是某个 API 名称本身。
6. `remediation` 只写防御建议（参数化查询、白名单、编码），不要写利用方法。
7. 在 `test/applyRules.test.js` 增加正例和反例。
8. 若需要被夹具覆盖，把最小示例加到 `fixtures/sample-web-service`。
9. 更新 `docs/rules.md`。

规则 ID 一旦发布，视为公共契约；CI 可能用 `--only sql-injection` 引用它。需要改名时保留旧 id 或写迁移说明。

## 如何新增语言

1. 在 `EXTENSION_LANGUAGE` 登记扩展名。
2. 把语言名加入规则的 `languages` 数组（或新增只服务该语言的规则）。
3. 加一个小夹具文件，确认 `collectFiles` 能收录。

语言标识用小写英文：`javascript`、`typescript`、`python`、`php`、`java`、`go`、`generic`。

## 如何新增报告格式

1. 新建 `src/report/<name>.js`，导出 `renderXxx(result) => string`。
2. 在 `src/report/index.js` 的 `RENDERERS` 登记。
3. 在 `test/report.test.js` 断言关键字段。
4. 更新 `docs/usage.md`。

渲染器必须是纯函数，不要读环境变量来改变内容（需要环境信息时由 CLI 传入 `result`）。

## 测试策略

| 层级 | 文件 | 覆盖什么 |
| --- | --- | --- |
| 单元 | `test/applyRules.test.js` | 单条规则的命中 / 未命中 |
| 单元 | `test/text.test.js` | glob 语义 |
| 单元 | `test/detectLanguage.test.js` | 扩展名映射 |
| 集成 | `test/pipeline.test.js` | 真实夹具目录 |
| 快照式 | `test/report.test.js` | 报告关键结构 |

运行：

```bash
npm test
```

写规则测试时：

- 正例：包含明显拼接或危险 sink 的最短片段
- 反例：安全用法（参数化查询、常量路径）必须不报同一规则

不要为了“测规则”在夹具里加入可利用的完整攻击脚本。最短的源码模式足够。

## 本地调试

只跑一条规则：

```bash
node bin/aletheia.js scan ./fixtures/sample-web-service --only sql-injection --format json
```

提高详细程度时，用 JSON 看 `snippet` 和 `line` 是否指到预期位置。

调试 glob 时，记住 `**/*` 必须能匹配仓库根目录的文件；实现见 `src/utils/text.js` 的 `toGlobRegex`。

## 作为库调用

```js
import { loadConfig, scanProject, renderReport } from "aletheia";

const config = await loadConfig({ cwd: process.cwd() });
const result = await scanProject({ target: "./service", config });
process.stdout.write(renderReport(result, "json"));
```

库 API 的稳定面：`scanProject`、`loadConfig`、`getRules`、`renderReport`。CLI option 名称可以变，但 JSON finding 字段应保持向后兼容。

## 发布检查清单

- [ ] `npm test` 通过
- [ ] 手动扫描 `fixtures/sample-web-service`，关键规则仍能命中
- [ ] README / CHANGELOG / docs/rules.md 已更新
- [ ] 没有把真实密钥、客户代码或扫描报告提交进仓库
