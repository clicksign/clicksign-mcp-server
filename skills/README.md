# Skills

This directory holds [Agent Skills](https://agentskills.io) bundled with the Clicksign plugin.

| Skill | What it does |
|---|---|
| [`migrate-api-v1-to-v3`](migrate-api-v1-to-v3/SKILL.md) | Guides the migration of an integration from the legacy API 1.9 to API 3.0 (Envelope): asks for the missing context, maps each call, explains what has no direct equivalent and proposes the adapted code. It does not need the MCP connection. |

## Convention

Each skill lives in its own kebab-case directory:

```
skills/
└── <skill-name>/
    ├── SKILL.md          # required
    └── references/       # optional supporting files
```

`SKILL.md` starts with a YAML frontmatter block:

```markdown
---
name: <skill-name>        # must match the directory name, kebab-case
description: <what the skill does and when to use it>
---
```

`npm run validate` checks every `skills/*/SKILL.md` against these rules, and `npm run package` adds each skill directory to the plugin ZIP. This README is not packaged.
