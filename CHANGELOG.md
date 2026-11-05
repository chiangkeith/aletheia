# Changelog

## Unreleased

- 降低误报：SQL 规则不再把 `.delete('/path/' + id)` 当成 SQL；硬编码密钥忽略提示语中的 `Password:`；`xss-sink` 只看 HTML 或请求数据插值；`weak-crypto` 的 `md5()` / `sha1()` 只在口令、token、secret 或显式弱算法 API 上报告
- JavaScript / TypeScript 匹配前会忽略注释
- `scan` 在 stderr 显示扫描过程（目标、文件数、当前文件、耗时与发现摘要），可用 `--quiet` / `--no-progress` 关闭，`--verbose` 列出每个文件
- 扫描结果增加 `durationMs`；table / markdown 报告显示 Duration
- 默认跳过 `.output`、`.nuxt`、`.next`、`_nuxt` 等构建/打包目录，以及过大或压缩过的 JS/TS，避免卡在 bundle 上
- `--output` 会自动创建缺失的父目录，并按 `.md` / `.json` / `.sarif` 扩展名推断报告格式

## 1.0.0 — 2026-11-05

- 项目定名为 Aletheia（去蔽）
- 首次发布 Node.js CLI：`scan`、`rules`、`init`
- 内置 OWASP 相关启发式规则（注入、路径穿越、密钥硬编码等）
- 支持 table / json / markdown / sarif 报告
- 提供配置文件、CI 退出码与示例夹具
