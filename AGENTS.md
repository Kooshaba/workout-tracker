<!-- CODEGRAPH_START -->
## CodeGraph

This project has a CodeGraph MCP server (`codegraph_*` tools) configured. Use CodeGraph for structural questions such as symbol definitions, callers, callees, impact analysis, and focused code context. Use native search only for literal text queries or after a specific file is already identified.

If `.codegraph/` does not exist, ask before initializing it.
<!-- CODEGRAPH_END -->

## Workspace Preference

- Create new project folders under `/Users/kooshaba/workspace` unless the user explicitly asks for a different location.

## UI Copy

- Never expose implementation details in user-facing UI copy. Avoid internal platform, storage, API, infrastructure, version, or configuration names such as Worker, D1, API URL, environment variables, and similar build/deployment details. Describe the user-visible outcome instead.
