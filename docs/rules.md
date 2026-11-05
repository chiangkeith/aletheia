# 规则说明

内置规则定义在 `src/rules/catalog.js`。用 `node bin/aletheia.js rules` 查看当前构建里的完整列表。

## 规则一览

| ID | 严重级别 | CWE | OWASP | 语言 | 在找什么 |
| --- | --- | --- | --- | --- | --- |
| `sql-injection` | critical | CWE-89 | A03 Injection | 主要后端语言 | 用字符串拼接构造 SQL |
| `command-injection` | critical | CWE-78 | A03 Injection | 同上 | `exec` / `os.system` / `Runtime.exec` 等拼接 |
| `code-injection` | critical | CWE-94 | A03 Injection | 同上 | `eval`、`new Function`、动态模板执行 |
| `insecure-deserialization` | critical | CWE-502 | A08 Integrity | 同上 | pickle / unserialize / 原生反序列化 |
| `path-traversal` | high | CWE-22 | A01 Access Control | 同上 | 用户输入进入文件路径 |
| `ssrf` | high | CWE-918 | A10 SSRF | 同上 | 用请求里的 URL 发服务端请求 |
| `xss-sink` | high | CWE-79 | A03 Injection | JS/TS/PHP/Python | HTML sink 未编码 |
| `hardcoded-secret` | high | CWE-798 | A07 Auth | 全部 | 源码或配置中的口令、云密钥、私钥头 |
| `insecure-tls` | high | CWE-295 | A02 Crypto | 全部 | 关闭证书校验 |
| `jwt-none-alg` | high | CWE-347 | A07 Auth | JS/Python/Java/Go | JWT 接受 none 或不校验 |
| `prototype-pollution` | high | CWE-1321 | A03 Injection | JS/TS | 递归 merge / `__proto__` |
| `xxe` | high | CWE-611 | A05 Misconfig | 全部 | 可能解析外部实体的 XML API |
| `open-redirect` | medium | CWE-601 | A01 Access Control | 全部 | 重定向目标来自请求 |
| `weak-crypto` | medium | CWE-327 | A02 Crypto | 全部 | MD5 / SHA-1 / DES |
| `debug-enabled` | medium | CWE-489 | A05 Misconfig | 全部 | Flask/Spring/PHP 调试开关 |
| `cors-misconfiguration` | medium | CWE-942 | A05 Misconfig | 若干 | `origin: *` 或 `cors()` |
| `cookie-security` | medium | CWE-614 | A05 Misconfig | 若干 | `secure: false` / `httpOnly: false` |
| `mass-assignment` | medium | CWE-915 | A04 Insecure Design | 全部 | 把整个 `req.body` 写入模型 |
| `missing-authz-todo` | low | CWE-285 | A01 Access Control | 全部 | TODO auth、`/admin` 无鉴权痕迹 |

## 匹配策略

规则使用正则启发式，围绕两类信号：

1. **危险 sink**：`exec`、`innerHTML`、`pickle.loads`、拼接的 `SELECT` 等
2. **不可信来源痕迹**：`req.query`、`request.args`、`_GET`、字符串 `+`、模板 `${}`

因此：

- 参数化查询 `db.query("... ?", [name])` 不应命中 `sql-injection`
- HTTP 客户端或路由方法（`.delete('/ticket/' + id)`、`app.update(...)`）不是 SQL，不应命中 `sql-injection`。SQL 关键字需要出现在语句里（大写语句，或带 `from` / `into` / `set` 的字符串）
- `read -p "... Password: "` 这类提示语不是赋值，不应命中 `hardcoded-secret`。赋值右侧的引号必须是字面量的起始引号
- `res.send(\`${log}\`)` 这种纯文本模板不应命中 `xss-sink`。会命中的是 HTML，或插值来自 `req` / `query` / `body`
- `md5(userId)` 这类标识摘要不应命中 `weak-crypto`。会命中的是口令、token、secret，以及 `createHash('md5')`、`hashlib.md5`、DES
- JavaScript / TypeScript 的注释会先抹掉再匹配，注释里的示例不应出报告
- `readFile("/var/app/data/readme.txt")` 不应命中 `path-traversal`

## 处理误报

按推荐顺序：

1. **先看源码**。确认数据是否来自用户、是否已校验。
2. 单次扫描排除规则：`--disable weak-crypto,xxe`
3. 在 `aletheia.config.json` 的 `rules.disable` 或更窄的 `include`/`exclude` 里持久化
4. 若模式本身过宽，提交规则补丁并附上正例 / 反例测试

不要用注释协议以外的“关闭扫描器”技巧在业务代码里堆特殊标记；当前版本没有 `aletheia-disable` 行内指令，以免规则绕过变得不透明。若需要该能力，应作为显式功能加入 engine，并写进本页。

## 漏报

没有 AST 与污点跟踪时，下列情况可能漏掉：

- 先赋给中间变量再传入 sink
- 跨文件的封装（`runQuery(buildSql(req))`）
- 模板引擎、ORM 的间接 API

改进方向见 [architecture.md](architecture.md) 的扩展点：为单一语言接入解析器，同时保持 `Finding` 形状不变。

## 严重级别建议

| 级别 | 典型含义 | CI |
| --- | --- | --- |
| critical | 可导致命令/SQL/反序列化类问题 | 应阻断合并 |
| high | 密钥泄露、路径穿越、SSRF、关闭 TLS 校验 | 默认 `--fail-on high` |
| medium | 配置与加密算法偏弱 | 可警告 |
| low / info | 待办鉴权、提示性发现 | 人工分类 |

团队可以按风险偏好调整 `--fail-on`，但不要为了绿构建而默认 `--fail-on critical` 却忽略 high 级密钥泄露。
