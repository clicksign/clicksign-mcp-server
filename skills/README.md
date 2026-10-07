# Skills

This directory holds [Agent Skills](https://agentskills.io) bundled with the Clicksign plugin. There are no skills yet: the plugin currently provides only the connection to the Clicksign MCP server.

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
