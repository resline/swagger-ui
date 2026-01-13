# Dify Tool Plugin Template

This template provides a complete structure for creating a tool plugin for Dify. A tool plugin allows you to integrate external APIs, services, or custom functionality into Dify workflows and agents.

## Plugin Directory Structure

```
{{PLUGIN_NAME}}/
├── manifest.yaml              # Plugin metadata and configuration
├── main.py                    # Plugin entry point
├── requirements.txt           # Python dependencies
├── _assets/                   # Assets directory (CRITICAL: underscore prefix!)
│   └── icon.svg               # Plugin icon (file here, referenced as "icon.svg" in YAML)
├── provider/
│   ├── {{PROVIDER_NAME}}.yaml # Provider configuration (credentials, tools list)
│   └── {{PROVIDER_NAME}}.py   # Provider implementation (credential validation)
└── tools/
    ├── {{TOOL_NAME}}.yaml     # Tool configuration (parameters, descriptions)
    └── {{TOOL_NAME}}.py       # Tool implementation (main logic)
```

### CRITICAL: Icon Path Resolution

The icon file placement is **one of the most common sources of installation errors**:

1. **File location**: `_assets/icon.svg` (inside `_assets/` directory)
2. **YAML reference**: Just `icon.svg` (NOT `_assets/icon.svg`)
3. **Dify resolution**: Dify automatically looks in `_assets/` when icon path doesn't contain `/`

```yaml
# In manifest.yaml and provider YAML:
icon: icon.svg   # ✅ CORRECT - Dify resolves to _assets/icon.svg

icon: _assets/icon.svg  # ❌ WRONG - Results in "file not found" error
```

---

## File Templates

### 1. manifest.yaml

Main plugin manifest that defines metadata, resources, and plugin type.

**IMPORTANT**: The manifest format shown below is based on production-tested plugins. Key points:
- `author`: No spaces allowed (e.g., `terragonlabs` not `Terragon Labs`)
- `icon`: Reference as `icon.svg`, file in `_assets/icon.svg`
- `permission: {}`: Use empty object for simple plugins
- `verified: false` and `minimum_dify_version: null`: Required fields

```yaml
# Plugin version (semantic versioning)
version: 0.0.1

# Plugin type - always "plugin" for tool plugins
type: plugin

# Author information (NO SPACES - e.g., "mycompany" not "My Company")
author: {{AUTHOR_NAME}}

# Unique plugin identifier (lowercase, underscores, no spaces)
name: {{PLUGIN_NAME}}

# Display name (multi-language support)
label:
  en_US: {{PLUGIN_DISPLAY_NAME}}
  zh_Hans: {{插件显示名称}}

# Plugin description (multi-language support)
description:
  en_US: {{PLUGIN_DESCRIPTION_EN}}
  zh_Hans: {{插件描述_中文}}

# Icon file - IMPORTANT: File in _assets/icon.svg, referenced as just "icon.svg"
icon: icon.svg

# Resource limits for the plugin runtime
resource:
  # Memory limit in bytes (268435456 = 256MB, recommended default)
  memory: 268435456
  # Permissions - use empty object {} for simple plugins
  # For advanced permissions, see manifest-schema.md
  permission: {}

# Plugin components - list of provider YAML files
plugins:
  tools:
    - provider/{{PROVIDER_NAME}}.yaml

# Runtime metadata
meta:
  # Manifest schema version (always 0.0.1)
  version: 0.0.1
  # Supported architectures
  arch:
    - amd64
    - arm64
  # Runtime configuration
  runner:
    language: python
    version: "3.12"
    entrypoint: main
  # Minimum Dify version (null if no requirement)
  minimum_dify_version: null

# Plugin creation date (ISO 8601 / RFC3339 format)
created_at: {{CREATED_AT}}

# Verification status (always false for new plugins)
verified: false
```

#### Minimal Working Manifest (Copy-Paste Ready)

This exact format has been tested and confirmed working:

```yaml
version: 0.0.1
type: plugin
author: yourorg
name: your_plugin_name
label:
  en_US: Your Plugin Name
  zh_Hans: 你的插件名称
description:
  en_US: Description of what your plugin does.
  zh_Hans: 插件功能描述。
icon: icon.svg
resource:
  memory: 268435456
  permission: {}
plugins:
  tools:
    - provider/your_provider.yaml
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
created_at: 2025-01-01T00:00:00.000000+00:00
verified: false
```

---

### 2. main.py

Plugin entry point that initializes and runs the plugin.

```python
"""
{{PLUGIN_NAME}} - Dify Tool Plugin
{{PLUGIN_DESCRIPTION}}

Author: {{AUTHOR_NAME}}
Version: 0.1.0
"""

from dify_plugin import Plugin, DifyPluginEnv

# Initialize plugin with environment configuration
# MAX_REQUEST_TIMEOUT: Maximum time (seconds) for tool execution
# Adjust based on your tool's expected execution time
plugin = Plugin(DifyPluginEnv(MAX_REQUEST_TIMEOUT=120))

# Entry point for plugin execution
if __name__ == "__main__":
    plugin.run()
```

---

### 3. requirements.txt

Python package dependencies.

```txt
# Dify Plugin SDK (required)
# Version range: >= 0.3.0, < 0.5.0
dify_plugin>=0.3.0,<0.5.0

# Your custom dependencies below
# Example: API client libraries
# {{DEPENDENCY_NAME}}=={{VERSION}}

# Common dependencies you might need:
# requests==2.31.0          # HTTP requests
# pydantic==2.5.0           # Data validation
# loguru==0.7.2             # Logging (already included in dify_plugin)
# python-dateutil==2.8.2    # Date/time utilities

# Add your specific dependencies here
{{CUSTOM_DEPENDENCY_1}}
{{CUSTOM_DEPENDENCY_2}}
```

---

### 4. provider/{{PROVIDER_NAME}}.yaml

Provider configuration including credentials and tool definitions.

**IMPORTANT**: Icon path uses the same rule - file in `_assets/icon.svg`, referenced as `icon.svg`.

```yaml
# Provider identity
identity:
  # Author name (NO SPACES)
  author: {{AUTHOR_NAME}}

  # Provider unique name (must match filename without .yaml)
  name: {{PROVIDER_NAME}}

  # Display name (multi-language)
  label:
    en_US: {{PROVIDER_DISPLAY_NAME}}
    zh_Hans: {{提供商显示名称}}

  # Provider description (multi-language)
  description:
    en_US: {{PROVIDER_DESCRIPTION_EN}}
    zh_Hans: {{提供商描述_中文}}

  # Icon file - same as manifest: file in _assets/, referenced without path
  icon: icon.svg

# Credential definitions for the provider
# These are configured by users in Dify UI
credentials_for_provider:
  # Example: API Key credential
  {{CREDENTIAL_NAME_1}}:
    # Credential type
    # Options: secret-input (hidden text), text-input (visible text), select (dropdown)
    type: secret-input

    # Whether this credential is required
    required: true

    # Display label (multi-language)
    label:
      en_US: "{{CREDENTIAL_LABEL_EN}}"
      zh_Hans: "{{凭证标签_中文}}"

    # Placeholder text (multi-language)
    placeholder:
      en_US: "Please input your {{CREDENTIAL_NAME}}"
      zh_Hans: "请输入您的{{凭证名称}}"

    # Help text (multi-language)
    help:
      en_US: "Get your API key from {{SERVICE_NAME}}"
      zh_Hans: "从{{服务名称}}获取您的 API key"

    # Optional: URL to credential documentation/acquisition page
    url: "{{CREDENTIAL_ACQUISITION_URL}}"

  # Example: Optional text credential
  {{CREDENTIAL_NAME_2}}:
    type: text-input
    required: false
    label:
      en_US: "{{OPTIONAL_CREDENTIAL_LABEL}}"
    placeholder:
      en_US: "Optional: specify {{PARAMETER_NAME}}"
    default: "{{DEFAULT_VALUE}}"

  # Example: Select dropdown credential
  {{CREDENTIAL_NAME_3}}:
    type: select
    required: false
    label:
      en_US: "{{SELECT_LABEL}}"
    options:
      - value: "option1"
        label:
          en_US: "Option 1"
      - value: "option2"
        label:
          en_US: "Option 2"
    default: "option1"

# List of tools provided by this provider
tools:
  - tools/{{TOOL_NAME_1}}.yaml
  - tools/{{TOOL_NAME_2}}.yaml
  # Add more tools as needed

# Extra configuration
extra:
  # Python-specific configuration
  python:
    # Path to provider implementation (relative to plugin root)
    source: provider/{{PROVIDER_NAME}}.py
```

---

### 5. provider/{{PROVIDER_NAME}}.py

Provider implementation with credential validation.

```python
"""
{{PROVIDER_NAME}} Provider
Handles credential validation and provider-level operations.
"""

from typing import Any
from dify_plugin import ToolProvider
from dify_plugin.errors.tool import ToolProviderCredentialValidationError

# Import your tool classes
from tools.{{TOOL_NAME}} import {{ToolClassName}}


class {{ProviderClassName}}(ToolProvider):
    """
    Tool provider for {{PROVIDER_DISPLAY_NAME}}.

    This class handles credential validation by attempting to invoke
    a tool with test parameters.
    """

    def _validate_credentials(self, credentials: dict[str, Any]) -> None:
        """
        Validate provider credentials.

        This method is called when a user configures credentials in Dify UI.
        It should verify that the credentials are valid by making a test API call.

        Args:
            credentials: Dictionary of credential values keyed by credential name
                         Example: {"api_key": "sk-xxx", "endpoint": "https://..."}

        Raises:
            ToolProviderCredentialValidationError: If credentials are invalid

        Best Practices:
        1. Check for required credentials first
        2. Make a lightweight API call to verify credentials
        3. Provide clear error messages for different failure scenarios
        4. Don't expose sensitive information in error messages
        """

        # Step 1: Validate required credentials are present
        if not credentials.get("{{CREDENTIAL_NAME_1}}"):
            raise ToolProviderCredentialValidationError(
                "{{CREDENTIAL_LABEL}} is missing. Please provide a valid {{CREDENTIAL_TYPE}}."
            )

        # Step 2: Attempt to validate credentials by invoking a tool
        # This is the recommended pattern - invoke one of your tools with minimal parameters
        try:
            # Create tool instance from credentials
            tool = {{ToolClassName}}.from_credentials(credentials)

            # Invoke tool with test parameters
            # Use minimal parameters that will execute quickly
            result_generator = tool.invoke(
                tool_parameters={
                    "{{REQUIRED_PARAM}}": "{{TEST_VALUE}}",
                    # Add other required parameters with test values
                }
            )

            # Get first result to verify execution
            first_result = next(result_generator)

            # Check result type - TEXT usually indicates an error
            if first_result.type == first_result.MessageType.TEXT:
                # Tool returned text message - likely an error
                raise ToolProviderCredentialValidationError(str(first_result.message))

            # If we got here, credentials are valid
            # The tool successfully executed and returned a non-error result

        except StopIteration:
            # Generator was empty - unexpected state
            raise ToolProviderCredentialValidationError(
                "Validation check failed: tool invocation produced no output. "
                "Please check your credentials and try again."
            )

        except ToolProviderCredentialValidationError:
            # Re-raise our validation errors as-is
            raise

        except Exception as e:
            # Catch any other exceptions and convert to validation error
            # Common cases: network errors, API errors, invalid responses
            raise ToolProviderCredentialValidationError(
                f"Credential validation failed: {str(e)}"
            ) from e


# Alternative validation approach: Direct API call
class {{ProviderClassName}}Alternative(ToolProvider):
    """
    Alternative implementation using direct API validation.
    Use this if you want to validate credentials without invoking a full tool.
    """

    def _validate_credentials(self, credentials: dict[str, Any]) -> None:
        """
        Validate credentials by making a direct API call.
        """
        import requests

        # Check required credentials
        api_key = credentials.get("{{CREDENTIAL_NAME_1}}")
        if not api_key:
            raise ToolProviderCredentialValidationError("API key is required")

        try:
            # Make a lightweight API call (e.g., get account info, ping endpoint)
            response = requests.get(
                "{{API_VALIDATION_ENDPOINT}}",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    # Add other required headers
                },
                timeout=10
            )

            # Check response status
            if response.status_code == 401:
                raise ToolProviderCredentialValidationError(
                    "Invalid API key. Please check your credentials."
                )
            elif response.status_code == 403:
                raise ToolProviderCredentialValidationError(
                    "API key does not have required permissions."
                )
            elif not response.ok:
                raise ToolProviderCredentialValidationError(
                    f"API validation failed with status {response.status_code}: {response.text}"
                )

            # Credentials are valid

        except requests.RequestException as e:
            raise ToolProviderCredentialValidationError(
                f"Network error during validation: {str(e)}"
            ) from e
```

---

### 6. tools/{{TOOL_NAME}}.yaml

Tool configuration including parameters and metadata.

```yaml
# Tool identity
identity:
  # Tool unique name (must match filename without .yaml)
  name: "{{TOOL_NAME}}"

  # Author name
  author: "{{AUTHOR_NAME}}"

  # Display name (multi-language)
  label:
    en_US: "{{TOOL_DISPLAY_NAME}}"
    zh_Hans: "{{工具显示名称}}"

# Tool descriptions
description:
  # Human-readable description (shown in Dify UI)
  human:
    en_US: "{{TOOL_DESCRIPTION_FOR_HUMANS_EN}}"
    zh_Hans: "{{工具描述_用户版_中文}}"

  # LLM-readable description (used by AI agents to understand tool purpose)
  # Keep this concise and focused on what the tool does and when to use it
  llm: "{{TOOL_DESCRIPTION_FOR_LLM}}"

# Tool parameters
parameters:
  # Example: Required string parameter
  - name: "{{PARAMETER_NAME_1}}"

    # Parameter type
    # Options: string, number, boolean, select, file
    type: string

    # Whether this parameter is required
    required: true

    # Where this parameter appears
    # Options:
    #   - "llm": LLM can set this parameter (for agent tools)
    #   - "form": User sets in UI (for workflow tools)
    #   - "both": Available in both contexts
    form: llm

    # Display label (multi-language)
    label:
      en_US: "{{PARAMETER_LABEL_EN}}"
      zh_Hans: "{{参数标签_中文}}"

    # Human-readable description (shown in UI)
    human_description:
      en_US: "{{PARAMETER_DESCRIPTION_FOR_HUMANS_EN}}"
      zh_Hans: "{{参数描述_用户版_中文}}"

    # LLM-readable description (helps agent understand when/how to use)
    llm_description: "{{PARAMETER_DESCRIPTION_FOR_LLM}}"

    # Optional: Placeholder text
    placeholder:
      en_US: "Enter {{PARAMETER_NAME}}"

  # Example: Optional number parameter with constraints
  - name: "{{PARAMETER_NAME_2}}"
    type: number
    required: false
    form: llm

    label:
      en_US: "{{NUMBER_PARAMETER_LABEL}}"

    human_description:
      en_US: "{{NUMBER_PARAMETER_DESCRIPTION}}"

    llm_description: "{{NUMBER_PARAMETER_LLM_DESCRIPTION}}"

    # Default value
    default: 10

    # Number constraints
    min: 1
    max: 100

  # Example: Select parameter (dropdown)
  - name: "{{PARAMETER_NAME_3}}"
    type: select
    required: false
    form: llm

    label:
      en_US: "{{SELECT_PARAMETER_LABEL}}"

    human_description:
      en_US: "{{SELECT_PARAMETER_DESCRIPTION}}"

    llm_description: "{{SELECT_PARAMETER_LLM_DESCRIPTION}}"

    # Options for select
    options:
      - value: "option1"
        label:
          en_US: "Option 1"
          zh_Hans: "选项 1"
      - value: "option2"
        label:
          en_US: "Option 2"
          zh_Hans: "选项 2"
      - value: "option3"
        label:
          en_US: "Option 3"
          zh_Hans: "选项 3"

    # Default selection
    default: "option1"

  # Example: Boolean parameter
  - name: "{{PARAMETER_NAME_4}}"
    type: boolean
    required: false
    form: form  # Usually form-only as LLMs don't need to toggle features

    label:
      en_US: "{{BOOLEAN_PARAMETER_LABEL}}"

    human_description:
      en_US: "{{BOOLEAN_PARAMETER_DESCRIPTION}}"

    llm_description: "{{BOOLEAN_PARAMETER_LLM_DESCRIPTION}}"

    default: false

  # Example: File parameter
  - name: "{{PARAMETER_NAME_5}}"
    type: file
    required: false
    form: form

    label:
      en_US: "{{FILE_PARAMETER_LABEL}}"

    human_description:
      en_US: "{{FILE_PARAMETER_DESCRIPTION}}"

    # Allowed file types
    allowed_extensions:
      - ".txt"
      - ".pdf"
      - ".csv"

# Extra configuration
extra:
  # Python-specific configuration
  python:
    # Path to tool implementation (relative to plugin root)
    source: tools/{{TOOL_NAME}}.py
```

---

### 7. tools/{{TOOL_NAME}}.py

Tool implementation with main execution logic.

```python
"""
{{TOOL_NAME}} Tool
{{TOOL_DESCRIPTION}}
"""

from typing import Any, Generator
from dify_plugin import Tool
from dify_plugin.entities.tool import ToolInvokeMessage

# Import any required libraries
# import requests
# from loguru import logger


class {{ToolClassName}}(Tool):
    """
    {{TOOL_DISPLAY_NAME}} implementation.

    This tool {{TOOL_PURPOSE_DESCRIPTION}}.
    """

    def _invoke(
        self,
        tool_parameters: dict[str, Any]
    ) -> Generator[ToolInvokeMessage, None, None]:
        """
        Execute the tool with given parameters.

        This method is called when the tool is invoked. It should:
        1. Validate input parameters
        2. Execute the tool's main logic
        3. Yield one or more ToolInvokeMessage results

        Args:
            tool_parameters: Dictionary of parameter values
                            Keys match parameter names from YAML
                            Values are user/LLM provided inputs

        Yields:
            ToolInvokeMessage: One or more result messages

        Message Types:
        - TEXT: Plain text response
        - JSON: Structured data response
        - IMAGE: Image URL or base64
        - LINK: Hyperlink
        - FILE: File attachment
        - BLOB: Binary data

        Pattern:
        1. Yield JSON message with full data (for programmatic use)
        2. Yield TEXT message with formatted summary (for human reading)
        3. Optionally yield IMAGE/FILE messages for media content
        """

        # ═══════════════════════════════════════════════════════════
        # STEP 1: Access Credentials
        # ═══════════════════════════════════════════════════════════
        # Credentials are available via self.runtime.credentials
        # This is a dictionary with keys matching credential names from provider YAML

        api_key = self.runtime.credentials.get("{{CREDENTIAL_NAME_1}}")
        if not api_key:
            # Return error message if credentials are missing
            yield self.create_text_message(
                "{{CREDENTIAL_LABEL}} is missing. Please configure credentials in the provider settings."
            )
            return

        # Access optional credentials with defaults
        endpoint = self.runtime.credentials.get("{{CREDENTIAL_NAME_2}}", "{{DEFAULT_ENDPOINT}}")

        # ═══════════════════════════════════════════════════════════
        # STEP 2: Extract and Validate Parameters
        # ═══════════════════════════════════════════════════════════
        # Parameters are available in the tool_parameters dictionary
        # Keys match parameter names from tool YAML

        # Required parameters
        required_param = tool_parameters.get("{{PARAMETER_NAME_1}}")
        if not required_param:
            yield self.create_text_message(
                "Required parameter '{{PARAMETER_NAME_1}}' is missing."
            )
            return

        # Optional parameters with defaults
        optional_param = tool_parameters.get("{{PARAMETER_NAME_2}}", 10)

        # Handle select parameters
        mode = tool_parameters.get("{{PARAMETER_NAME_3}}", "option1")

        # Handle boolean parameters
        enable_feature = tool_parameters.get("{{PARAMETER_NAME_4}}", False)

        # ═══════════════════════════════════════════════════════════
        # STEP 3: Execute Main Logic
        # ═══════════════════════════════════════════════════════════
        # This is where you implement your tool's core functionality
        # Common patterns:
        # - Make API requests
        # - Process data
        # - Generate content
        # - Interact with external services

        try:
            # Example: Make API request
            # import requests
            # response = requests.post(
            #     f"{endpoint}/{{API_PATH}}",
            #     headers={
            #         "Authorization": f"Bearer {api_key}",
            #         "Content-Type": "application/json"
            #     },
            #     json={
            #         "{{API_PARAM_1}}": required_param,
            #         "{{API_PARAM_2}}": optional_param,
            #         "{{API_PARAM_3}}": mode
            #     },
            #     timeout=30
            # )
            # response.raise_for_status()
            # result_data = response.json()

            # Placeholder result data
            result_data = {
                "status": "success",
                "data": {
                    "input": required_param,
                    "output": f"Processed: {required_param}",
                    "metadata": {
                        "mode": mode,
                        "optional_param": optional_param
                    }
                }
            }

        except Exception as e:
            # Handle errors gracefully
            # from loguru import logger
            # logger.error(f"Error executing {{TOOL_NAME}}: {str(e)}")

            yield self.create_text_message(
                f"Error occurred while executing {{TOOL_DISPLAY_NAME}}: {str(e)}"
            )
            return

        # ═══════════════════════════════════════════════════════════
        # STEP 4: Return Results
        # ═══════════════════════════════════════════════════════════
        # Yield one or more messages with results
        # Best practice: Return both JSON (for data) and TEXT (for display)

        # 4.1: Return JSON message with full data
        # This is useful for workflow nodes that need structured data
        yield self.create_json_message(result_data)

        # 4.2: Return formatted text message
        # This is useful for human-readable output and agent responses
        text_output = self._format_result_as_text(result_data)
        yield self.create_text_message(text=text_output)

        # 4.3: Optional - Return images if applicable
        # if "image_url" in result_data:
        #     yield self.create_image_message(
        #         image=result_data["image_url"],
        #         save_as=f"{{TOOL_NAME}}_output.png"  # Optional: save to workflow
        #     )

        # 4.4: Optional - Return links if applicable
        # if "result_url" in result_data:
        #     yield self.create_link_message(
        #         link=result_data["result_url"],
        #         title="View Results"
        #     )

    def _format_result_as_text(self, result_data: dict) -> str:
        """
        Format result data as human-readable text.

        Args:
            result_data: Structured result data from API/processing

        Returns:
            Formatted markdown text
        """
        lines = []

        # Add title
        lines.append(f"# {{TOOL_DISPLAY_NAME}} Results\n")

        # Add status
        status = result_data.get("status", "unknown")
        lines.append(f"**Status:** {status}\n")

        # Add data sections
        if "data" in result_data:
            data = result_data["data"]

            # Add key fields
            if "output" in data:
                lines.append(f"**Output:** {data['output']}\n")

            # Add metadata if present
            if "metadata" in data:
                lines.append("**Metadata:**")
                for key, value in data["metadata"].items():
                    lines.append(f"  - {key}: {value}")
                lines.append("")

        return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════
# Advanced Patterns
# ═══════════════════════════════════════════════════════════════════

class {{ToolClassName}}Advanced(Tool):
    """
    Advanced tool implementation with additional patterns.
    """

    def _invoke(
        self,
        tool_parameters: dict[str, Any]
    ) -> Generator[ToolInvokeMessage, None, None]:
        """Advanced invoke with streaming and progress updates."""

        # Pattern 1: Parameter validation with helper method
        validation_error = self._validate_parameters(tool_parameters)
        if validation_error:
            yield self.create_text_message(validation_error)
            return

        # Pattern 2: Progress updates for long-running operations
        yield self.create_text_message("Starting {{TOOL_DISPLAY_NAME}}...")

        # Pattern 3: Streaming results
        # For operations that produce incremental results
        for i, partial_result in enumerate(self._process_in_chunks(tool_parameters)):
            # Yield progress updates
            if i % 10 == 0:
                yield self.create_text_message(f"Processed {i} items...")

            # Yield partial results as they become available
            yield self.create_json_message(partial_result)

        # Pattern 4: Final summary
        yield self.create_text_message("Processing complete!")

    def _validate_parameters(self, params: dict[str, Any]) -> str | None:
        """
        Validate tool parameters.

        Returns:
            Error message if validation fails, None if valid
        """
        # Validate required parameters
        if not params.get("{{REQUIRED_PARAM}}"):
            return "Missing required parameter: {{REQUIRED_PARAM}}"

        # Validate parameter types
        if not isinstance(params.get("{{NUMERIC_PARAM}}", 0), (int, float)):
            return "{{NUMERIC_PARAM}} must be a number"

        # Validate parameter ranges
        value = params.get("{{NUMERIC_PARAM}}", 0)
        if value < 1 or value > 100:
            return "{{NUMERIC_PARAM}} must be between 1 and 100"

        # All validations passed
        return None

    def _process_in_chunks(
        self,
        params: dict[str, Any]
    ) -> Generator[dict, None, None]:
        """
        Process data in chunks for streaming results.

        Yields:
            Partial result dictionaries
        """
        # Example: Process a list of items incrementally
        items = params.get("items", [])
        chunk_size = 10

        for i in range(0, len(items), chunk_size):
            chunk = items[i:i + chunk_size]

            # Process chunk
            result = {
                "chunk_index": i // chunk_size,
                "items_processed": len(chunk),
                "results": [self._process_item(item) for item in chunk]
            }

            yield result

    def _process_item(self, item: Any) -> dict:
        """Process a single item."""
        return {
            "input": item,
            "output": f"Processed: {item}"
        }


# ═══════════════════════════════════════════════════════════════════
# Message Type Examples
# ═══════════════════════════════════════════════════════════════════

class MessageTypeExamples(Tool):
    """Examples of different message types."""

    def _invoke(
        self,
        tool_parameters: dict[str, Any]
    ) -> Generator[ToolInvokeMessage, None, None]:
        """Demonstrate all message types."""

        # TEXT message - plain text
        yield self.create_text_message(
            "This is a plain text message."
        )

        # JSON message - structured data
        yield self.create_json_message({
            "key": "value",
            "nested": {
                "data": [1, 2, 3]
            }
        })

        # IMAGE message - URL or base64
        yield self.create_image_message(
            image="https://example.com/image.png",
            save_as="result.png"  # Optional: save to workflow
        )

        # Or base64 image:
        # yield self.create_image_message(
        #     image="data:image/png;base64,iVBORw0KGgoAAAANS...",
        #     save_as="result.png"
        # )

        # LINK message - hyperlink
        yield self.create_link_message(
            link="https://example.com/results",
            title="View Full Results"
        )

        # FILE message - file attachment
        # yield self.create_file_message(
        #     file_content=b"file content bytes",
        #     file_name="output.txt",
        #     mime_type="text/plain"
        # )

        # BLOB message - binary data
        # yield self.create_blob_message(
        #     blob=b"binary data",
        #     meta={"type": "application/octet-stream"}
        # )
```

---

## Complete Working Example: Weather Tool

Here's a complete example of a weather lookup tool:

### Directory Structure
```
weather/
├── manifest.yaml
├── main.py
├── requirements.txt
├── icon.svg
├── provider/
│   ├── weather.yaml
│   └── weather.py
└── tools/
    ├── get_weather.yaml
    └── get_weather.py
```

### weather/manifest.yaml
```yaml
version: 0.1.0
type: plugin
author: "Example Developer"
name: "weather"
label:
  en_US: "Weather"
  zh_Hans: "天气"
created_at: "2024-12-01T00:00:00.000000000Z"
icon: icon.svg
description:
  en_US: "Get current weather information for any location"
  zh_Hans: "获取任意地点的当前天气信息"
tags:
  - "weather"
  - "api"
resource:
  memory: 1048576
  permission:
    tool:
      enabled: true
    model:
      enabled: true
      llm: true
plugins:
  tools:
    - "provider/weather.yaml"
meta:
  version: 0.0.1
  arch:
    - "amd64"
    - "arm64"
  runner:
    language: "python"
    version: "3.12"
    entrypoint: "main"
```

### weather/main.py
```python
from dify_plugin import Plugin, DifyPluginEnv

plugin = Plugin(DifyPluginEnv(MAX_REQUEST_TIMEOUT=30))

if __name__ == "__main__":
    plugin.run()
```

### weather/requirements.txt
```txt
dify_plugin>=0.3.0,<0.5.0
requests==2.31.0
```

### weather/provider/weather.yaml
```yaml
identity:
  author: "Example Developer"
  name: "weather"
  label:
    en_US: "Weather"
    zh_Hans: "天气"
  description:
    en_US: "Get weather information"
    zh_Hans: "获取天气信息"
  icon: icon.svg
  tags:
    - weather

credentials_for_provider:
  api_key:
    type: secret-input
    required: true
    label:
      en_US: "Weather API Key"
      zh_Hans: "天气 API 密钥"
    placeholder:
      en_US: "Please input your Weather API key"
      zh_Hans: "请输入你的天气 API 密钥"
    help:
      en_US: "Get your API key from WeatherAPI.com"
      zh_Hans: "从 WeatherAPI.com 获取您的 API 密钥"
    url: "https://www.weatherapi.com/signup.aspx"

tools:
  - tools/get_weather.yaml

extra:
  python:
    source: provider/weather.py
```

### weather/provider/weather.py
```python
from typing import Any
from dify_plugin import ToolProvider
from dify_plugin.errors.tool import ToolProviderCredentialValidationError
from tools.get_weather import GetWeatherTool


class WeatherProvider(ToolProvider):
    def _validate_credentials(self, credentials: dict[str, Any]) -> None:
        if not credentials.get("api_key"):
            raise ToolProviderCredentialValidationError("API key is required")

        try:
            tool = GetWeatherTool.from_credentials(credentials)
            result_generator = tool.invoke(
                tool_parameters={"location": "London"}
            )
            first_result = next(result_generator)

            if first_result.type == first_result.MessageType.TEXT:
                raise ToolProviderCredentialValidationError(str(first_result.message))

        except StopIteration:
            raise ToolProviderCredentialValidationError("Validation failed")
        except Exception as e:
            if isinstance(e, ToolProviderCredentialValidationError):
                raise
            raise ToolProviderCredentialValidationError(f"Validation error: {str(e)}") from e
```

### weather/tools/get_weather.yaml
```yaml
identity:
  name: "get_weather"
  author: "Example Developer"
  label:
    en_US: "Get Weather"
    zh_Hans: "获取天气"

description:
  human:
    en_US: "Get current weather information for a specified location"
    zh_Hans: "获取指定位置的当前天气信息"
  llm: "Get current weather including temperature, conditions, humidity, and wind speed for any location"

parameters:
  - name: location
    type: string
    required: true
    form: llm
    label:
      en_US: "Location"
      zh_Hans: "位置"
    human_description:
      en_US: "The location to get weather for (city name, postal code, or coordinates)"
      zh_Hans: "要获取天气的位置（城市名称、邮政编码或坐标）"
    llm_description: "Location name (e.g., 'New York', 'London', 'Tokyo')"
    placeholder:
      en_US: "Enter city name"

  - name: units
    type: select
    required: false
    form: llm
    label:
      en_US: "Temperature Units"
      zh_Hans: "温度单位"
    human_description:
      en_US: "Units for temperature display"
      zh_Hans: "温度显示单位"
    llm_description: "Temperature units: metric (Celsius) or imperial (Fahrenheit)"
    options:
      - value: "metric"
        label:
          en_US: "Celsius"
          zh_Hans: "摄氏度"
      - value: "imperial"
        label:
          en_US: "Fahrenheit"
          zh_Hans: "华氏度"
    default: "metric"

extra:
  python:
    source: tools/get_weather.py
```

### weather/tools/get_weather.py
```python
from typing import Any, Generator
import requests
from dify_plugin import Tool
from dify_plugin.entities.tool import ToolInvokeMessage


class GetWeatherTool(Tool):
    def _invoke(
        self,
        tool_parameters: dict[str, Any]
    ) -> Generator[ToolInvokeMessage, None, None]:

        api_key = self.runtime.credentials.get("api_key")
        if not api_key:
            yield self.create_text_message("Weather API key is missing")
            return

        location = tool_parameters.get("location")
        if not location:
            yield self.create_text_message("Location is required")
            return

        units = tool_parameters.get("units", "metric")

        try:
            response = requests.get(
                "https://api.weatherapi.com/v1/current.json",
                params={
                    "key": api_key,
                    "q": location,
                    "aqi": "no"
                },
                timeout=10
            )
            response.raise_for_status()
            data = response.json()

            # Return JSON data
            yield self.create_json_message(data)

            # Return formatted text
            current = data["current"]
            location_data = data["location"]

            temp = current["temp_c"] if units == "metric" else current["temp_f"]
            temp_unit = "°C" if units == "metric" else "°F"

            text = f"""# Weather in {location_data['name']}, {location_data['country']}

**Temperature:** {temp}{temp_unit}
**Conditions:** {current['condition']['text']}
**Humidity:** {current['humidity']}%
**Wind Speed:** {current['wind_kph']} km/h
**Last Updated:** {current['last_updated']}
"""

            yield self.create_text_message(text)

        except requests.RequestException as e:
            yield self.create_text_message(f"Error fetching weather: {str(e)}")
```

---

## Best Practices

### 1. Parameter Design
- **Use `form: llm`** for parameters that agents should set dynamically
- **Use `form: form`** for configuration parameters that users set once
- **Provide clear `llm_description`** to help agents understand when to use parameters
- **Set sensible defaults** for optional parameters

### 2. Error Handling
- **Always validate credentials** in provider `_validate_credentials()`
- **Check for required parameters** before executing logic
- **Return clear error messages** via `create_text_message()`
- **Use try-except blocks** around external API calls
- **Don't expose sensitive data** in error messages

### 3. Response Patterns
- **Yield JSON first** with full structured data
- **Then yield TEXT** with human-readable formatting
- **Optionally yield images/files** for media content
- **Use markdown formatting** in text messages for better readability

### 4. Performance
- **Set appropriate timeouts** in `DifyPluginEnv(MAX_REQUEST_TIMEOUT=...)`
- **Stream results** for long-running operations
- **Implement pagination** for large result sets
- **Cache responses** when appropriate (use Redis or in-memory cache)

### 5. Security
- **Use `secret-input` type** for API keys and sensitive credentials
- **Validate all user inputs** to prevent injection attacks
- **Use HTTPS** for all external API calls
- **Don't log sensitive information** (credentials, PII)

### 6. Documentation
- **Write clear descriptions** in both English and Chinese
- **Provide usage examples** in tool descriptions
- **Document parameter constraints** (min/max, allowed values)
- **Include credential acquisition URLs** in provider YAML

---

## Testing Your Plugin

### Local Testing
```bash
# Install dependencies
pip install -r requirements.txt

# Run plugin locally (if supported by Dify SDK)
python main.py
```

### Packaging Plugin (.difypkg)

**CRITICAL**: Use Python zipfile to avoid directory entry issues that cause installation failures.

```python
#!/usr/bin/env python3
"""Package Dify plugin into .difypkg file."""
import zipfile
import os
from pathlib import Path

def package_plugin(plugin_dir: str, output_file: str = None):
    """
    Package a plugin directory into a .difypkg file.

    IMPORTANT: This uses Python's zipfile to avoid the "read _assets: is a directory"
    error that occurs when using shell zip commands with directory entries.
    """
    plugin_path = Path(plugin_dir)
    if output_file is None:
        output_file = f"{plugin_path.name}.difypkg"

    with zipfile.ZipFile(output_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        for file_path in plugin_path.rglob('*'):
            if file_path.is_file():  # Only add files, not directories!
                # Skip common unwanted files
                if file_path.name in ['.DS_Store', '__pycache__', '*.pyc']:
                    continue
                arcname = file_path.relative_to(plugin_path)
                zf.write(file_path, arcname)

    print(f"Created: {output_file}")
    return output_file

# Usage:
# package_plugin("./my_plugin")
```

**Shell alternative** (if you must use shell):
```bash
# CORRECT - files only, no directory entries
cd my_plugin && find . -type f ! -name '.DS_Store' | zip -@ ../my_plugin.difypkg

# WRONG - includes directory entries, causes "is a directory" error
zip -r my_plugin.difypkg my_plugin/
```

### Integration Testing
1. Package plugin into `.difypkg` file (using method above)
2. Install in Dify instance (Plugins > Install from file)
3. Configure credentials in provider settings
4. Test in workflow or agent

### Debugging Tips
- **Check logs** in Dify plugin daemon
- **Use `loguru` logger** for debug output: `logger.debug("message")`
- **Test credential validation** separately
- **Verify YAML syntax** with a YAML validator
- **Start simple** and add features incrementally

---

## Common Issues and Solutions

### Issue: "file not found: icon.svg" / "failed to remap tool icon"
**Solution:** This is the #1 installation error. Fix:
- Put icon file in `_assets/icon.svg`
- Reference as just `icon.svg` in manifest.yaml and provider YAML
- Do NOT use `_assets/icon.svg` as the reference

### Issue: "read _assets: is a directory"
**Solution:** ZIP file has directory entries.
- Use Python zipfile module (see Packaging section above)
- Or use: `find . -type f | zip -@ plugin.difypkg`
- Do NOT use: `zip -r plugin.difypkg ./`

### Issue: "plugin_unique_identifier is not valid"
**Solution:** Author name has spaces.
- Use `author: mycompany` not `author: My Company`
- Only lowercase letters, numbers, underscores allowed

### Issue: "Failed to parse response from plugin daemon"
**Solution:** Manifest format is incorrect.
- Use `permission: {}` not nested permission structure
- Add `verified: false` to manifest
- Add `minimum_dify_version: null` to meta section
- Check YAML syntax (indentation, colons)

### Issue: "Credential validation failed"
**Solution:** Check that:
- Credential names in provider YAML match those used in provider.py
- API endpoint is correct
- Network access is allowed
- Test parameters in `_validate_credentials()` are valid

### Issue: "Tool not found"
**Solution:** Verify that:
- Tool YAML filename matches the `name` field
- Tool is listed in `tools:` section of provider YAML
- `extra.python.source` path is correct

### Issue: "Invalid parameters"
**Solution:** Ensure:
- Parameter names in tool YAML match those used in tool.py
- Required parameters are marked `required: true`
- Parameter types match expected values (string, number, boolean, etc.)

### Issue: "Timeout errors"
**Solution:**
- Increase `MAX_REQUEST_TIMEOUT` in main.py
- Implement request timeouts in API calls
- Consider streaming results for long operations

---

## Additional Resources

- **Dify Plugin SDK Documentation:** https://github.com/langgenius/dify-plugin-sdks
- **Official Plugin Examples:** https://github.com/langgenius/dify-official-plugins
- **Dify Documentation:** https://docs.dify.ai
- **Plugin Marketplace:** https://marketplace.dify.ai (coming soon)

---

## Template Checklist

Before deploying your plugin, verify:

**Structure:**
- [ ] All `{{PLACEHOLDER}}` values are replaced with actual values
- [ ] Plugin name is unique and follows naming conventions (lowercase, underscores, no spaces)
- [ ] Author name has NO SPACES (e.g., `mycompany` not `My Company`)
- [ ] `_assets/` directory exists with `icon.svg` inside
- [ ] Icon referenced as `icon.svg` (not `_assets/icon.svg`) in all YAML files
- [ ] All required files present (manifest.yaml, main.py, requirements.txt, provider files, tool files)

**Manifest:**
- [ ] `permission: {}` used (or proper nested structure for advanced cases)
- [ ] `verified: false` is included
- [ ] `minimum_dify_version: null` is in meta section
- [ ] `created_at` is valid ISO 8601 timestamp

**Code:**
- [ ] Credentials are properly validated in provider
- [ ] Parameters have clear descriptions for both humans and LLMs
- [ ] Error handling covers common failure cases
- [ ] Multi-language support is provided (at minimum: en_US, zh_Hans)
- [ ] Tool returns both JSON and TEXT messages
- [ ] Dependencies are listed in requirements.txt with version constraints

**Packaging:**
- [ ] Plugin packaged using Python zipfile (not `zip -r`)
- [ ] .difypkg file contains only files (no directory entries)
- [ ] No `.DS_Store`, `__pycache__`, or `.pyc` files in package

---

**Updated:** 2025-12-01
**Version:** 2.0
**Compatible with:** Dify Plugin SDK 0.3.0 - 0.4.x
