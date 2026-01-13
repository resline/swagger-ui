# Dify Plugin Manifest Schema Reference

**Version:** 0.0.1 (Schema format)
**Last Updated:** 2025-12-01
**Purpose:** Quick reference for Dify plugin `manifest.yaml` structure

---

## Table of Contents

1. [Quick Overview](#quick-overview)
2. [Complete Field Reference](#complete-field-reference)
3. [Plugin Type Constraints](#plugin-type-constraints)
4. [Permission Configuration](#permission-configuration)
5. [Meta Runner Configuration](#meta-runner-configuration)
6. [Examples by Plugin Type](#examples-by-plugin-type)
7. [Validation Rules](#validation-rules)
8. [Common Patterns](#common-patterns)

---

## Quick Overview

### Minimal Valid Manifest

```yaml
version: 0.0.1                    # Plugin version (semver)
type: plugin                      # Type: "plugin" (bundle future)
author: "your-org"                # Author/organization name
name: "your-plugin"               # Plugin identifier (lowercase, hyphens)
label:                            # Display name (i18n)
  en_US: "Your Plugin"
created_at: "2024-01-01T00:00:00Z" # RFC3339 timestamp
icon: icon.svg                    # Icon file path
resource:                         # Resource requirements
  memory: 268435456               # 256MB in bytes
  permission: {}                  # Empty = minimal permissions
plugins:                          # Plugin capabilities
  tools:                          # Or: models, endpoints, etc.
    - provider/your-plugin.yaml
meta:                             # Runtime metadata
  version: 0.0.1                  # Manifest format version
  arch:
    - amd64
    - arm64
  runner:
    language: python
    version: "3.12"
    entrypoint: main
```

---

## Complete Field Reference

### Root Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string (semver) | ✅ Yes | Plugin version (e.g., `0.1.0`, `1.2.3`) |
| `type` | string | ✅ Yes | Plugin type: `"plugin"` (only option; `"bundle"` planned) |
| `author` | string | ✅ Yes | Author/organization name (shown in Marketplace) |
| `name` | string | ✅ Yes | Plugin identifier (lowercase, hyphens, no spaces) |
| `label` | object | ✅ Yes | Display name in multiple languages |
| `description` | object | ❌ No | Detailed description (i18n) |
| `created_at` | string (RFC3339) | ✅ Yes | Creation timestamp (must not be future) |
| `icon` | string | ✅ Yes | Icon file path (relative to manifest) |
| `tags` | array[string] | ❌ No | Searchable tags (e.g., `["search", "productivity"]`) |
| `resource` | object | ❌ No | Resource allocation and permissions |
| `plugins` | object | ✅ Yes | Plugin capabilities (tools/models/etc.) |
| `meta` | object | ✅ Yes | Runtime configuration |
| `privacy` | string | ⚠️ Conditional | Privacy policy path/URL (required for Marketplace) |
| `verified` | boolean | ❌ No | Verification status (set by Dify team) |

### Label Object (i18n)

Supported locales: `en_US`, `zh_Hans`, `ja_JP`, `pt_BR`

```yaml
label:
  en_US: "English Name"
  zh_Hans: "中文名称"
  ja_JP: "日本語名"
  pt_BR: "Nome Português"
```

**Requirement:** At least `en_US` must be provided.

### Description Object (Optional)

Same i18n structure as `label`:

```yaml
description:
  en_US: "Detailed English description"
  zh_Hans: "详细中文描述"
```

### Tags Array (Optional)

Free-form tags for categorization and search:

```yaml
tags:
  - search
  - productivity
  - rag
  - utilities
  - agent
```

**Common Tags:** `search`, `productivity`, `rag`, `utilities`, `agent`, `ai`, `database`, `cloud`

---

## Resource Configuration

### Resource Object Structure

```yaml
resource:
  memory: 268435456              # Memory limit in bytes
  permission:                    # Permission flags
    tool:                        # Tool invocation permission
      enabled: true
    model:                       # Model invocation permission
      enabled: true
      llm: true                  # Large language models
      text_embedding: false      # Text embedding models
      rerank: false              # Rerank models
      tts: false                 # Text-to-speech
      speech2text: false         # Speech-to-text
      moderation: false          # Content moderation
    node:                        # Node invocation (rare)
      enabled: false
    endpoint:                    # Endpoint registration
      enabled: true
    app:                         # App invocation
      enabled: true
    storage:                     # Persistent storage
      enabled: true
      size: 1048576              # Storage size in bytes (1MB)
```

### Memory Values (Common Sizes)

| Size | Bytes | Usage |
|------|-------|-------|
| 1 MB | `1048576` | Minimal storage quota |
| 256 MB | `268435456` | Typical plugin runtime |
| 1 GB | `1073741824` | Large data processing |
| 4 GB | `4294967296` | Heavy ML workloads |

**Formula:** `bytes = megabytes × 1024 × 1024`

---

## Permission Configuration

### Tool Permission

**Purpose:** Allows plugin to invoke tools registered in Dify.

```yaml
permission:
  tool:
    enabled: true
```

**Use Cases:** Extensions that need to call external tools, workflows that chain tool calls.

### Model Permission

**Purpose:** Allows plugin to invoke AI models.

```yaml
permission:
  model:
    enabled: true           # Master switch
    llm: true              # Text generation (GPT, Claude, etc.)
    text_embedding: true   # Vector embeddings (ada-002, etc.)
    rerank: true           # Reranking models (Cohere, etc.)
    tts: true              # Text-to-speech (OpenAI TTS, etc.)
    speech2text: true      # Speech-to-text (Whisper, etc.)
    moderation: true       # Content moderation (OpenAI Moderation, etc.)
```

**Important:** Set `enabled: true` to enable the master switch, then enable specific model types as needed.

**Constraints:**
- **Model + Tool plugins:** Allowed together
- **Model + Endpoint plugins:** ❌ **NOT ALLOWED** (see [constraints](#plugin-type-constraints))

### Node Permission

**Purpose:** Allows plugin to invoke workflow nodes (advanced, rarely used).

```yaml
permission:
  node:
    enabled: true
```

**Use Cases:** Custom workflow orchestration, advanced agent strategies.

### Endpoint Permission

**Purpose:** Allows plugin to register HTTP endpoints (webhooks, APIs).

```yaml
permission:
  endpoint:
    enabled: true
```

**Use Cases:** Slack bots, webhook receivers, external API integrations.

**Constraints:** Cannot be combined with `models` plugin type (see [constraints](#plugin-type-constraints)).

### App Permission

**Purpose:** Allows plugin to invoke Dify applications.

```yaml
permission:
  app:
    enabled: true
```

**Use Cases:** Extensions that trigger workflows, bots that use Dify apps.

### Storage Permission

**Purpose:** Provides persistent storage for plugin data.

```yaml
permission:
  storage:
    enabled: true
    size: 1048576          # Storage quota in bytes
```

**Use Cases:** Caching data, storing user preferences, maintaining state between invocations.

**Size Limits:** Typically 1MB-100MB (check Dify instance limits).

---

## Plugin Type Constraints

### Allowed Plugin Capabilities

The `plugins` object defines what the plugin provides. **Only ONE provider per type is currently supported.**

```yaml
plugins:
  tools:             # Tool provider (1 file only)
    - provider/tool.yaml
  models:            # Model provider (1 file only)
    - provider/model.yaml
  endpoints:         # Endpoint provider (1 file only)
    - group/endpoint.yaml
  agent_strategies:  # Agent strategy provider (1 file only)
    - provider/strategy.yaml
  datasources:       # Datasource provider (1 file only)
    - provider/datasource.yaml
  triggers:          # Trigger provider (1 file only)
    - provider/trigger.yaml
```

### Combination Rules

| Combination | Allowed | Notes |
|-------------|---------|-------|
| `tools` alone | ✅ Yes | Tool-only plugin |
| `models` alone | ✅ Yes | Model-only plugin |
| `endpoints` alone | ✅ Yes | Endpoint-only plugin |
| `agent_strategies` alone | ✅ Yes | Agent strategy plugin |
| `datasources` alone | ✅ Yes | Datasource plugin |
| `triggers` alone | ✅ Yes | Trigger plugin |
| `tools` + `models` | ❌ **NO** | Cannot combine tools and models |
| `models` + `endpoints` | ❌ **NO** | Cannot combine models and endpoints |
| No capabilities | ❌ **NO** | At least one capability required |
| Multiple providers per type | ❌ **NO** | Only one provider file per type |

**Official Documentation Warning:**
> Extending both tools and models simultaneously is not allowed.
> Extending both models and Endpoints simultaneously is not allowed.
> Currently, only one provider is supported for each type of extension.

---

## Meta Runner Configuration

### Meta Object Structure

```yaml
meta:
  version: 0.0.1                 # Manifest format version (NOT plugin version)
  minimum_dify_version: "1.10.0" # Minimum Dify version required
  arch:                          # Supported architectures
    - amd64
    - arm64
  runner:                        # Runtime configuration
    language: python             # Programming language
    version: "3.12"              # Language version
    entrypoint: main             # Entry point function
```

### Field Details

| Field | Type | Required | Values | Description |
|-------|------|----------|--------|-------------|
| `meta.version` | string (semver) | ✅ Yes | `0.0.1` | Manifest format version (fixed at 0.0.1) |
| `meta.minimum_dify_version` | string (semver) | ❌ No | `"1.0.0"` - `"1.10.0"` | Minimum Dify version required |
| `meta.arch` | array[string] | ✅ Yes | `["amd64", "arm64"]` | Supported CPU architectures |
| `meta.runner.language` | string | ✅ Yes | `"python"` | Programming language (only Python currently) |
| `meta.runner.version` | string | ✅ Yes | `"3.12"` | Python version (3.12 recommended) |
| `meta.runner.entrypoint` | string | ✅ Yes | `"main"` | Entry point function name |

### Architecture Support

**Options:**
- `amd64` - x86-64 (Intel/AMD 64-bit)
- `arm64` - ARM 64-bit (Apple Silicon, AWS Graviton)

**Best Practice:** Include both architectures for maximum compatibility:

```yaml
arch:
  - amd64
  - arm64
```

### Minimum Dify Version

Specify if your plugin requires features from a specific Dify version:

```yaml
meta:
  minimum_dify_version: "1.10.0"  # Requires Dify 1.10.0 or later
```

**Common Versions:**
- `1.0.0` - Initial plugin system
- `1.3.0` - Enhanced model support
- `1.7.0` - Agent strategies support
- `1.9.0` - Datasources support
- `1.10.0` - Triggers support

**Format:** String with semantic version (quoted).

---

## Examples by Plugin Type

### 1. Tool Plugin (Simple)

**Use Case:** Google search tool with basic permissions.

```yaml
version: 0.1.0
type: plugin
author: langgenius
name: google
label:
  en_US: "Google Search"
  zh_Hans: "谷歌搜索"
description:
  en_US: Perform Google SERP searches and extract snippets
created_at: "2024-07-12T08:03:44Z"
icon: icon.svg
tags:
  - search
resource:
  memory: 268435456
  permission:
    tool:
      enabled: true
    model:
      enabled: true
      llm: true
plugins:
  tools:
    - provider/google.yaml
meta:
  version: 0.0.1
  arch:
    - amd64
    - arm64
  runner:
    language: python
    version: "3.12"
    entrypoint: main
```

### 2. Model Plugin (LLM Only)

**Use Case:** OpenAI model provider with LLM support.

```yaml
version: 0.2.7
type: plugin
author: langgenius
name: openai
label:
  en_US: "OpenAI"
description:
  en_US: Models provided by OpenAI, such as GPT-3.5-Turbo, GPT-4
created_at: "2024-07-12T08:03:44Z"
icon: icon_s_en.svg
resource:
  memory: 268435456
  permission:
    tool:
      enabled: true
    model:
      enabled: true
      llm: true
plugins:
  models:
    - provider/openai.yaml
meta:
  version: 0.0.1
  arch:
    - amd64
    - arm64
  runner:
    language: python
    version: "3.12"
    entrypoint: main
```

### 3. Model Plugin (Multi-Type)

**Use Case:** ZHIPU AI with LLM and text embedding support.

```yaml
version: 0.0.19
type: plugin
author: langgenius
name: zhipuai
label:
  en_US: "ZHIPU AI"
  zh_Hans: "智谱 AI"
description:
  en_US: ZHIPU AI models with LLM and embedding support
  zh_Hans: 智谱 AI 模型，支持 LLM 和嵌入
created_at: "2024-09-20T00:13:50Z"
icon: icon_s_en.svg
resource:
  memory: 268435456
  permission:
    model:
      enabled: true
      llm: true
      text_embedding: true
    tool:
      enabled: true
plugins:
  models:
    - provider/zhipuai.yaml
meta:
  version: 0.0.1
  arch:
    - amd64
    - arm64
  runner:
    language: python
    version: "3.12"
    entrypoint: main
```

### 4. Endpoint Plugin (Bot)

**Use Case:** Slack bot with endpoint, app, and storage permissions.

```yaml
version: 0.0.4
type: plugin
author: langgenius
name: slack-bot
label:
  en_US: Slack Bot
  zh_Hans: Slack Bot
description:
  en_US: Receive messages from Slack and send responses via Dify
  zh_Hans: 接收来自 Slack 的消息并通过 Dify 发送响应
icon: icon.svg
resource:
  memory: 268435456
  permission:
    tool:
      enabled: true
    model:
      enabled: true
      llm: true
      text_embedding: false
      rerank: false
      tts: false
      speech2text: false
      moderation: false
    endpoint:
      enabled: true
    app:
      enabled: true
    storage:
      enabled: true
      size: 1048576
plugins:
  endpoints:
    - group/slack.yaml
meta:
  version: 0.0.1
  arch:
    - amd64
    - arm64
  runner:
    language: python
    version: "3.12"
    entrypoint: main
created_at: "2024-12-17T11:05:59Z"
verified: false
```

### 5. Extension Plugin (OpenAI Compatible)

**Use Case:** Endpoint that converts Dify models to OpenAI-compatible API.

```yaml
version: 0.0.5
type: plugin
author: langgenius
name: oaicompat_dify_model
label:
  en_US: OpenAI Compatible Dify Models
  zh_Hans: OpenAI兼容Dify模型
description:
  en_US: Convert your Dify Models into OpenAI compatible API
  zh_Hans: 将您的Dify模型转换为OpenAI兼容API
icon: icon.svg
resource:
  memory: 268435456
  permission:
    model:
      enabled: true
      llm: true
      text_embedding: true
      rerank: false
      tts: false
      speech2text: false
      moderation: true
    endpoint:
      enabled: true
plugins:
  endpoints:
    - group/oaicompat_dify_model.yaml
meta:
  version: 0.0.1
  arch:
    - amd64
    - arm64
  runner:
    language: python
    version: "3.12"
    entrypoint: main
created_at: "2025-01-03T16:11:42Z"
privacy: PRIVACY.md
verified: false
```

### 6. Agent Strategy Plugin

**Use Case:** Chain-of-Thought (CoT) agent strategy.

```yaml
version: 0.0.25
type: plugin
author: langgenius
name: agent
label:
  en_US: "Dify Agent Strategies"
  zh_Hans: "Dify Agent 策略"
created_at: "2025-01-08T15:22:00Z"
icon: icon.svg
description:
  en_US: Dify official Agent strategies collection
  zh_Hans: Dify 官方 Agent 策略集合
tags:
  - agent
resource:
  memory: 268435456
  permission:
    tool:
      enabled: true
    model:
      enabled: true
      llm: true
plugins:
  agent_strategies:
    - provider/agent.yaml
meta:
  version: 0.0.2
  minimum_dify_version: "1.7.0"
  arch:
    - amd64
    - arm64
  runner:
    language: python
    version: "3.12"
    entrypoint: main
```

### 7. Datasource Plugin

**Use Case:** GitHub repository datasource with RAG support.

```yaml
version: 0.3.3
type: plugin
author: langgenius
name: github_datasource
label:
  en_US: GitHub
  zh_Hans: GitHub
description:
  en_US: GitHub Repository Datasource - Access repos, issues, PRs, wiki
  zh_Hans: GitHub 仓库数据源 - 访问仓库、问题、拉取请求和 Wiki
icon: icon.svg
resource:
  memory: 268435456
  permission: {}
plugins:
  datasources:
    - provider/github.yaml
meta:
  version: 0.3.0
  arch:
    - amd64
    - arm64
  runner:
    language: python
    version: "3.12"
    entrypoint: main
  minimum_dify_version: 1.9.0
created_at: "2025-01-27T10:00:00Z"
privacy: PRIVACY.md
verified: false
tags:
  - rag
```

### 8. Trigger Plugin

**Use Case:** Gmail trigger with storage for webhook subscriptions.

```yaml
version: 0.0.2
type: plugin
author: langgenius
name: gmail_trigger
label:
  en_US: Gmail Trigger
  zh_Hans: Gmail Trigger
description:
  en_US: Gmail push notifications trigger provider for Dify
  zh_Hans: 用于 Dify 的 Gmail 推送通知触发器
icon: icon.svg
resource:
  memory: 268435456
  permission:
    model:
      enabled: true
      llm: true
    tool:
      enabled: true
    storage:
      enabled: true
      size: 1048576
plugins:
  triggers:
    - provider/gmail_trigger.yaml
meta:
  version: 0.0.1
  arch:
    - amd64
    - arm64
  runner:
    language: python
    version: "3.12"
    entrypoint: main
  minimum_dify_version: 1.10.0
created_at: "2024-10-16T08:03:44Z"
tags:
  - utilities
```

### 9. Minimal Plugin (No Permissions)

**Use Case:** Simple datasource with no special permissions.

```yaml
version: 0.0.1
type: plugin
author: your-org
name: simple_datasource
label:
  en_US: "Simple Datasource"
description:
  en_US: A minimal datasource plugin example
created_at: "2024-01-01T00:00:00Z"
icon: icon.svg
resource:
  memory: 268435456
  permission: {}
plugins:
  datasources:
    - provider/simple.yaml
meta:
  version: 0.0.1
  arch:
    - amd64
    - arm64
  runner:
    language: python
    version: "3.12"
    entrypoint: main
```

---

## Validation Rules

### Version Format

**Plugin Version (`version`):**
- **Format:** Semantic versioning (semver): `MAJOR.MINOR.PATCH`
- **Examples:** `0.0.1`, `1.2.3`, `2.0.0`
- **Rules:**
  - MAJOR: Breaking changes
  - MINOR: New features (backward compatible)
  - PATCH: Bug fixes (backward compatible)

**Manifest Format Version (`meta.version`):**
- **Fixed:** `0.0.1` (current manifest schema version)
- **Do NOT change** unless Dify updates manifest schema

### Timestamp Format

**Field:** `created_at`

**Format:** RFC3339 timestamp (ISO 8601 with timezone)

**Examples:**
```yaml
created_at: "2024-07-12T08:03:44.658609186Z"  # UTC (Z suffix)
created_at: "2024-12-17T11:05:59.151918+08:00" # UTC+8
created_at: "2025-01-08T15:22:00.000000000Z"  # UTC with full precision
```

**Validation:**
- Must be valid RFC3339 format
- Must NOT be in the future (Marketplace requirement)
- Recommended: Use UTC (`Z` suffix) for consistency

### Name Constraints

**Plugin Name (`name`):**
- **Format:** Lowercase letters, numbers, underscores, hyphens
- **Valid:** `openai`, `slack-bot`, `github_datasource`
- **Invalid:** `OpenAI` (uppercase), `slack bot` (space), `slack.bot` (dot)

**Author Name (`author`):**
- **Format:** Any string
- **Convention:** Organization name (e.g., `langgenius`, `your-org`)

### Icon File

**Field:** `icon`

**Requirements:**
- Must be a valid file path relative to manifest
- Common formats: `.svg`, `.png`, `.jpg`
- **Recommended:** SVG for scalability

**Examples:**
```yaml
icon: icon.svg
icon: icon_s_en.svg
icon: assets/icon.png
```

### Privacy Policy (Marketplace)

**Field:** `privacy`

**Requirements:**
- **Required** for Marketplace listing
- Can be relative path or URL
- Must provide clear data usage and privacy statements

**Examples:**
```yaml
privacy: "./privacy.md"
privacy: "PRIVACY.md"
privacy: "https://your-domain.com/privacy"
```

---

## Common Patterns

### Pattern 1: Tool Plugin with Model Access

**Scenario:** Tool that needs to call LLMs for processing.

```yaml
resource:
  memory: 268435456
  permission:
    tool:
      enabled: true
    model:
      enabled: true
      llm: true
plugins:
  tools:
    - provider/tool.yaml
```

### Pattern 2: Model Plugin (Disabled)

**Scenario:** Model plugin in development/testing (disabled state).

```yaml
resource:
  memory: 268435456
  permission:
    model:
      enabled: false  # Disabled
plugins:
  models:
    - provider/model.yaml
```

### Pattern 3: Bot with Full Permissions

**Scenario:** Chatbot with endpoint, app, storage, and model access.

```yaml
resource:
  memory: 268435456
  permission:
    tool:
      enabled: true
    model:
      enabled: true
      llm: true
    endpoint:
      enabled: true
    app:
      enabled: true
    storage:
      enabled: true
      size: 1048576
plugins:
  endpoints:
    - group/bot.yaml
```

### Pattern 4: Multi-Language Support

**Scenario:** Plugin with 4 supported languages.

```yaml
label:
  en_US: "English Name"
  zh_Hans: "中文名称"
  ja_JP: "日本語名"
  pt_BR: "Nome Português"
description:
  en_US: "Detailed English description"
  zh_Hans: "详细中文描述"
  ja_JP: "詳細な日本語の説明"
  pt_BR: "Descrição detalhada em português"
```

### Pattern 5: Version-Specific Plugin

**Scenario:** Plugin requires Dify 1.10.0+ features (triggers).

```yaml
meta:
  version: 0.0.1
  minimum_dify_version: "1.10.0"
  arch:
    - amd64
    - arm64
  runner:
    language: python
    version: "3.12"
    entrypoint: main
plugins:
  triggers:
    - provider/trigger.yaml
```

### Pattern 6: High-Memory Plugin

**Scenario:** ML model processing requiring 4GB memory.

```yaml
resource:
  memory: 4294967296  # 4GB
  permission:
    model:
      enabled: true
      llm: true
plugins:
  models:
    - provider/heavy_model.yaml
```

---

## Quick Lookup Tables

### Memory Size Reference

| Description | Bytes | Expression |
|-------------|-------|------------|
| 1 MB | `1048576` | 1 × 1024² |
| 256 MB | `268435456` | 256 × 1024² |
| 512 MB | `536870912` | 512 × 1024² |
| 1 GB | `1073741824` | 1 × 1024³ |
| 2 GB | `2147483648` | 2 × 1024³ |
| 4 GB | `4294967296` | 4 × 1024³ |

### Plugin Type Summary

| Type | `plugins` Field | Typical Permissions | Example Use Case |
|------|-----------------|---------------------|------------------|
| Tool | `tools` | `tool`, `model.llm` | Google Search, Calculator |
| Model | `models` | `model.*`, `tool` | OpenAI, Anthropic, Embeddings |
| Endpoint | `endpoints` | `endpoint`, `app`, `storage` | Slack Bot, Webhook Receiver |
| Agent Strategy | `agent_strategies` | `tool`, `model.llm` | ReACT, CoT, Planning |
| Datasource | `datasources` | Minimal or none | GitHub, Confluence, S3 |
| Trigger | `triggers` | `tool`, `model`, `storage` | Gmail, Airtable, RSS |

### Permission Quick Reference

| Permission | Purpose | Common With |
|------------|---------|-------------|
| `tool.enabled` | Invoke tools | Most plugins |
| `model.enabled` | Invoke models (master switch) | Tools, bots, strategies |
| `model.llm` | Use LLMs (GPT, Claude, etc.) | Almost all plugins |
| `model.text_embedding` | Use embedding models | RAG, semantic search |
| `model.rerank` | Use rerank models | Advanced RAG |
| `model.tts` | Use text-to-speech | Voice bots |
| `model.speech2text` | Use STT (Whisper, etc.) | Voice input |
| `model.moderation` | Use content moderation | User-facing apps |
| `endpoint.enabled` | Register HTTP endpoints | Bots, webhooks |
| `app.enabled` | Invoke Dify apps | Extensions, orchestrators |
| `storage.enabled` | Persistent storage | Bots (state), caching |

### Architecture Codes

| Code | Description | Platforms |
|------|-------------|-----------|
| `amd64` | x86-64 architecture | Intel, AMD, most cloud VMs |
| `arm64` | ARM 64-bit architecture | Apple Silicon (M1/M2/M3), AWS Graviton, Raspberry Pi |

**Best Practice:** Always include both for maximum compatibility.

---

## Troubleshooting

### Common Errors

#### 1. "Parsing failed: manifest.yaml format incorrect"

**Causes:**
- Invalid YAML syntax (indentation, missing quotes)
- Missing required fields
- Invalid data types

**Fix:**
```bash
# Validate YAML syntax
python -c "import yaml; yaml.safe_load(open('manifest.yaml'))"

# Check required fields
grep -E "^(version|type|author|name|label|created_at|icon|plugins|meta):" manifest.yaml
```

#### 2. "Cannot combine tools and models"

**Error:** Plugin has both `tools` and `models` in `plugins` section.

**Fix:** Remove one of them. Create separate plugins if you need both.

```yaml
# ❌ WRONG
plugins:
  tools:
    - provider/tool.yaml
  models:
    - provider/model.yaml

# ✅ CORRECT (choose one)
plugins:
  tools:
    - provider/tool.yaml
```

#### 3. "Cannot combine models and endpoints"

**Error:** Plugin has both `models` and `endpoints` in `plugins` section.

**Fix:** Same as above - separate into two plugins.

#### 4. "created_at cannot be in the future"

**Error:** Timestamp is later than current time (Marketplace validation).

**Fix:** Use current or past timestamp:

```yaml
created_at: "2024-12-01T00:00:00Z"  # Not future date
```

#### 5. "Missing privacy policy"

**Error:** Privacy field required for Marketplace submission.

**Fix:** Add privacy policy file:

```yaml
privacy: PRIVACY.md
```

#### 6. "Unsupported architecture"

**Error:** Architecture not in `["amd64", "arm64"]`.

**Fix:**
```yaml
meta:
  arch:
    - amd64
    - arm64
```

---

## References

- **Official Documentation:** [Plugin Info by Manifest](https://docs.dify.ai/plugin-dev-en/0411-plugin-info-by-manifest)
- **Example Plugins:** [dify-official-plugins](https://github.com/langgenius/dify-official-plugins)
- **Privacy Guidelines:** [Plugin Privacy Data Protection Guidelines](https://docs.dify.ai/plugin-dev-en/0312-privacy-protection-guidelines)
- **Semantic Versioning:** [semver.org](https://semver.org/)
- **RFC3339 Timestamps:** [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339)

---

## Changelog

### 2025-12-01
- Initial reference document created
- Complete schema with all 8 plugin types
- Permission reference tables
- 9 complete examples
- Validation rules and troubleshooting guide

---

**Maintained by:** Dify Community
**Last Review:** 2025-12-01
**License:** MIT (where applicable)
