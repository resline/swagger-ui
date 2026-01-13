#!/usr/bin/env python3
"""
Dify Plugin Initializer

Creates a complete plugin scaffold based on plugin type.
Usage: python init_plugin.py <plugin-name> --type <tool|extension|model|datasource|agent-strategy> [--output <dir>]

Example:
    python init_plugin.py my-search-tool --type tool --output ./plugins
    python init_plugin.py slack-bot --type extension
"""

import argparse
import os
import re
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path

# Plugin type templates
PLUGIN_TYPES = {
    "tool": {
        "description": "Tool plugin for integrating APIs and services",
        "directories": ["provider", "tools", "_assets"],
        "needs_credentials": False,  # Default: no credentials (public APIs)
        "plugins_key": "tools",
    },
    "extension": {
        "description": "Extension plugin for HTTP webhooks and endpoints",
        "directories": ["group", "endpoints", "_assets"],
        "needs_credentials": False,
        "plugins_key": "endpoints",
    },
    "model": {
        "description": "Model plugin for AI model providers",
        "directories": ["provider", "models/llm", "_assets"],
        "needs_credentials": True,
        "plugins_key": "models",
    },
    "datasource": {
        "description": "Datasource plugin for external data integration",
        "directories": ["provider", "datasources", "_assets"],
        "needs_credentials": True,
        "plugins_key": "datasources",
    },
    "agent-strategy": {
        "description": "Agent strategy plugin for custom reasoning",
        "directories": ["provider", "agent_strategies", "_assets"],
        "needs_credentials": False,
        "plugins_key": "agent_strategies",
    },
}


def create_manifest(plugin_name: str, plugin_type: str, author: str, needs_credentials: bool = False) -> str:
    """Generate manifest.yaml content.

    Key points for valid manifest:
    - Use permission: {} when no special permissions needed
    - Author cannot contain spaces
    - Icon reference is just filename (file lives in _assets/)
    - Add verified: false and minimum_dify_version: null
    """
    config = PLUGIN_TYPES[plugin_type]
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000000+00:00")
    name = plugin_name.replace('-', '_')

    # Provider path based on type
    provider_path = f"provider/{name}.yaml"
    if plugin_type == "extension":
        provider_path = f"group/{name}.yaml"

    # Simple permission structure - use {} for most plugins
    permission_section = "  permission: {}"

    # Only add complex permissions for model plugins that need LLM access
    if plugin_type in ["model", "agent-strategy"]:
        permission_section = """  permission:
    model:
      enabled: true
      llm: true"""
    elif plugin_type == "extension":
        permission_section = """  permission:
    endpoint:
      enabled: true"""

    return f'''version: 0.0.1
type: plugin
author: {author}
name: {name}
label:
  en_US: {plugin_name.replace('-', ' ').title()}
  zh_Hans: {plugin_name.replace('-', ' ').title()}
description:
  en_US: {config['description']}
  zh_Hans: {config['description']}
icon: icon.svg
resource:
  memory: 268435456
{permission_section}
plugins:
  {config['plugins_key']}:
    - {provider_path}
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
created_at: {timestamp}
verified: false
'''


def create_main_py(plugin_name: str) -> str:
    """Generate main.py content."""
    return f'''"""
{plugin_name} - Dify Plugin
"""

from dify_plugin import Plugin, DifyPluginEnv

plugin = Plugin(DifyPluginEnv(MAX_REQUEST_TIMEOUT=120))

if __name__ == "__main__":
    plugin.run()
'''


def create_requirements() -> str:
    """Generate requirements.txt content."""
    return '''dify_plugin>=0.3.0,<0.5.0
requests>=2.31.0
'''


def create_env_example() -> str:
    """Generate .env.example content."""
    return '''# Remote debugging configuration
INSTALL_METHOD=remote
REMOTE_INSTALL_HOST=your-dify-instance.com
REMOTE_INSTALL_PORT=5003
REMOTE_INSTALL_KEY=your-debug-key
'''


def create_tool_provider_yaml(plugin_name: str, author: str, needs_credentials: bool = False) -> str:
    """Generate tool provider YAML.

    Simple structure without tags or unnecessary fields.
    Icon reference is just the filename - Dify resolves to _assets/.
    """
    name = plugin_name.replace('-', '_')

    # Minimal provider structure
    content = f'''identity:
  author: {author}
  name: {name}
  label:
    en_US: {plugin_name.replace('-', ' ').title()}
    zh_Hans: {plugin_name.replace('-', ' ').title()}
  description:
    en_US: TODO: Add provider description
    zh_Hans: TODO: 添加提供商描述
  icon: icon.svg
tools:
  - tools/{name}_action.yaml
extra:
  python:
    source: provider/{name}.py
'''
    return content


def create_tool_provider_py(plugin_name: str, needs_credentials: bool = False) -> str:
    """Generate tool provider Python implementation."""
    name = plugin_name.replace('-', '_')
    class_name = ''.join(word.title() for word in plugin_name.split('-')) + 'Provider'

    if needs_credentials:
        validation = '''        if not credentials.get("api_key"):
            raise ToolProviderCredentialValidationError("API key is required")

        # TODO: Add actual credential validation
        # Example: Make a test API call to verify the key works'''
    else:
        validation = '''        # No credentials required for this provider
        # For public APIs, test connectivity here
        try:
            # Example: requests.get("https://api.example.com/health", timeout=5)
            pass
        except Exception as e:
            raise ToolProviderCredentialValidationError(f"Cannot reach API: {e}") from e'''

    return f'''"""
{plugin_name} Provider
"""

from typing import Any
from dify_plugin import ToolProvider
from dify_plugin.errors.tool import ToolProviderCredentialValidationError


class {class_name}(ToolProvider):
    """Tool provider for {plugin_name}."""

    def _validate_credentials(self, credentials: dict[str, Any]) -> None:
        """Validate provider credentials."""
{validation}
'''


def create_tool_yaml(plugin_name: str, author: str) -> str:
    """Generate tool YAML.

    Key points:
    - form: llm = parameter visible to LLM agents
    - form: form = parameter only in UI (hidden from LLM)
    - Separate human and llm descriptions
    """
    name = plugin_name.replace('-', '_')
    return f'''identity:
  name: {name}_action
  author: {author}
  label:
    en_US: {plugin_name.replace('-', ' ').title()} Action
    zh_Hans: {plugin_name.replace('-', ' ').title()} 操作

description:
  human:
    en_US: TODO: Add tool description for users
    zh_Hans: TODO: 添加用户工具描述
  llm: TODO: Add concise tool description for LLM agents

parameters:
  - name: query
    type: string
    required: true
    form: llm
    label:
      en_US: Query
      zh_Hans: 查询
    human_description:
      en_US: The query or input for this tool
      zh_Hans: 此工具的查询或输入
    llm_description: The input query to process
    placeholder:
      en_US: e.g., example input

  - name: max_results
    type: number
    required: false
    form: form
    label:
      en_US: Max Results
      zh_Hans: 最大结果数
    human_description:
      en_US: Maximum number of results (1-10)
      zh_Hans: 最大结果数 (1-10)
    llm_description: Maximum number of results to return
    default: 5
    min: 1
    max: 10

extra:
  python:
    source: tools/{name}_action.py
'''


def create_tool_py(plugin_name: str, needs_credentials: bool = False) -> str:
    """Generate tool Python implementation."""
    name = plugin_name.replace('-', '_')
    class_name = ''.join(word.title() for word in plugin_name.split('-')) + 'ActionTool'

    credential_check = ""
    if needs_credentials:
        credential_check = '''
        # Get credentials
        api_key = self.runtime.credentials.get("api_key")
        if not api_key:
            yield self.create_text_message("API key is missing")
            return
'''

    return f'''"""
{plugin_name} Tool
"""

from typing import Any, Generator
from dify_plugin import Tool
from dify_plugin.entities.tool import ToolInvokeMessage


class {class_name}(Tool):
    """Tool implementation for {plugin_name}."""

    def _invoke(
        self,
        tool_parameters: dict[str, Any]
    ) -> Generator[ToolInvokeMessage, None, None]:
        """Execute the tool."""
{credential_check}
        # Get parameters
        query = tool_parameters.get("query", "").strip()
        max_results = int(tool_parameters.get("max_results", 5))

        if not query:
            yield self.create_text_message("Query is required")
            return

        try:
            # TODO: Implement your tool logic here
            result = {{
                "query": query,
                "max_results": max_results,
                "data": "TODO: Add actual results"
            }}

            # Return JSON for workflows
            yield self.create_json_message(result)

            # Return formatted text for humans
            yield self.create_text_message(f"Results for: {{query}}")

        except Exception as e:
            yield self.create_text_message(f"Error: {{str(e)}}")
'''


def create_extension_group_yaml(plugin_name: str, author: str) -> str:
    """Generate extension group YAML."""
    name = plugin_name.replace('-', '_')
    return f'''settings:
  api_key:
    type: secret-input
    required: false
    label:
      en_US: API Key
      zh_Hans: API 密钥
    placeholder:
      en_US: Optional: Enter your API key
      zh_Hans: 可选：输入您的 API 密钥

endpoints:
  - endpoints/{name}_webhook.yaml
'''


def create_extension_endpoint_yaml(plugin_name: str) -> str:
    """Generate extension endpoint YAML."""
    name = plugin_name.replace('-', '_')
    return f'''path: "/webhook/<app_id>"
method: "POST"

extra:
  python:
    source: endpoints/{name}_webhook.py
'''


def create_extension_endpoint_py(plugin_name: str) -> str:
    """Generate extension endpoint Python implementation."""
    class_name = ''.join(word.title() for word in plugin_name.split('-')) + 'WebhookEndpoint'
    return f'''"""
{plugin_name} Webhook Endpoint
"""

from typing import Mapping
from werkzeug import Request, Response
from dify_plugin import Endpoint
import json


class {class_name}(Endpoint):
    """Webhook endpoint for {plugin_name}."""

    def _invoke(
        self,
        r: Request,
        values: Mapping,
        settings: Mapping
    ) -> Response:
        """Handle incoming webhook request."""

        # Get path parameters
        app_id = values.get("app_id")

        # Get settings
        api_key = settings.get("api_key")

        # Parse request body
        data = r.json if r.is_json else {{}}

        try:
            # TODO: Implement your endpoint logic here
            result = {{
                "status": "received",
                "app_id": app_id,
                "data": data
            }}

            return Response(
                response=json.dumps(result),
                status=200,
                content_type="application/json"
            )

        except Exception as e:
            return Response(
                response=json.dumps({{"error": str(e)}}),
                status=500,
                content_type="application/json"
            )
'''


def create_icon_svg() -> str:
    """Generate a simple placeholder icon.

    This file should be placed in _assets/icon.svg
    but referenced in YAML as just 'icon.svg'
    """
    return '''<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <rect x="3" y="3" width="18" height="18" rx="2" fill="#4A90D9"/>
  <circle cx="12" cy="12" r="4" fill="#FFFFFF"/>
</svg>
'''


def package_plugin(plugin_dir: Path, output_file: str = None) -> str:
    """Package a plugin directory into a .difypkg file.

    Uses Python zipfile to avoid directory entry issues that cause
    'read _assets: is a directory' errors in Dify.
    """
    if output_file is None:
        output_file = f"{plugin_dir.name.replace('-', '_')}.difypkg"

    output_path = plugin_dir.parent / output_file

    # Collect all files (excluding __pycache__, .env, etc.)
    exclude_patterns = [
        '__pycache__',
        '.env',
        '.git',
        '*.pyc',
        '.DS_Store',
    ]

    files_to_package = []
    for root, dirs, files in os.walk(plugin_dir):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if not any(p in d for p in exclude_patterns)]

        for file in files:
            # Skip excluded files
            if any(file.endswith(p.replace('*', '')) for p in exclude_patterns if '*' in p):
                continue
            if file in exclude_patterns:
                continue

            full_path = Path(root) / file
            rel_path = full_path.relative_to(plugin_dir)
            files_to_package.append((full_path, str(rel_path)))

    # Create ZIP without directory entries
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for full_path, rel_path in files_to_package:
            zf.write(full_path, rel_path)
            print(f"  Added: {rel_path}")

    print(f"\n✅ Package created: {output_path}")
    print(f"   Size: {output_path.stat().st_size} bytes")
    return str(output_path)


def init_plugin(plugin_name: str, plugin_type: str, output_dir: str, author: str, needs_credentials: bool = False):
    """Initialize a new plugin with the given parameters."""

    if plugin_type not in PLUGIN_TYPES:
        print(f"Error: Unknown plugin type '{plugin_type}'")
        print(f"Valid types: {', '.join(PLUGIN_TYPES.keys())}")
        sys.exit(1)

    # Validate author name (no spaces)
    if ' ' in author:
        print(f"Warning: Author name '{author}' contains spaces.")
        author = author.replace(' ', '-').lower()
        print(f"         Using '{author}' instead (spaces cause installation errors)")

    # Create plugin directory
    plugin_dir = Path(output_dir) / plugin_name

    if plugin_dir.exists():
        print(f"Error: Directory '{plugin_dir}' already exists")
        sys.exit(1)

    plugin_dir.mkdir(parents=True)
    print(f"Creating {plugin_type} plugin: {plugin_name}")

    # Create subdirectories
    config = PLUGIN_TYPES[plugin_type]
    for subdir in config["directories"]:
        (plugin_dir / subdir).mkdir(parents=True, exist_ok=True)

    # Create common files
    (plugin_dir / "manifest.yaml").write_text(
        create_manifest(plugin_name, plugin_type, author, needs_credentials)
    )
    (plugin_dir / "main.py").write_text(create_main_py(plugin_name))
    (plugin_dir / "requirements.txt").write_text(create_requirements())
    (plugin_dir / ".env.example").write_text(create_env_example())
    (plugin_dir / "_assets" / "icon.svg").write_text(create_icon_svg())

    name = plugin_name.replace('-', '_')

    # Create type-specific files
    if plugin_type == "tool":
        (plugin_dir / "provider" / f"{name}.yaml").write_text(
            create_tool_provider_yaml(plugin_name, author, needs_credentials)
        )
        (plugin_dir / "provider" / f"{name}.py").write_text(
            create_tool_provider_py(plugin_name, needs_credentials)
        )
        (plugin_dir / "tools" / f"{name}_action.yaml").write_text(
            create_tool_yaml(plugin_name, author)
        )
        (plugin_dir / "tools" / f"{name}_action.py").write_text(
            create_tool_py(plugin_name, needs_credentials)
        )

    elif plugin_type == "extension":
        (plugin_dir / "group" / f"{name}.yaml").write_text(
            create_extension_group_yaml(plugin_name, author)
        )
        (plugin_dir / "endpoints" / f"{name}_webhook.yaml").write_text(
            create_extension_endpoint_yaml(plugin_name)
        )
        (plugin_dir / "endpoints" / f"{name}_webhook.py").write_text(
            create_extension_endpoint_py(plugin_name)
        )

    # For other types, create placeholder files
    elif plugin_type == "model":
        (plugin_dir / "provider" / f"{name}.yaml").write_text(
            f"# TODO: Add model provider configuration\n# See references/model-schema.md for details\n"
        )
        (plugin_dir / "provider" / f"{name}.py").write_text(
            f'"""\n{plugin_name} Model Provider\nTODO: Implement model provider\n"""\n'
        )
        (plugin_dir / "models" / "llm" / f"{name}.py").write_text(
            f'"""\n{plugin_name} LLM Model\nTODO: Implement LLM model\n"""\n'
        )

    elif plugin_type == "datasource":
        (plugin_dir / "provider" / f"{name}.yaml").write_text(
            f"# TODO: Add datasource provider configuration\n# See references/datasource.md for details\n"
        )
        (plugin_dir / "datasources" / f"{name}.py").write_text(
            f'"""\n{plugin_name} Datasource\nTODO: Implement datasource\n"""\n'
        )

    elif plugin_type == "agent-strategy":
        (plugin_dir / "provider" / f"{name}.yaml").write_text(
            f"# TODO: Add agent strategy configuration\n# See references/agent-strategy.md for details\n"
        )
        (plugin_dir / "agent_strategies" / f"{name}.py").write_text(
            f'"""\n{plugin_name} Agent Strategy\nTODO: Implement agent strategy\n"""\n'
        )

    print(f"\n✅ Plugin initialized successfully at: {plugin_dir}")
    print(f"\nStructure:")
    print(f"  {plugin_dir}/")
    print(f"  ├── manifest.yaml")
    print(f"  ├── main.py")
    print(f"  ├── requirements.txt")
    print(f"  ├── _assets/")
    print(f"  │   └── icon.svg      ← Referenced as 'icon.svg' in YAML")
    print(f"  └── provider/tools/...")
    print(f"\nNext steps:")
    print(f"  1. cd {plugin_dir}")
    print(f"  2. Edit manifest.yaml and provider files")
    print(f"  3. Implement your {'tool' if plugin_type == 'tool' else 'endpoint' if plugin_type == 'extension' else plugin_type} logic")
    print(f"  4. Configure .env for remote debugging")
    print(f"  5. Run: python main.py")
    print(f"  6. Package: python init_plugin.py --package {plugin_dir}")


def main():
    parser = argparse.ArgumentParser(
        description="Initialize a new Dify plugin scaffold",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Plugin Types:
  tool            - Integrate external APIs and services
  extension       - Create HTTP webhooks and endpoints
  model           - Add custom AI model providers
  datasource      - Connect external data sources
  agent-strategy  - Implement custom agent reasoning

Examples:
  # Create new tool plugin
  python init_plugin.py my-search-tool --type tool

  # Create with custom author and output
  python init_plugin.py slack-bot --type extension --output ./my-plugins --author mycompany

  # Package existing plugin
  python init_plugin.py --package ./my-search-tool
"""
    )

    parser.add_argument("name", nargs="?", help="Plugin name (use hyphens, e.g., my-search-tool)")
    parser.add_argument(
        "--type", "-t",
        choices=list(PLUGIN_TYPES.keys()),
        help="Plugin type"
    )
    parser.add_argument(
        "--output", "-o",
        default=".",
        help="Output directory (default: current directory)"
    )
    parser.add_argument(
        "--author", "-a",
        default="mycompany",
        help="Author name (no spaces! default: 'mycompany')"
    )
    parser.add_argument(
        "--credentials",
        action="store_true",
        help="Plugin requires API credentials"
    )
    parser.add_argument(
        "--package", "-p",
        metavar="DIR",
        help="Package an existing plugin directory into .difypkg"
    )

    args = parser.parse_args()

    # Handle packaging mode
    if args.package:
        plugin_dir = Path(args.package)
        if not plugin_dir.exists():
            print(f"Error: Directory '{plugin_dir}' does not exist")
            sys.exit(1)
        if not (plugin_dir / "manifest.yaml").exists():
            print(f"Error: '{plugin_dir}' does not appear to be a plugin (no manifest.yaml)")
            sys.exit(1)
        package_plugin(plugin_dir)
        return

    # Handle init mode
    if not args.name or not args.type:
        parser.print_help()
        print("\nError: Plugin name and type are required for initialization")
        sys.exit(1)

    # Validate plugin name
    if not re.match(r'^[a-z][a-z0-9-]*$', args.name):
        print("Error: Plugin name should be lowercase with hyphens (e.g., my-tool)")
        sys.exit(1)

    init_plugin(args.name, args.type, args.output, args.author, args.credentials)


if __name__ == "__main__":
    main()
