# Dify Plugin Creator Skill

A comprehensive skill for creating, developing, and packaging Dify plugins.

## Skill Overview

- **Name**: `dify-plugin-creator`
- **Description**: 453 characters (well under 1024 char limit)
- **SKILL.md**: 457 lines (under 500 line recommendation)
- **Trigger contexts**: Creating, developing, or packaging Dify plugins of any type

## Structure

```
dify-plugin-creator/
├── SKILL.md                        # Main skill file (457 lines)
├── README.md                       # This file
└── references/                     # Bundled documentation (5 files)
    ├── README.md                   # Reference index
    ├── tool-oauth.md              # OAuth integration guide (15KB)
    ├── model-schema.md            # Model plugin specifications (38KB)
    ├── datasource.md              # Datasource implementation (18KB)
    ├── extension.md               # HTTP webhook integration (16KB)
    └── agent-strategy.md          # Agent reasoning strategies (43KB)
```

## Key Features

### 1. Plugin Type Decision Tree
Clear visual decision tree helping users choose between:
- MODEL (AI model providers)
- TOOL (agent actions/functions)
- DATASOURCE (external data sources)
- EXTENSION (HTTP webhooks)
- AGENT-STRATEGY (custom reasoning)

### 2. Complete Workflow
Step-by-step guide covering:
1. CLI installation (Mac/Linux)
2. Plugin initialization
3. Development setup
4. Testing with remote debugging
5. Packaging for distribution

### 3. Implementation Patterns
Code examples and best practices for:
- Manifest.yaml configuration
- Provider YAML schemas
- Tool/Model/Datasource implementations
- OAuth integration
- Multi-language support

### 4. Reference Documentation
Detailed guides loaded only when needed:
- **tool-oauth.md**: Complete OAuth flow implementation
- **model-schema.md**: Full model plugin API reference
- **datasource.md**: Datasource patterns and examples
- **extension.md**: HTTP webhook integration details
- **agent-strategy.md**: Custom reasoning strategy implementation

## Usage

The skill triggers when users request:
- "Create a Dify plugin"
- "Build a tool for Dify"
- "Develop a custom model provider"
- "Make a datasource plugin"
- "Package this as a .difypkg file"

## Progressive Disclosure

The skill follows best practices for context efficiency:

1. **SKILL.md (457 lines)**: Core workflows, quick reference, decision trees
2. **References (5 files)**: Detailed implementation guides loaded as needed
3. **Official examples**: Points to `/root/repo/plugins/dify-official-plugins/`

## Validation

- ✅ YAML frontmatter with required fields (name, description)
- ✅ Description under 1024 characters (453 chars)
- ✅ SKILL.md under 500 lines (457 lines)
- ✅ Clear plugin type selection workflow (decision tree)
- ✅ References to bundled docs for implementation details
- ✅ References to initialization scripts (`dify plugin init`)
- ✅ Complete packaging workflow (`dify plugin package`)

## Reference to Official Documentation

All reference files are sourced from `/root/repo/dify-docs/plugin-dev-en/`:
- Maintained by Dify team
- Includes latest API specifications
- Contains official code examples
- Covers all 5 plugin types

## Next Steps

Users can:
1. Follow the Quick Start Workflow in SKILL.md
2. Study official examples in `/root/repo/plugins/dify-official-plugins/`
3. Reference bundled documentation for implementation details
4. Use the build script at `/root/repo/scripts/build-difypkg.sh` as packaging reference
