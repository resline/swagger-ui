# Dify Extension Plugin Template

Complete template for creating Extension-type plugins in Dify. This template includes all necessary files with placeholders and inline comments explaining the Dify plugin SDK patterns.

## Directory Structure

```
{{PLUGIN_NAME}}/
├── manifest.yaml
├── main.py
├── requirements.txt
├── README.md
├── GUIDE.md
├── PRIVACY.md
├── _assets/
│   └── icon.svg
├── group/
│   └── {{GROUP_NAME}}.yaml
└── endpoints/
    ├── {{ENDPOINT_NAME}}.yaml
    └── {{ENDPOINT_NAME}}.py
```

---

## File Templates

### 1. manifest.yaml

Plugin metadata and configuration. Defines plugin type, permissions, and resource requirements.

```yaml
# Plugin version (semantic versioning)
version: {{VERSION}}  # e.g., 0.0.1

# Plugin type: "plugin" for standard plugins
type: plugin

# Plugin author/organization
author: {{AUTHOR}}  # e.g., your_company_name

# Unique plugin identifier (1-128 chars, letters/numbers/hyphens/underscores only)
name: {{PLUGIN_NAME}}  # e.g., my_api_integration

# Display labels (multi-language support)
label:
  en_US: {{LABEL_EN}}  # e.g., My API Integration
  zh_Hans: {{LABEL_ZH}}  # e.g., 我的API集成
  ja_JP: {{LABEL_JA}}  # e.g., マイAPIインテグレーション
  pt_BR: {{LABEL_PT}}  # e.g., Minha Integração de API

# Plugin description (multi-language support)
description:
  en_US: {{DESCRIPTION_EN}}  # e.g., Integration with external API service
  zh_Hans: {{DESCRIPTION_ZH}}  # e.g., 与外部API服务集成
  ja_JP: {{DESCRIPTION_JA}}  # e.g., 外部APIサービスとの統合
  pt_BR: {{DESCRIPTION_PT}}  # e.g., Integração com serviço de API externa

# Icon file path (relative to plugin root)
icon: {{ICON_PATH}}  # e.g., _assets/icon.svg

# Plugin creation timestamp (ISO 8601 format)
created_at: {{TIMESTAMP}}  # e.g., 2025-01-15T10:30:00+00:00

# Resource requirements and permissions
resource:
  # Memory allocation in bytes (268435456 = 256MB)
  memory: {{MEMORY_BYTES}}  # e.g., 268435456

  # Permission declarations
  permission:
    # Enable HTTP endpoint functionality
    endpoint:
      enabled: true

    # Optional: Enable access to Dify tools (if plugin needs to invoke tools)
    # tool:
    #   enabled: true

    # Optional: Enable access to Dify LLMs (if plugin needs to invoke models)
    # llm:
    #   enabled: true

    # Optional: Enable access to Dify apps (if plugin needs to invoke applications)
    # app:
    #   enabled: true

    # Optional: Enable persistent storage (if plugin needs to store data)
    # storage:
    #   enabled: true
    #   size: {{STORAGE_SIZE}}  # e.g., 10485760 (10MB)

# Plugin endpoints definition
# Each entry points to a group configuration file
plugins:
  endpoints:
    - group/{{GROUP_NAME}}.yaml  # e.g., group/my_api.yaml

# Plugin metadata
meta:
  # Plugin version (should match top-level version)
  version: {{VERSION}}  # e.g., 0.0.1

  # Supported architectures
  arch:
    - amd64
    - arm64

  # Runtime configuration
  runner:
    language: python
    version: "3.12"
    entrypoint: main  # Points to main.py

# Privacy policy file (optional)
privacy: PRIVACY.md

# Verification status (set by Dify marketplace)
verified: false
```

---

### 2. main.py

Plugin entry point. Standard implementation for all Extension plugins.

```python
"""
Plugin entry point.

This file is the main entrypoint for the Dify plugin runtime.
It initializes the plugin with optional environment configuration.
"""

from dify_plugin import Plugin, DifyPluginEnv

# Initialize plugin with optional environment settings
# MAX_REQUEST_TIMEOUT: Maximum time (in seconds) for HTTP requests
plugin = Plugin(DifyPluginEnv(
    MAX_REQUEST_TIMEOUT={{MAX_TIMEOUT}}  # e.g., 120 (2 minutes)
))

if __name__ == '__main__':
    # Start the plugin runtime
    # This will:
    # - Register all endpoints from manifest.yaml
    # - Listen for incoming requests from Dify
    # - Handle request routing to appropriate endpoint handlers
    plugin.run()
```

**Notes:**
- `DifyPluginEnv` is optional - use default if no custom settings needed
- `MAX_REQUEST_TIMEOUT` prevents long-running requests from blocking
- Plugin runs as a service, not a one-time execution

---

### 3. requirements.txt

Python dependencies. Always include the Dify plugin SDK.

```txt
# Dify Plugin SDK (required)
dify_plugin~={{SDK_VERSION}}  # e.g., 0.5.0

# Werkzeug for HTTP request/response handling (required)
werkzeug~={{WERKZEUG_VERSION}}  # e.g., 3.0.6

# Add your custom dependencies below
# Example:
# requests~=2.31.0  # HTTP client for external API calls
# {{DEPENDENCY_NAME}}~={{DEPENDENCY_VERSION}}  # {{DEPENDENCY_DESCRIPTION}}
```

**Common dependencies:**
- `requests` - HTTP client for external API calls
- `boto3` - AWS SDK (for S3, Bedrock, etc.)
- `redis` - Redis client for caching
- `pydantic` - Data validation and serialization
- `flask` - Web framework (for complex HTML rendering)

---

### 4. group/{{GROUP_NAME}}.yaml

Endpoint group configuration. Defines shared settings for multiple endpoints.

```yaml
# Shared settings for all endpoints in this group
# These settings will be requested when user creates an endpoint instance in Dify
settings:
  # Example: API Key setting (secret input)
  - name: {{SETTING_NAME_1}}  # e.g., api_key
    type: secret-input  # Options: secret-input, text-input, select, boolean
    required: {{IS_REQUIRED}}  # true or false
    label:
      en_US: {{LABEL_EN}}  # e.g., API Key
      zh_Hans: {{LABEL_ZH}}  # e.g., API密钥
      ja_Jp: {{LABEL_JA}}  # e.g., APIキー
      pt_BR: {{LABEL_PT}}  # e.g., Chave API
    placeholder:
      en_US: {{PLACEHOLDER_EN}}  # e.g., Please input your API key
      zh_Hans: {{PLACEHOLDER_ZH}}  # e.g., 请输入你的API密钥
      ja_Jp: {{PLACEHOLDER_JA}}  # e.g., APIキーを入力してください
      pt_BR: {{PLACEHOLDER_PT}}  # e.g., Por favor, insira sua chave API
    # Optional: Default value
    # default: {{DEFAULT_VALUE}}

  # Example: Text input setting
  # - name: {{SETTING_NAME_2}}  # e.g., base_url
  #   type: text-input
  #   required: false
  #   label:
  #     en_US: Base URL
  #   placeholder:
  #     en_US: https://api.example.com
  #   default: https://api.example.com

  # Example: Select/dropdown setting
  # - name: {{SETTING_NAME_3}}  # e.g., region
  #   type: select
  #   required: true
  #   label:
  #     en_US: Region
  #   options:
  #     - value: us-east-1
  #       label:
  #         en_US: US East (N. Virginia)
  #     - value: eu-west-1
  #       label:
  #         en_US: EU (Ireland)
  #   default: us-east-1

# List of endpoint definitions
# Each entry points to an endpoint configuration file
endpoints:
  - endpoints/{{ENDPOINT_NAME_1}}.yaml  # e.g., endpoints/retrieve.yaml
  # - endpoints/{{ENDPOINT_NAME_2}}.yaml  # Add more endpoints as needed
```

**Setting types:**
- `secret-input` - Masked input (for API keys, passwords)
- `text-input` - Plain text input (for URLs, usernames)
- `select` - Dropdown selection (for predefined options)
- `boolean` - Checkbox (for true/false flags)

**Notes:**
- All endpoints in this group share the same settings
- Settings are passed to endpoint `_invoke` method as `settings` parameter
- Users configure settings once when creating endpoint instance in Dify

---

### 5. endpoints/{{ENDPOINT_NAME}}.yaml

Individual endpoint configuration. Defines HTTP path, method, and implementation file.

```yaml
# HTTP path following Werkzeug routing syntax
# Static path example: "/api/retrieve"
# Path with parameter: "/api/users/<user_id>"
# Path with typed parameter: "/api/items/<int:item_id>"
path: "{{ENDPOINT_PATH}}"  # e.g., "/api/<resource_type>/<resource_id>"

# HTTP method
# Supported: HEAD, GET, POST, PUT, DELETE, OPTIONS
method: "{{HTTP_METHOD}}"  # e.g., POST

# Extra configuration
extra:
  python:
    # Python source file implementing this endpoint (relative to plugin root)
    source: "{{ENDPOINT_SOURCE}}"  # e.g., endpoints/my_endpoint.py
```

**Path parameter syntax (Werkzeug routing):**
- `<variable>` - String parameter (default)
- `<int:variable>` - Integer parameter
- `<float:variable>` - Float parameter
- `<path:variable>` - Path parameter (accepts slashes)
- `<uuid:variable>` - UUID parameter

**Examples:**
```yaml
# Simple GET endpoint
path: "/health"
method: "GET"

# POST endpoint with JSON body
path: "/api/process"
method: "POST"

# Dynamic path with parameters
path: "/api/users/<user_id>/posts/<int:post_id>"
method: "GET"

# Catch-all path
path: "/files/<path:file_path>"
method: "GET"
```

---

### 6. endpoints/{{ENDPOINT_NAME}}.py

Endpoint implementation. Handles HTTP requests and returns responses.

```python
"""
Endpoint implementation for {{ENDPOINT_DESCRIPTION}}.

This module defines the endpoint handler that processes incoming HTTP requests.
"""

import json
from typing import Mapping
from werkzeug import Request, Response
from dify_plugin import Endpoint

# Optional: Import additional libraries
# import requests  # For external API calls
# from datetime import datetime


class {{ENDPOINT_CLASS_NAME}}(Endpoint):
    """
    Endpoint handler for {{ENDPOINT_DESCRIPTION}}.

    This class must inherit from dify_plugin.Endpoint and implement
    the _invoke method to handle incoming requests.
    """

    def _invoke(self, r: Request, values: Mapping, settings: Mapping) -> Response:
        """
        Handle incoming HTTP request.

        Parameters:
        -----------
        r : Request (werkzeug.wrappers.Request)
            The incoming HTTP request object. Access request data via:
            - r.method : str - HTTP method (GET, POST, etc.)
            - r.args : ImmutableMultiDict - Query parameters (?key=value)
            - r.form : ImmutableMultiDict - Form data (application/x-www-form-urlencoded)
            - r.files : ImmutableMultiDict - Uploaded files
            - r.headers : Headers - HTTP headers
            - r.get_json() : dict - Parse JSON request body
            - r.get_data() : bytes - Raw request body
            - r.cookies : dict - Request cookies

        values : Mapping
            Path parameters extracted from the URL route.
            Example: For path "/api/users/<user_id>" with request "/api/users/123"
                     values = {"user_id": "123"}
            Example: For path "/items/<int:id>" with request "/items/456"
                     values = {"id": 456}  # Automatically converted to int

        settings : Mapping
            Configuration settings from group configuration (group/{{GROUP_NAME}}.yaml).
            Access user-provided values via settings.get("setting_name")
            Example: settings.get("api_key") - User's API key
            Example: settings.get("base_url") - User's base URL

        Returns:
        --------
        Response (werkzeug.wrappers.Response)
            HTTP response object. Create using:
            - Response(response_body, status=200, content_type="...")
            - response_body can be: str, bytes, or generator (for streaming)

        Notes:
        ------
        - NEVER return plain string - always wrap in Response object
        - Use appropriate content_type header (application/json, text/html, etc.)
        - Handle errors with appropriate HTTP status codes (400, 401, 500, etc.)
        - For long responses, use generator pattern for streaming
        """

        # ========================================
        # 1. Extract path parameters
        # ========================================
        # Access parameters from URL path (defined in endpoint YAML)
        # Example: path="/api/<resource_id>" → values["resource_id"]
        # Example: path="/items/<int:item_id>" → values["item_id"] (int type)

        # {{PATH_PARAM_NAME}} = values.get("{{PATH_PARAM_KEY}}")
        # if not {{PATH_PARAM_NAME}}:
        #     return Response(
        #         response=json.dumps({"error": "Missing {{PATH_PARAM_KEY}} parameter"}),
        #         status=400,
        #         content_type="application/json"
        #     )

        # ========================================
        # 2. Extract request data
        # ========================================

        # For GET requests: Extract query parameters
        # Example: /api/endpoint?query=test&limit=10
        # query_param = r.args.get("{{QUERY_PARAM_NAME}}")
        # limit = r.args.get("limit", default=10, type=int)

        # For POST requests: Parse JSON body
        # try:
        #     body = r.get_json()
        #     {{FIELD_NAME}} = body.get("{{FIELD_KEY}}")
        #     if not {{FIELD_NAME}}:
        #         return Response(
        #             response=json.dumps({"error": "Missing required field: {{FIELD_KEY}}"}),
        #             status=400,
        #             content_type="application/json"
        #         )
        # except Exception as e:
        #     return Response(
        #         response=json.dumps({"error": "Invalid JSON body", "details": str(e)}),
        #         status=400,
        #         content_type="application/json"
        #     )

        # For form data: Access form fields
        # form_field = r.form.get("{{FORM_FIELD_NAME}}")

        # For file uploads: Access uploaded files
        # if "{{FILE_FIELD_NAME}}" in r.files:
        #     uploaded_file = r.files["{{FILE_FIELD_NAME}}"]
        #     file_content = uploaded_file.read()
        #     file_name = uploaded_file.filename

        # For headers: Access HTTP headers
        # auth_header = r.headers.get("Authorization")
        # content_type = r.headers.get("Content-Type")

        # ========================================
        # 3. Access configuration settings
        # ========================================
        # These are configured by the user in Dify when creating endpoint instance
        # Defined in group/{{GROUP_NAME}}.yaml

        # api_key = settings.get("{{SETTING_API_KEY}}")
        # base_url = settings.get("{{SETTING_BASE_URL}}")
        # region = settings.get("{{SETTING_REGION}}")

        # if not api_key:
        #     return Response(
        #         response=json.dumps({"error": "API key not configured"}),
        #         status=401,
        #         content_type="application/json"
        #     )

        # ========================================
        # 4. Implement business logic
        # ========================================

        # Example: Call external API
        # try:
        #     import requests
        #     response = requests.post(
        #         f"{base_url}/{{EXTERNAL_API_PATH}}",
        #         headers={
        #             "Authorization": f"Bearer {api_key}",
        #             "Content-Type": "application/json"
        #         },
        #         json={{EXTERNAL_API_PAYLOAD}},
        #         timeout=30
        #     )
        #     response.raise_for_status()
        #     api_data = response.json()
        # except requests.exceptions.RequestException as e:
        #     return Response(
        #         response=json.dumps({"error": "External API request failed", "details": str(e)}),
        #         status=502,
        #         content_type="application/json"
        #     )

        # Example: Process data
        # results = []
        # for item in api_data.get("items", []):
        #     processed_item = {
        #         "id": item.get("id"),
        #         "title": item.get("title"),
        #         "score": item.get("score", 0.0)
        #     }
        #     results.append(processed_item)

        # ========================================
        # 5. Return response
        # ========================================

        # JSON response (most common)
        # return Response(
        #     response=json.dumps({
        #         "status": "success",
        #         "data": results,
        #         "count": len(results)
        #     }),
        #     status=200,
        #     content_type="application/json"
        # )

        # HTML response
        # html_content = """
        # <!DOCTYPE html>
        # <html>
        # <head><title>{{TITLE}}</title></head>
        # <body><h1>{{CONTENT}}</h1></body>
        # </html>
        # """
        # return Response(html_content, status=200, content_type="text/html")

        # Plain text response
        # return Response("{{TEXT_CONTENT}}", status=200, content_type="text/plain")

        # Binary response (file download)
        # return Response(
        #     file_content,
        #     status=200,
        #     content_type="application/octet-stream",
        #     headers={"Content-Disposition": f"attachment; filename={file_name}"}
        # )

        # Streaming response (for large data)
        # def generate_stream():
        #     for item in large_dataset:
        #         yield json.dumps(item) + "\n"
        #
        # return Response(
        #     generate_stream(),
        #     status=200,
        #     content_type="application/x-ndjson"  # Newline-delimited JSON
        # )

        # Error response with custom status code
        # return Response(
        #     response=json.dumps({
        #         "error": "Resource not found",
        #         "error_code": 404
        #     }),
        #     status=404,
        #     content_type="application/json"
        # )

        # ========================================
        # Example implementation: Simple echo endpoint
        # ========================================

        # Get request method
        method = r.method

        # Get path parameters
        path_params = dict(values)

        # Get query parameters
        query_params = {key: r.args.getlist(key) if len(r.args.getlist(key)) > 1 else r.args.get(key)
                        for key in r.args.keys()}

        # Try to get JSON body (if POST/PUT)
        try:
            body = r.get_json() if r.method in ["POST", "PUT", "PATCH"] else None
        except:
            body = None

        # Build response
        response_data = {
            "message": "{{SUCCESS_MESSAGE}}",
            "method": method,
            "path_parameters": path_params,
            "query_parameters": query_params,
            "body": body,
            "settings_configured": list(settings.keys()) if settings else []
        }

        return Response(
            response=json.dumps(response_data, indent=2),
            status=200,
            content_type="application/json"
        )


# ========================================
# Additional notes and patterns
# ========================================

# Authentication pattern:
# def verify_auth(r: Request, settings: Mapping) -> bool:
#     """Verify request authentication."""
#     auth_header = r.headers.get("Authorization")
#     api_key = settings.get("api_key")
#     return auth_header == f"Bearer {api_key}"

# Error handling pattern:
# def handle_error(error: Exception, status_code: int = 500) -> Response:
#     """Return standardized error response."""
#     return Response(
#         response=json.dumps({
#             "error": type(error).__name__,
#             "message": str(error)
#         }),
#         status=status_code,
#         content_type="application/json"
#     )

# Validation pattern:
# def validate_request_body(body: dict, required_fields: list) -> tuple[bool, str]:
#     """Validate request body has required fields."""
#     for field in required_fields:
#         if field not in body:
#             return False, f"Missing required field: {field}"
#     return True, ""
```

---

## Usage Instructions

### 1. Replace All Placeholders

Search and replace the following placeholders with your actual values:

**Plugin metadata:**
- `{{VERSION}}` - Plugin version (e.g., `0.0.1`)
- `{{AUTHOR}}` - Author name (e.g., `your_company`)
- `{{PLUGIN_NAME}}` - Unique plugin identifier (e.g., `my_api_plugin`)
- `{{LABEL_EN/ZH/JA/PT}}` - Plugin display name in each language
- `{{DESCRIPTION_EN/ZH/JA/PT}}` - Plugin description in each language
- `{{ICON_PATH}}` - Icon file path (e.g., `_assets/icon.svg`)
- `{{TIMESTAMP}}` - Creation timestamp (e.g., `2025-01-15T10:30:00+00:00`)

**Resource configuration:**
- `{{MEMORY_BYTES}}` - Memory allocation in bytes (e.g., `268435456` = 256MB)
- `{{STORAGE_SIZE}}` - Storage size in bytes (optional, e.g., `10485760` = 10MB)
- `{{MAX_TIMEOUT}}` - Request timeout in seconds (e.g., `120`)

**Group configuration:**
- `{{GROUP_NAME}}` - Group identifier (e.g., `my_api`)
- `{{SETTING_NAME_X}}` - Setting variable names (e.g., `api_key`, `base_url`)
- `{{IS_REQUIRED}}` - Whether setting is required (`true` or `false`)

**Endpoint configuration:**
- `{{ENDPOINT_NAME}}` - Endpoint identifier (e.g., `retrieve`, `process`)
- `{{ENDPOINT_PATH}}` - HTTP path (e.g., `/api/retrieve`, `/users/<user_id>`)
- `{{HTTP_METHOD}}` - HTTP method (e.g., `GET`, `POST`)
- `{{ENDPOINT_SOURCE}}` - Python file path (e.g., `endpoints/retrieve.py`)
- `{{ENDPOINT_CLASS_NAME}}` - Python class name (e.g., `RetrieveEndpoint`)
- `{{ENDPOINT_DESCRIPTION}}` - Endpoint description for documentation

**Implementation details:**
- `{{PATH_PARAM_NAME}}` - Variable name for path parameter
- `{{PATH_PARAM_KEY}}` - Key name in values dict
- `{{QUERY_PARAM_NAME}}` - Query parameter name
- `{{FIELD_NAME/KEY}}` - JSON body field names
- `{{SETTING_*}}` - Setting keys from group configuration
- `{{EXTERNAL_API_*}}` - External API details
- `{{SUCCESS_MESSAGE}}` - Success message text

**Dependencies:**
- `{{SDK_VERSION}}` - Dify plugin SDK version (e.g., `0.5.0`)
- `{{WERKZEUG_VERSION}}` - Werkzeug version (e.g., `3.0.6`)
- `{{DEPENDENCY_NAME/VERSION/DESCRIPTION}}` - Custom dependencies

### 2. Implement Your Logic

1. **Define your settings** in `group/{{GROUP_NAME}}.yaml`
   - Add configuration fields users need to provide (API keys, URLs, etc.)
   - Choose appropriate input types (secret-input, text-input, select, boolean)

2. **Define your endpoints** in `endpoints/{{ENDPOINT_NAME}}.yaml`
   - Set HTTP paths and methods
   - Use Werkzeug path parameter syntax if needed

3. **Implement endpoint handlers** in `endpoints/{{ENDPOINT_NAME}}.py`
   - Extract request data (path params, query params, body)
   - Access user settings via `settings` parameter
   - Call external APIs or perform business logic
   - Return properly formatted Response objects

4. **Add dependencies** to `requirements.txt`
   - Include all Python packages your code imports

### 3. Test Your Plugin

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure remote debugging:**
   - Create `.env` file with Dify remote debugging credentials:
     ```bash
     INSTALL_METHOD=remote
     REMOTE_INSTALL_URL=debug.dify.ai:5003
     REMOTE_INSTALL_KEY=your-debug-key
     ```

3. **Run plugin:**
   ```bash
   python -m main
   ```

4. **Test in Dify:**
   - Go to Plugin Management page
   - Create endpoint instance with your settings
   - Call endpoint URL to verify functionality

### 4. Package and Publish

1. **Package plugin:**
   ```bash
   dify plugin package ./{{PLUGIN_NAME}}
   ```

2. **Upload to Dify Marketplace:**
   - Follow [plugin publishing specifications](https://docs.dify.ai/plugin-dev-en/0322-release-to-dify-marketplace)
   - Submit to [dify-plugins repository](https://github.com/langgenius/dify-plugins)

---

## Common Patterns

### JSON API Endpoint

```python
def _invoke(self, r: Request, values: Mapping, settings: Mapping) -> Response:
    try:
        body = r.get_json()
        query = body.get("query")

        # Process query...
        results = process_query(query, settings)

        return Response(
            response=json.dumps({"results": results}),
            status=200,
            content_type="application/json"
        )
    except Exception as e:
        return Response(
            response=json.dumps({"error": str(e)}),
            status=500,
            content_type="application/json"
        )
```

### HTML Rendering Endpoint

```python
def _invoke(self, r: Request, values: Mapping, settings: Mapping) -> Response:
    html = """
    <!DOCTYPE html>
    <html>
    <head><title>My Plugin</title></head>
    <body>
        <h1>Hello from Dify Plugin!</h1>
    </body>
    </html>
    """
    return Response(html, status=200, content_type="text/html")
```

### External API Integration

```python
def _invoke(self, r: Request, values: Mapping, settings: Mapping) -> Response:
    import requests

    api_key = settings.get("api_key")
    body = r.get_json()

    response = requests.post(
        "https://api.example.com/endpoint",
        headers={"Authorization": f"Bearer {api_key}"},
        json=body,
        timeout=30
    )

    return Response(
        response=response.content,
        status=response.status_code,
        content_type=response.headers.get("Content-Type")
    )
```

### Streaming Response

```python
def _invoke(self, r: Request, values: Mapping, settings: Mapping) -> Response:
    def generate_data():
        for i in range(100):
            yield f"data: {i}\n\n"
            time.sleep(0.1)

    return Response(
        generate_data(),
        status=200,
        content_type="text/event-stream"
    )
```

---

## Reference Links

- [Dify Plugin Documentation](https://docs.dify.ai/plugin-dev-en)
- [Extension Plugin Guide](https://docs.dify.ai/plugin-dev-en/9231-extension-plugin)
- [Endpoint Reference](https://docs.dify.ai/plugin-dev-en/0432-endpoint)
- [Werkzeug Documentation](https://werkzeug.palletsprojects.com/)
- [Plugin SDK Repository](https://github.com/langgenius/dify-plugin-sdks)

---

## Troubleshooting

**Issue: Plugin doesn't start**
- Check `requirements.txt` has correct `dify_plugin` version
- Verify `main.py` has correct `Plugin` initialization
- Check `manifest.yaml` syntax (YAML indentation)

**Issue: Endpoint not found (404)**
- Verify endpoint path in `endpoints/{{ENDPOINT_NAME}}.yaml` matches URL
- Check endpoint is listed in `group/{{GROUP_NAME}}.yaml`
- Confirm group is listed in `manifest.yaml`

**Issue: Settings not working**
- Verify setting names in group config match `settings.get("name")` calls
- Check setting types are correct (secret-input, text-input, etc.)
- Ensure required settings have `required: true`

**Issue: Request data missing**
- For JSON body: Use `r.get_json()` not `r.json`
- For query params: Use `r.args.get("key")` not `r.query`
- For path params: Use `values.get("key")` not `r.params`

**Issue: Response error**
- Always return `Response` object, never plain string
- Set correct `content_type` header (`application/json`, `text/html`, etc.)
- Use appropriate HTTP status codes (200, 400, 401, 500, etc.)

---

**Template Version:** 1.0.0
**Last Updated:** 2025-01-15
**Compatible with:** Dify Plugin SDK 0.5.0+, Python 3.12+
