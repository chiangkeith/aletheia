import { LANGUAGES } from "../core/constants.js";
import { acceptHardcodedSecret, acceptWeakCrypto } from "./guards.js";

const rule = (definition) => Object.freeze(definition);

const ALL_CODE = [
  LANGUAGES.javascript,
  LANGUAGES.typescript,
  LANGUAGES.python,
  LANGUAGES.php,
  LANGUAGES.java,
  LANGUAGES.go,
];

export const RULES = Object.freeze([
  rule({
    id: "sql-injection",
    title: "Possible SQL injection via string concatenation",
    severity: "critical",
    cwe: "CWE-89",
    owasp: "A03:2021 Injection",
    languages: ALL_CODE,
    patterns: [
      /\b(?:query|execute|exec|raw)\s*\(\s*[`'"][^`'"]*(?:\+|\$\{)/i,
      /(?<![\w.])(?:SELECT|INSERT|UPDATE|DELETE|DROP)\b[^;\n]{0,240}(?:\+|\$\{)/,
      /[`'"]\s*(?:select|insert|update|delete|drop)\b[^`'"]{0,200}?\b(?:from|into|table|set|values)\b[^`'"]*[`'"]\s*\+/i,
      /[`]\s*(?:select|insert|update|delete|drop)\b[^`]{0,200}?\b(?:from|into|table|set|values)\b[^`]*\$\{/i,
      /\bf["']\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP)\b/i,
      /[`'"]\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP)\b[^`'"]*[`'"]\s*\.format\s*\(/i,
      /[`'"]\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP)\b[^`'"]*%(?:s|d|\()/i,
      /Statement\s+\w+\s*=[\s\S]{0,80}\.execute(Query|Update)?\s*\(\s*["'][^"']*["']\s*\+/i,
      /fmt\.Sprintf\s*\(\s*["'][^"']*(?:SELECT|INSERT|UPDATE|DELETE)/i,
    ],
    message: "SQL is built from dynamic strings. This can allow query tampering if user input reaches the statement.",
    remediation:
      "Use parameterized queries, prepared statements, or a query builder. Never concatenate untrusted data into SQL.",
  }),
  rule({
    id: "command-injection",
    title: "Possible OS command injection",
    severity: "critical",
    cwe: "CWE-78",
    owasp: "A03:2021 Injection",
    languages: ALL_CODE,
    patterns: [
      /\b(?:exec|execSync|spawn|spawnSync|system|popen|passthru|shell_exec)\s*\([^)]*(?:\+|\$\{|`)/,
      /child_process\.(?:exec|execSync|execFile)\s*\(/,
      /subprocess\.(?:Popen|call|run)\s*\([^)]*shell\s*=\s*True/,
      /os\.(?:system|popen)\s*\(/,
      /Runtime\.getRuntime\(\)\.exec\s*\(/,
      /exec\.Command\s*\([^)]*(?:\+|fmt\.Sprintf)/,
    ],
    message: "An operating-system command is invoked with a dynamically built string.",
    remediation:
      "Avoid a shell. Pass arguments as an array, validate against an allow-list, and never interpolate untrusted input.",
  }),
  rule({
    id: "code-injection",
    title: "Dynamic code evaluation",
    severity: "critical",
    cwe: "CWE-94",
    owasp: "A03:2021 Injection",
    languages: ALL_CODE,
    patterns: [
      /\beval\s*\(/,
      /\bnew\s+Function\s*\(/,
      /\bexec\s*\(\s*(?:request|req\.|input\(|\$|_GET|_POST)/i,
      /render_template_string\s*\(/,
      /groovy\.lang\.GroovyShell|ScriptEngineManager/,
    ],
    message: "Dynamic evaluation can execute attacker-controlled code.",
    remediation:
      "Remove eval/Function/exec of untrusted data. Prefer parsers, interpreters with sandboxing, or explicit mappings.",
  }),
  rule({
    id: "path-traversal",
    title: "Possible path traversal in file access",
    severity: "high",
    cwe: "CWE-22",
    owasp: "A01:2021 Broken Access Control",
    languages: ALL_CODE,
    patterns: [
      /\b(?:readFile|readFileSync|createReadStream|open|fopen|file_get_contents|Files\.read|os\.Open)\s*\([^)]*(?:req\.|request\.|_GET|_POST|params|query|body)/,
      /\b(?:sendFile|send_file|res\.download)\s*\([^)]*(?:req\.|request\.)/,
      /path\.(?:join|resolve)\s*\([^)]*(?:req\.|request\.|params|query)/,
    ],
    message: "User-controlled values appear to influence a filesystem path.",
    remediation:
      "Resolve the path, confirm it stays inside an allow-listed directory, and reject `..` segments before reading or writing.",
  }),
  rule({
    id: "ssrf",
    title: "Possible server-side request forgery",
    severity: "high",
    cwe: "CWE-918",
    owasp: "A10:2021 SSRF",
    languages: ALL_CODE,
    patterns: [
      /\b(?:fetch|axios|got|request|http\.get|https\.get|urllib\.request|requests\.(?:get|post)|file_get_contents|HttpURLConnection|http\.Get)\s*\([^)]*(?:req\.|request\.|_GET|_POST|params|query|body|url)/i,
      /new\s+URL\s*\(\s*(?:req\.|request\.)/,
    ],
    message: "The service may fetch a URL supplied by a client.",
    remediation:
      "Allow-list destination hosts, block link-local and cloud metadata ranges, and do not follow untrusted redirects.",
  }),
  rule({
    id: "xss-sink",
    title: "Possible cross-site scripting sink",
    severity: "high",
    cwe: "CWE-79",
    owasp: "A03:2021 Injection",
    languages: [LANGUAGES.javascript, LANGUAGES.typescript, LANGUAGES.php, LANGUAGES.python],
    patterns: [
      /\.(?:innerHTML|outerHTML)\s*=/,
      /\bdocument\.write\s*\(/,
      /\bres\.send\s*\(\s*req\./,
      /\bres\.send\s*\(\s*`[^`]*(?:<[a-zA-Z!/][^`]*\$\{|\$\{[^}]*(?:req\.|request\.|params|query|body))/,
      /echo\s+\$_(?:GET|POST|REQUEST)/,
      /render_template_string|Markup\s*\(/,
      /\{\{\s*.*\s*\|\s*safe\s*\}\}/,
    ],
    message: "Untrusted data may be written into HTML without encoding.",
    remediation:
      "Encode output for the target context, use a templating auto-escaper, and avoid innerHTML with untrusted strings.",
  }),
  rule({
    id: "open-redirect",
    title: "Possible open redirect",
    severity: "medium",
    cwe: "CWE-601",
    owasp: "A01:2021 Broken Access Control",
    languages: ALL_CODE,
    patterns: [
      /\b(?:res\.redirect|redirect|HttpResponseRedirect|sendRedirect|header\s*\(\s*["']Location)\s*\([^)]*(?:req\.|request\.|_GET|_POST|params|query)/i,
    ],
    message: "A redirect target appears to come from request data.",
    remediation:
      "Allow-list relative paths or known hosts. Do not redirect to an arbitrary user-supplied URL.",
  }),
  rule({
    id: "insecure-deserialization",
    title: "Insecure deserialization",
    severity: "critical",
    cwe: "CWE-502",
    owasp: "A08:2021 Software and Data Integrity Failures",
    languages: ALL_CODE,
    patterns: [
      /\bpickle\.loads?\s*\(/,
      /\byaml\.load\s*\((?!.*Loader\s*=)/,
      /\bunserialize\s*\(/,
      /\bunmarshal\.loads\s*\(/,
      /ObjectInputStream|readObject\s*\(/,
      /\bjson\.parse\s*\(\s*(?:req\.|request\.)/,
      /JSON\.parse\s*\(\s*(?:req\.|request\.)[^)]*\)(?![\s\S]{0,40}schema)/,
    ],
    message: "Deserializing untrusted data can lead to unexpected object graphs or code execution in some languages.",
    remediation:
      "Prefer JSON with a schema. Avoid pickle/unserialize/Java native serialization of untrusted input.",
  }),
  rule({
    id: "hardcoded-secret",
    title: "Hardcoded credential or secret",
    severity: "high",
    cwe: "CWE-798",
    owasp: "A07:2021 Identification and Authentication Failures",
    languages: [...ALL_CODE, LANGUAGES.generic],
    patterns: [
      /\b(?:password|passwd|secret[_-]?key|secret|api[_-]?key|access[_-]?token|private[_-]?key)\b\s*[:=]\s*['"][^'"]{8,}['"]/i,
      /AKIA[0-9A-Z]{16}/,
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    ],
    accept: acceptHardcodedSecret,
    message: "A secret appears to be embedded in source or config.",
    remediation:
      "Move secrets to a secret manager or environment variables, rotate the exposed value, and add secret scanning to CI.",
  }),
  rule({
    id: "weak-crypto",
    title: "Weak cryptographic algorithm",
    severity: "medium",
    cwe: "CWE-327",
    owasp: "A02:2021 Cryptographic Failures",
    languages: ALL_CODE,
    patterns: [
      /\b(?:md5|sha1)\s*\(/i,
      /createHash\s*\(\s*['"](?:md5|sha1)['"]/i,
      /createCipher(?:iv)?\s*\(\s*['"]des/i,
      /hashlib\.(?:md5|sha1)\s*\(/,
      /MessageDigest\.getInstance\s*\(\s*["']MD5["']/,
    ],
    accept: acceptWeakCrypto,
    message: "MD5, SHA-1, or DES are not suitable for passwords, tokens, or new integrity checks.",
    remediation:
      "Use SHA-256+ for integrity and a password KDF such as Argon2id, scrypt, or bcrypt for credentials.",
  }),
  rule({
    id: "insecure-tls",
    title: "TLS certificate or hostname verification disabled",
    severity: "high",
    cwe: "CWE-295",
    owasp: "A02:2021 Cryptographic Failures",
    languages: ALL_CODE,
    patterns: [
      /rejectUnauthorized\s*:\s*false/,
      /NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0/,
      /verify\s*=\s*False/,
      /InsecureRequestWarning|TrustAll|ALLOW_ALL_HOSTNAME_VERIFIER/,
      /InsecureSkipVerify\s*:\s*true/,
    ],
    message: "Certificate or hostname checks appear to be turned off.",
    remediation:
      "Keep TLS verification enabled. Use a private CA bundle for internal services instead of disabling checks.",
  }),
  rule({
    id: "debug-enabled",
    title: "Debug mode or stack traces enabled",
    severity: "medium",
    cwe: "CWE-489",
    owasp: "A05:2021 Security Misconfiguration",
    languages: ALL_CODE,
    patterns: [
      /app\.run\s*\([^)]*debug\s*=\s*True/,
      /DEBUG\s*=\s*True/,
      /app\.debug\s*=\s*true/i,
      /display_errors\s*=\s*(?:On|1)/i,
      /spring\.jpa\.show-sql\s*=\s*true/i,
    ],
    message: "Debug features can leak internals in production.",
    remediation:
      "Disable debug flags outside local development. Return generic errors to clients and log details server-side.",
  }),
  rule({
    id: "cors-misconfiguration",
    title: "Overly permissive CORS policy",
    severity: "medium",
    cwe: "CWE-942",
    owasp: "A05:2021 Security Misconfiguration",
    languages: [LANGUAGES.javascript, LANGUAGES.typescript, LANGUAGES.go, LANGUAGES.java, LANGUAGES.python],
    patterns: [
      /Access-Control-Allow-Origin["']?\s*[),:]\s*["']\*/,
      /origin\s*:\s*true/,
      /cors\(\s*\)/,
      /AllowAllOrigins|AllowedOrigins:\s*\[\]string\{\s*"\*"\s*\}/,
    ],
    message: "CORS appears to allow any origin, which can expose authenticated APIs to other sites.",
    remediation:
      "Allow-list specific origins. Do not combine wildcard origin with credentialed requests.",
  }),
  rule({
    id: "cookie-security",
    title: "Cookie missing security attributes",
    severity: "medium",
    cwe: "CWE-614",
    owasp: "A05:2021 Security Misconfiguration",
    languages: [LANGUAGES.javascript, LANGUAGES.typescript, LANGUAGES.php, LANGUAGES.python, LANGUAGES.java],
    patterns: [
      /(?:cookie|setCookie|set_cookie)\s*\([^)]*secure\s*:\s*false/i,
      /httpOnly\s*:\s*false/,
      /session\.cookie_secure\s*=\s*False/,
      /session_set_cookie_params\s*\([^)]*false/i,
    ],
    message: "Session cookies should be Secure, HttpOnly, and SameSite-restricted.",
    remediation:
      "Set Secure, HttpOnly, and SameSite=Lax or Strict on session cookies. Prefer a well-tested session library.",
  }),
  rule({
    id: "jwt-none-alg",
    title: "JWT algorithm confusion or none algorithm",
    severity: "high",
    cwe: "CWE-347",
    owasp: "A07:2021 Identification and Authentication Failures",
    languages: [LANGUAGES.javascript, LANGUAGES.typescript, LANGUAGES.python, LANGUAGES.java, LANGUAGES.go],
    patterns: [
      /jwt\.(?:verify|decode)\s*\([^)]*algorithms?\s*:\s*\[\s*['"]none['"]/i,
      /verify\s*\([^)]*algorithm\s*=\s*None/,
      /\.decode\([^)]*verify\s*=\s*False/,
    ],
    message: "JWT verification may accept a weak or unsigned algorithm.",
    remediation:
      "Pin an explicit strong algorithm (RS256 or ES256). Never honor `alg: none` or skip signature checks.",
  }),
  rule({
    id: "mass-assignment",
    title: "Possible mass assignment of request bodies",
    severity: "medium",
    cwe: "CWE-915",
    owasp: "A04:2021 Insecure Design",
    languages: ALL_CODE,
    patterns: [
      /\.(?:save|create|update|insert)\s*\(\s*(?:req\.body|request\.(?:json|form|data)|request\.body)/,
      /\.update\s*\(\s*\*\s*request\./,
      /Model::create\s*\(\s*\$request->all\s*\(\s*\)/,
    ],
    message: "The full request body is passed into persistence, which can overwrite privileged fields.",
    remediation:
      "Pick an explicit allow-list of fields. Never bind role, owner, or price fields directly from the client.",
  }),
  rule({
    id: "prototype-pollution",
    title: "Possible prototype pollution",
    severity: "high",
    cwe: "CWE-1321",
    owasp: "A03:2021 Injection",
    languages: [LANGUAGES.javascript, LANGUAGES.typescript],
    patterns: [
      /Object\.assign\s*\(\s*\w+\s*,\s*(?:req\.|JSON\.parse)/,
      /\[(?:req\.|key|payload)[^\]]*\]\s*=/,
      /\.__proto__|\[(['"])__proto__\1\]|constructor\s*\[/,
      /lodash\.merge|_\.merge\s*\(/,
    ],
    message: "Recursive merge or dynamic keys can pollute Object.prototype.",
    remediation:
      "Use Object.create(null), block `__proto__` and `constructor` keys, and prefer structured clone over recursive merge.",
  }),
  rule({
    id: "xxe",
    title: "XML parser may resolve external entities",
    severity: "high",
    cwe: "CWE-611",
    owasp: "A05:2021 Security Misconfiguration",
    languages: ALL_CODE,
    patterns: [
      /libxml_disable_entity_loader\s*\(\s*false/,
      /DocumentBuilderFactory|SAXParser|XMLReader/,
      /etree\.XMLParser\s*\([^)]*resolve_entities\s*=\s*True/,
      /xml2js|fast-xml-parser|xml\.Unmarshal/,
    ],
    message: "XML parsing is present; default parsers in some stacks still resolve external entities.",
    remediation:
      "Disable DTDs and external entities. Prefer JSON. If XML is required, use a hardened parser configuration.",
  }),
  rule({
    id: "missing-authz-todo",
    title: "Authentication or authorization marked incomplete",
    severity: "low",
    cwe: "CWE-285",
    owasp: "A01:2021 Broken Access Control",
    languages: ALL_CODE,
    patterns: [
      /TODO.*(auth|permission|acl|authorize)/i,
      /skipAuth|noAuth|allowAnonymous|permitAll/,
      /app\.(?:get|post|put|delete|patch)\s*\([^)]*\/admin/i,
    ],
    message: "A route or comment suggests authorization may be missing or unfinished.",
    remediation:
      "Enforce authentication and object-level authorization on every sensitive route. Deny by default.",
  }),
]);

export const getRules = ({ languages = [], enable = [], disable = [] } = {}) =>
  RULES.filter((item) => item.languages.some((language) => languages.includes(language)))
    .filter((item) => (enable.length === 0 ? true : enable.includes(item.id)))
    .filter((item) => !disable.includes(item.id));

export const getRuleById = (id) => RULES.find((item) => item.id === id) ?? null;
