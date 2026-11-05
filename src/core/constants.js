export const SEVERITIES = ["critical", "high", "medium", "low", "info"];

export const SEVERITY_RANK = Object.freeze({
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
});

export const LANGUAGES = Object.freeze({
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  php: "php",
  java: "java",
  go: "go",
  generic: "generic",
});

export const EXTENSION_LANGUAGE = Object.freeze({
  ".js": LANGUAGES.javascript,
  ".mjs": LANGUAGES.javascript,
  ".cjs": LANGUAGES.javascript,
  ".jsx": LANGUAGES.javascript,
  ".ts": LANGUAGES.typescript,
  ".tsx": LANGUAGES.typescript,
  ".py": LANGUAGES.python,
  ".php": LANGUAGES.php,
  ".java": LANGUAGES.java,
  ".go": LANGUAGES.go,
  ".env": LANGUAGES.generic,
  ".yml": LANGUAGES.generic,
  ".yaml": LANGUAGES.generic,
  ".json": LANGUAGES.generic,
  ".xml": LANGUAGES.generic,
  ".conf": LANGUAGES.generic,
  ".ini": LANGUAGES.generic,
  ".properties": LANGUAGES.generic,
});

export const DEFAULT_IGNORE = Object.freeze([
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
  "**/vendor/**",
  "**/.venv/**",
  "**/venv/**",
  "**/__pycache__/**",
  "**/.idea/**",
  "**/.vscode/**",
  "**/target/**",
  "**/*.min.js",
  "**/package-lock.json",
  "**/yarn.lock",
  "**/pnpm-lock.yaml",
]);

export const DEFAULT_CONFIG_NAMES = Object.freeze([
  "webvuln.config.json",
  ".webvuln.json",
]);

export const EXIT_CODES = Object.freeze({
  ok: 0,
  findings: 2,
  usage: 64,
  error: 1,
});
