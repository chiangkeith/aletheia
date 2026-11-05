# 贡献指南

感谢你改进 webvuln-analyzer。请先阅读 [开发人员手册](developer-handbook.md) 与 [架构](architecture.md)。

## 流程

1. 从默认分支拉出功能分支，分支名建议 `feat/rule-ssrf` 或 `fix/glob-root`。
2. 保持变更聚焦：一条规则、一种格式或一次缺陷修复。
3. 补测试：规则类必须有命中与未命中用例。
4. 运行 `npm test`。
5. 更新受影响的文档（至少 README 或 `docs/rules.md`）。
6. 提交信息用现在时、说明原因，例如 `add path traversal rule for sendFile sinks`。

## 接受标准

- 符合函数式约定：核心路径无就地突变
- 不引入对目标系统的网络探测、漏洞利用或攻击载荷
- 不把真实客户代码、密钥、完整扫描报告提交进仓库
- 新增依赖需要说明理由；扫描核心应继续保持轻依赖

## 行为准则

讨论规则准确性时，用最小可复现代码片段，不要分享未授权系统的真实漏洞细节。
