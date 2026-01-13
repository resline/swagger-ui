---
name: dify-plugin-creator
description: Guide for creating Dify plugins. Use when users want to create, develop, or package Dify plugins (tools, models, extensions, datasources, or agent-strategies). Triggered by requests like "create a Dify plugin", "build a tool for Dify", "develop a custom model provider", "make a datasource plugin", or "package this as a .difypkg file". Use for scaffolding new plugins, implementing plugin components, or packaging plugins for distribution.
---

# Dify Plugin Creator

Guide for creating and packaging Dify plugins that extend Dify AI applications with custom capabilities.

## Plugin Types Decision Tree

Choose the plugin type based on what you want to extend:

```
What do you want to add to Dify?
│
├─ AI Model Provider (OpenAI, Anthropic, custom LLM, embeddings, etc.)
│  └─ → MODEL plugin
│
├─ Action/Function for Agents & Workflows (API call, data processing, etc.)
│  └─ → TOOL plugin
│
├─ External Data Source (Confluence, GitHub, S3, custom database, etc.)
│  └─ → DATASOURCE plugin
│
├─ HTTP Webhook Integration (Slack bot, external service, etc.)
│  └─ → EXTENSION plugin
│
└─ Custom Agent Reasoning Logic (Chain-of-Thought, ReAct, custom strategy)
   └─ → AGENT-STRATEGY plugin
```

### Plugin Type Details

**MODEL**: Package AI models as plugins
- Examples: OpenAI, Anthropic, Azure OpenAI, custom LLM endpoints
- Subtypes: LLM, Text Embedding, Rerank, TTS, Speech2Text, Moderation
- Use case: "I want to add support for a new AI model provider"

**TOOL**: Add specialized capabilities for Agents and Workflows
- Examples: Google Search, DuckDuckGo Search, Web Scraper, API integrations
- Use case: "I want agents to be able to call an external API"

**DATASOURCE**: Connect external data sources for knowledge retrieval
- Examples: Confluence, GitHub, Google Drive, custom databases
- Use case: "I want to import documents from an external system"

**EXTENSION**: Integrate external services via HTTP webhooks
- Examples: Slack bot, Discord bot, custom HTTP endpoints
- Use case: "I want to connect Dify to an external service"

**AGENT-STRATEGY**: Implement custom agent reasoning patterns
- Examples: Chain-of-Thought, Tree-of-Thoughts, ReAct, Function Calling
- Use case: "I want to create a custom agent reasoning strategy"

## Quick Start Workflow

### 1. Install Dify CLI

<details>
<summary>Mac Installation</summary>

```bash
brew tap langgenius/dify
brew install dify
dify version
```
</details>

<details>
<summary>Linux Installation</summary>

Download from [Dify GitHub releases](https://github.com/langgenius/dify-plugin-daemon/releases):

```bash
# Download latest dify binary for your architecture
chmod +x dify-plugin-*
sudo mv dify-plugin-* /usr/local/bin/dify
dify version
```
</details>

**Prerequisites**: Python ≥ 3.12

### 2. Initialize Plugin

```bash
dify plugin init
```

Answer the prompts:
- **Plugin name**: Lowercase with hyphens (e.g., `my-tool-plugin`)
- **Author**: Your name or organization (no spaces, e.g., `mycompany`)
- **Description**: What the plugin does
- **Type**: Choose from: `tool`, `llm`, `text-embedding`, `rerank`, `tts`, `speech2text`, `moderation`, `extension`, `agent-strategy`
- **Minimal Dify version**: Leave blank for latest

### 3. Develop Plugin

```bash
cd <plugin-name>
cp .env.example .env
# Edit .env with debug credentials from Dify UI
pip install -r requirements.txt
```

**Core files to implement**:
- `manifest.yaml` - Plugin metadata and configuration
- `main.py` - Entry point
- `provider/<name>.yaml` - Provider/tool/model configuration
- Plugin-specific files (see Plugin Structure below)

### 4. Test Plugin

```bash
python -m main
```

Plugin connects to Dify instance for remote debugging. Get credentials from:
Dify UI → Plugins → Debug icon → Copy API Key and Host Address

### 5. Package Plugin

```bash
dify plugin package
```

Creates `.difypkg` file for distribution. Install via:
Dify UI → Plugins → Install Plugin → Upload Plugin Package

## Plugin Structure Reference

### Verified Working Structure

This structure is **production-tested** and successfully installs on Dify:

```
plugin-name/
├── manifest.yaml          # Plugin metadata (REQUIRED)
├── main.py               # Entry point (REQUIRED)
├── requirements.txt      # Python dependencies
├── _assets/              # Icons directory (REQUIRED)
│   └── icon.svg         # Plugin icon (referenced as "icon.svg" in YAML)
├── provider/            # Provider configurations
│   ├── <name>.yaml      # Provider declaration
│   └── <name>.py        # Provider implementation
└── tools/               # For tool plugins
    ├── <tool>.yaml      # Tool declaration
    └── <tool>.py        # Tool implementation
```

### CRITICAL: Icon Path Resolution

**This is a common source of installation errors!**

```
YAML reference:     icon: icon.svg          ← Just the filename
Physical location:  _assets/icon.svg        ← Actual file location
```

- **In YAML files**: Use just `icon.svg` (or `icon.png`)
- **On disk**: Place the file in `_assets/icon.svg`
- **Dify automatically** resolves `icon.svg` to `_assets/icon.svg`

### Type-Specific Structures

**TOOL Plugin**:
```
tools/
├── <tool_name>.py       # Tool implementation
└── <tool_name>.yaml     # Tool schema
```

**MODEL Plugin**:
```
models/
├── llm/
│   └── <model_name>.py  # LLM implementation
├── text_embedding/
│   └── <model_name>.py  # Embedding implementation
└── <provider_name>.yaml # Provider config
```

**DATASOURCE Plugin**:
```
datasources/
├── <source_name>.py     # Datasource implementation
└── <source_name>.yaml   # Datasource schema
```

**EXTENSION Plugin**:
```
endpoints/
├── <endpoint_name>.py   # Endpoint implementation
└── <endpoint_name>.yaml # Endpoint schema
```

**AGENT-STRATEGY Plugin**:
```
agent_strategies/
├── <strategy_name>.py   # Strategy implementation
└── <strategy_name>.yaml # Strategy config
```

## Manifest.yaml Format

### Minimal Working Example (Tool Plugin)

```yaml
version: 0.0.1
type: plugin
author: mycompany
name: my_tool
label:
  en_US: My Tool
  zh_Hans: 我的工具
description:
  en_US: Tool description here
  zh_Hans: 工具描述
icon: icon.svg
resource:
  memory: 268435456
  permission: {}
plugins:
  tools:
    - provider/my_tool.yaml
meta:
  version: 0.0.1
  arch:
    - amd64
    - arm64
  runner:
    language: python
    version: "3.12"
    entrypoint: main
  minimum_dify_version: null
created_at: 2025-01-01T00:00:00+00:00
verified: false
```

### Key Fields Explained

| Field | Required | Description |
|-------|----------|-------------|
| `version` | Yes | Semantic version (e.g., "0.0.1") |
| `type` | Yes | Always `plugin` |
| `author` | Yes | Author identifier (snake_case, no spaces!) |
| `name` | Yes | Plugin identifier (snake_case) |
| `label` | Yes | Display names (min: en_US) |
| `description` | Yes | Plugin description (min: en_US) |
| `icon` | Yes | Icon filename (file in `_assets/`) |
| `resource.memory` | Yes | Memory limit in **raw bytes** (256MB = 268435456) |
| `resource.permission` | Yes | Use `{}` if no special permissions |
| `resource.permission.storage.size` | If storage | Storage limit in **raw bytes** (10MB = 10485760) |
| `plugins.<type>` | Yes | List of provider YAML paths |
| `meta.version` | Yes | Same as top-level version |
| `meta.arch` | Yes | Target architectures |
| `meta.runner` | Yes | Runtime config (Python 3.12) |
| `meta.minimum_dify_version` | No | Use `null` for any version |
| `created_at` | Yes | ISO 8601 timestamp with microseconds: `2025-01-10T00:00:00.000000+00:00` |
| `verified` | No | `false` for community plugins |

### CRITICAL: Memory and Size Values

**Values MUST be in raw bytes, NOT Kubernetes notation!**

```yaml
# ❌ WRONG - Will cause YAML unmarshal error
resource:
  memory: 256Mi
  permission:
    storage:
      size: 10Mi

# ✅ CORRECT - Raw bytes
resource:
  memory: 268435456      # 256 MB in bytes
  permission:
    storage:
      size: 10485760     # 10 MB in bytes
```

**Conversion Table:**
| Human Readable | Bytes (use this!) |
|----------------|-------------------|
| 1 KB | 1024 |
| 1 MB | 1048576 |
| 10 MB | 10485760 |
| 256 MB | 268435456 |
| 512 MB | 536870912 |
| 1 GB | 1073741824 |

### CRITICAL: Author Field Validation

**Author field must be snake_case without spaces or special characters!**

```yaml
# ❌ WRONG - Will cause "plugin_unique_identifier is not valid" error
author: "Orange Polska - Dify Team"
author: "My Company"
author: "john.doe"

# ✅ CORRECT - snake_case, lowercase
author: orangepolska
author: mycompany
author: terragon_labs
```

**Important**: The `author` field must be **identical** in:
- `manifest.yaml` (top-level)
- `provider/*.yaml` (identity.author)
- All `tools/*.yaml` files (identity.author)

### CRITICAL: created_at Format

**Use ISO 8601 format with microseconds and timezone:**

```yaml
# ✅ CORRECT format (6 decimal places + timezone)
created_at: 2025-01-10T00:00:00.000000+00:00

# ❌ WRONG - missing microseconds
created_at: 2025-01-10T00:00:00+00:00
```

### Permission Patterns

**No special permissions** (most tools):
```yaml
resource:
  permission: {}
```

**Tool with model access** (needs LLM):
```yaml
resource:
  permission:
    tool:
      enabled: true
    model:
      enabled: true
      llm: true
```

**Extension endpoint**:
```yaml
resource:
  permission:
    endpoint:
      enabled: true
```

## Implementation Guidelines

### Tool Plugin Pattern

**Provider YAML** (`provider/<tool_name>.yaml`):
```yaml
identity:
  author: mycompany
  name: my_tool
  label:
    en_US: My Tool
    zh_Hans: 我的工具
  description:
    en_US: Tool description
    zh_Hans: 工具描述
  icon: icon.svg
tools:
  - tools/my_tool_action.yaml
extra:
  python:
    source: provider/my_tool.py
```

**Tool YAML** (`tools/<tool_name>.yaml`):
```yaml
identity:
  name: my_tool_action
  author: mycompany
  label:
    en_US: My Tool Action
    zh_Hans: 我的工具操作
description:
  human:
    en_US: Human-readable description for UI
    zh_Hans: 给用户看的描述
  llm: Concise description for LLM to decide when to use this tool
parameters:
  - name: query
    type: string
    required: true
    form: llm                    # llm = visible to LLM agents
    label:
      en_US: Query
      zh_Hans: 查询
    human_description:
      en_US: User-facing description
      zh_Hans: 用户描述
    llm_description: Description for LLM context
    placeholder:
      en_US: "e.g., example input"
  - name: max_results
    type: number
    required: false
    form: form                   # form = UI only, hidden from LLM
    label:
      en_US: Max Results
    human_description:
      en_US: Maximum results to return
    llm_description: Maximum number of results
    default: 5
    min: 1
    max: 10
extra:
  python:
    source: tools/my_tool_action.py
```

**Parameter form types**:
- `form: llm` - Parameter visible to LLM agents (they can set it)
- `form: form` - Parameter only in UI form (hidden from LLM)

**Provider Implementation** (`provider/<tool_name>.py`):
```python
from typing import Any
from dify_plugin import ToolProvider
from dify_plugin.errors.tool import ToolProviderCredentialValidationError

class MyToolProvider(ToolProvider):
    def _validate_credentials(self, credentials: dict[str, Any]) -> None:
        """Validate credentials when provider is initialized."""
        try:
            # Validate API key or test connectivity
            # For public APIs: just test if reachable
            pass
        except Exception as e:
            raise ToolProviderCredentialValidationError(str(e)) from e
```

**Tool Implementation** (`tools/<tool_name>.py`):
```python
from typing import Any, Generator
from dify_plugin import Tool
from dify_plugin.entities.tool import ToolInvokeMessage

class MyToolAction(Tool):
    def _invoke(
        self,
        tool_parameters: dict[str, Any]
    ) -> Generator[ToolInvokeMessage, None, None]:
        """Execute the tool."""
        query = tool_parameters.get("query", "").strip()
        max_results = int(tool_parameters.get("max_results", 5))

        try:
            # Tool logic here
            result = {"query": query, "data": "..."}

            # Return JSON for workflows
            yield self.create_json_message(result)

            # Return text for humans
            yield self.create_text_message(f"Results for: {query}")

        except Exception as e:
            yield self.create_text_message(f"Error: {str(e)}")
```

### Model Plugin Pattern

**Model Implementation** (`models/llm/<model_name>.py`):
```python
from dify_plugin.entities.model import AIModelEntity
from dify_plugin.entities.model.llm import LLMResult
from collections.abc import Generator

class MyLLMModel(LargeLanguageModel):
    def _invoke(
        self,
        model: str,
        credentials: dict,
        prompt_messages: list[PromptMessage],
        model_parameters: dict,
        tools: list[PromptMessageTool] | None = None,
        stop: list[str] | None = None,
        stream: bool = True,
        user: str | None = None,
    ) -> LLMResult | Generator:
        # Model invocation logic
        pass
```

### Datasource Plugin Pattern

**Datasource Implementation** (`datasources/<source_name>.py`):
```python
from dify_plugin.interfaces.datasource import Datasource, DatasourceResult

class MyDatasource(Datasource):
    def fetch_data(self, credentials: dict, parameters: dict) -> DatasourceResult:
        # Fetch data from external source
        # Return documents for Dify knowledge base
        return DatasourceResult(
            documents=[
                {"content": "Document text", "metadata": {...}}
            ]
        )
```

## Packaging & Distribution

### Build .difypkg File

**Using Dify CLI** (recommended):
```bash
cd plugin-directory/
dify plugin package
```

**Using Python** (manual):
```python
import zipfile
import os

files = [
    'manifest.yaml',
    'main.py',
    'requirements.txt',
    '_assets/icon.svg',
    'provider/my_tool.yaml',
    'provider/my_tool.py',
    'tools/my_tool_action.yaml',
    'tools/my_tool_action.py',
]

with zipfile.ZipFile('my_tool.difypkg', 'w', zipfile.ZIP_DEFLATED) as zf:
    for f in files:
        if os.path.exists(f):
            zf.write(f, f)
```

**Using shell** (manual):
```bash
cd plugin-directory/
find . -type f \( -name "*.yaml" -o -name "*.py" -o -name "*.txt" -o -name "*.svg" -o -name "*.md" \) \
  ! -path "./.env*" ! -path "./__pycache__/*" | zip -@ ../my_tool.difypkg
```

### CRITICAL: Avoid Directory Entries in ZIP

Some ZIP tools create directory entries that cause Dify errors like:
```
PluginDaemonBadRequestError: read _assets: is a directory
PluginDaemonBadRequestError: read provider: is a directory
```

**Solutions**:

```bash
# ✅ Method 1: Use -D flag (no directory entries)
cd plugin-directory/
zip -r -D ../my_plugin.difypkg . -x "*.pyc" -x "__pycache__/*" -x ".env*" -x ".git/*"

# ✅ Method 2: Use find with -type f (files only)
find . -type f \( -name "*.yaml" -o -name "*.py" -o -name "*.txt" -o -name "*.svg" \) \
  ! -path "./.env*" ! -path "./__pycache__/*" | zip -@ ../my_plugin.difypkg

# ✅ Method 3: Python zipfile (automatic, no directories)
python -c "
import zipfile, os
with zipfile.ZipFile('my_plugin.difypkg', 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, _, files in os.walk('.'):
        for f in files:
            if not any(x in root for x in ['__pycache__', '.git', '.env']):
                path = os.path.join(root, f)
                zf.write(path, path[2:])  # Remove './' prefix
"
```

**Verify package contents** (no directory entries should appear):
```bash
unzip -l my_plugin.difypkg | head -20
# Should show only files, NOT lines ending with "/" like "_assets/"
```

### Installation Methods

**Via Dify UI**:
1. Navigate to Plugins → Install Plugin
2. Click "Local Package File"
3. Select `.difypkg` file
4. Configure credentials if needed

**Via Dify API** (programmatic):

```bash
# Step 1: Upload package
curl -X POST "https://api.dify.example.com/console/api/workspaces/current/plugin/upload/pkg" \
  -H "Cookie: access_token=...; csrf_token=..." \
  -H "x-csrf-token: ..." \
  -F "pkg=@my_tool.difypkg"

# Response contains: unique_identifier

# Step 2: Install uploaded package
curl -X POST "https://api.dify.example.com/console/api/workspaces/current/plugin/install/pkg" \
  -H "Cookie: access_token=...; csrf_token=..." \
  -H "x-csrf-token: ..." \
  -H "Content-Type: application/json" \
  -d '{"plugin_unique_identifiers": ["author/name:version@hash"]}'

# Step 3: Check installation status
curl "https://api.dify.example.com/console/api/workspaces/current/plugin/tasks/{task_id}" \
  -H "Cookie: access_token=...; csrf_token=..." \
  -H "x-csrf-token: ..."
```

## Common Installation Errors & Fixes

### Error: "file not found: icon.svg"
```
PluginDaemonBadRequestError: file not found: icon.svg
failed to remap tool icon
```
**Fix**:
- Place icon in `_assets/icon.svg`
- Reference in YAML as just `icon: icon.svg`

### Error: "read _assets: is a directory"
```
PluginDaemonBadRequestError: read _assets: is a directory
```
**Fix**: Package using `find -type f | zip` or Python zipfile (no directory entries)

### Error: "plugin_unique_identifier is not valid"
```
plugin_unique_identifier is not valid: My Company/plugin
```
**Fix**: Author name cannot have spaces. Use `mycompany` not `My Company`

### Error: "Failed to parse response from plugin daemon"
```
Failed to parse response from plugin daemon to PluginDaemonBasicResponse
```
**Fix**: Check manifest.yaml format:
- Use `permission: {}` not nested permission structure
- Add `verified: false`
- Use `minimum_dify_version: null` not a string

### Error: "yaml: unmarshal errors" for memory/size
```
yaml: unmarshal errors:
  line 31: cannot unmarshal !!str '256Mi' into int64
```
**Fix**: Use raw bytes, not Kubernetes notation:
```yaml
# ❌ WRONG
memory: 256Mi
storage.size: 10Mi

# ✅ CORRECT
memory: 268435456      # 256 MB
storage.size: 10485760 # 10 MB
```

### Error: "author field inconsistency"
```
plugin_unique_identifier is not valid: oldauthor/plugin_name
```
**Fix**: Ensure `author` is identical in ALL YAML files:
```bash
# Check all author fields
grep -r "author:" --include="*.yaml" .

# Fix all at once (replace OLD_AUTHOR with new)
find . -name "*.yaml" -exec sed -i 's/author: "OLD_AUTHOR"/author: newauthor/g' {} \;
find . -name "*.yaml" -exec sed -i 's/author: OLD_AUTHOR/author: newauthor/g' {} \;
```

### Error: "tags section not allowed in provider"
```
Failed to parse response from plugin daemon
```
**Fix**: Remove `tags` section from `provider/*.yaml` files. Tags are only for tool YAML files, not provider YAML:
```yaml
# ❌ WRONG in provider/my_tool.yaml
tags:
  - productivity

# ✅ CORRECT - remove tags section entirely from provider YAML
```

## Development Best Practices

1. **Start from examples**: Copy structure from official plugins in `plugins/dify-official-plugins/`
2. **Use proper types**: Import from `dify_plugin` package for type safety
3. **Handle errors**: Wrap external calls in try/except with meaningful error messages
4. **Support streaming**: Yield results incrementally when possible for better UX
5. **Test credentials**: Validate API keys and credentials in provider implementation
6. **Add multi-language support**: Include at minimum `en_US` and `zh_Hans` labels/descriptions
7. **Document parameters**: Provide both `human_description` and `llm_description` for clarity
8. **Test before packaging**: Run `python -m main` with remote debugging first

## Advanced Topics

### Environment Variables

Store in `.env` for local development:
```bash
INSTALL_METHOD=remote
REMOTE_INSTALL_HOST=your-dify-instance.com
REMOTE_INSTALL_PORT=5003
REMOTE_INSTALL_KEY=your-debug-key
```

### Multi-language Support

Supported locales (en_US is required):
```yaml
label:
  en_US: "English Label"        # Required
  zh_Hans: "中文标签"            # Chinese Simplified
  ja_JP: "日本語ラベル"          # Japanese
  pt_BR: "Etiqueta em Português" # Portuguese
```

### OAuth Integration

For tools requiring OAuth (see `references/tool-oauth.md` for complete guide):
1. Define OAuth config in provider YAML
2. Implement OAuth flow in tool implementation
3. Handle token refresh and storage

## Reference Documentation

For detailed implementation guides, see bundled references:

### Core References
- **Manifest Schema**: `references/manifest-schema.md` - Complete manifest.yaml specification
- **Tool Plugin Template**: `references/tool-plugin-template.md` - Full tool plugin scaffold with examples
- **Extension Plugin Template**: `references/extension-plugin-template.md` - Full extension plugin scaffold

### Type-Specific Guides
- **Tool OAuth**: `references/tool-oauth.md` - Complete OAuth integration guide
- **Model Schema**: `references/model-schema.md` - Model plugin specifications
- **Datasource Guide**: `references/datasource.md` - Datasource implementation patterns
- **Agent Strategy**: `references/agent-strategy.md` - Custom reasoning strategies

### Scripts
- **Init Plugin**: `scripts/init_plugin.py` - Generate plugin scaffold:
  ```bash
  python scripts/init_plugin.py my-tool --type tool --author "mycompany"
  python scripts/init_plugin.py my-bot --type extension
  ```

## Example Plugins

Study official examples in `/root/repo/plugins/dify-official-plugins/`:

**Tools**: `tools/bing/`, `tools/google/`, `tools/github/`
**Models**: `models/anthropic/`, `models/openai/`, `models/azure_openai/`
**Datasources**: `datasources/confluence_datasource/`, `datasources/github/`
**Extensions**: `extensions/slack_bot/`, `extensions/wecom_bot/`
**Agent Strategies**: `agent-strategies/cot_agent/`

**Tested Example**: `/root/repo/plugins/duckduckgo-search/` - Verified working structure

## Pre-Packaging Checklist

Run this checklist **before** creating `.difypkg` file:

### 1. Validate manifest.yaml
```bash
# Check memory/size are raw bytes (NOT 256Mi)
grep -E "memory:|size:" manifest.yaml

# ✅ Should show numbers like: memory: 268435456
# ❌ NOT strings like: memory: 256Mi
```

### 2. Validate author consistency
```bash
# All author fields must be identical
grep -rh "author:" --include="*.yaml" . | sort -u

# ✅ Should show only ONE unique author value
# ❌ If multiple values - fix before packaging
```

### 3. Validate created_at format
```bash
# Check timestamp format
grep "created_at:" manifest.yaml

# ✅ Should be: created_at: 2025-01-10T00:00:00.000000+00:00
# ❌ NOT: created_at: 2025-01-10T00:00:00+00:00 (missing microseconds)
```

### 4. Check icon exists
```bash
ls -la _assets/icon.svg
# File must exist in _assets/ directory
```

### 5. Validate YAML syntax
```bash
# Check all YAML files are valid
python -c "import yaml; import glob; [yaml.safe_load(open(f)) for f in glob.glob('**/*.yaml', recursive=True)]"
```

### 6. Test locally first
```bash
python -m main
# Should connect to Dify for remote debugging without errors
```

### 7. Verify no provider tags
```bash
# Provider YAML should NOT have tags section
grep -l "tags:" provider/*.yaml
# ✅ No output = good
# ❌ If files listed - remove tags section
```

## Installation Verification

After uploading `.difypkg` to Dify, verify installation:

### 1. Check Plugin List
- Navigate to **Plugins** page
- Plugin should appear with correct:
  - Name and icon
  - Author name
  - Version number

### 2. Check Plugin Details
- Click on plugin
- Verify all tools/models are listed
- Check credentials form appears (if applicable)

### 3. Test in Workflow
- Create new workflow/agent
- Add plugin tool
- Execute with test parameters
- Verify output is correct

### 4. Check Logs (if errors)
```bash
# Docker/local deployment
docker logs dify-plugin-daemon 2>&1 | tail -50

# Kubernetes deployment
kubectl logs -l app=dify-plugin-daemon --tail=50
```

### 5. Common Post-Installation Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Plugin shows but tools missing | Provider YAML not in `plugins.tools` | Add path to manifest.yaml `plugins.tools` |
| Credentials form empty | Provider YAML missing `credentials` | Add credentials section |
| Tool execution fails | Python import error | Check requirements.txt, rebuild package |
| Tool not visible in agent | Wrong `form: llm` setting | Set parameter `form: llm` |

## Troubleshooting

**Plugin won't connect for debugging**:
- Verify `.env` has correct `REMOTE_INSTALL_KEY` and `REMOTE_INSTALL_HOST`
- Check Dify instance allows remote plugin debugging
- Ensure Python version ≥ 3.12

**Import errors**:
- Run `pip install -r requirements.txt`
- Ensure `dify-plugin-sdk` is installed

**Packaging fails**:
- Verify `manifest.yaml` syntax is valid YAML
- Check all required files exist (manifest.yaml, main.py)
- Ensure plugin name matches directory name

**Plugin not appearing in Dify**:
- Check plugin type in manifest matches what you're building
- Verify `plugins` section in manifest.yaml lists correct provider files
- Review Dify logs for installation errors
