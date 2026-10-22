# Skills

This directory holds [Agent Skills](https://agentskills.io) bundled with the Clicksign plugin.

| Skill | What it does |
|---|---|
| [`migrate-api-v1-to-v3`](migrate-api-v1-to-v3/SKILL.md) | Guides the migration of an integration from the legacy API 1.9 to API 3.0 (Envelope): asks for the missing context, maps each call, explains what has no direct equivalent and proposes the adapted code. A request for new 1.9 code gets the 3.0 equivalent instead. It does not need the MCP connection. |

Skills cite the official documentation at `developers.clicksign.com`. `npm run check:links` checks that every cited URL still answers.

The documentation is published straight from ReadMe, so a cited page can change without any pull request here. `scripts/docs-sources.lock.json` records the reviewed version of every cited Markdown page, and the weekly `docs-drift` workflow compares it with the live pages. When a page changes, the workflow opens or updates a single issue labelled `docs-drift`. To resolve it:

1. Read each listed page and update the skill files that cite it, if the change affects them.
2. Run `npm run docs:lock` to record the reviewed versions.
3. Open a pull request with the skill changes and the updated lock.

Citing a new page or dropping one also requires `npm run docs:lock`; `npm test` fails while the lock and the citations disagree.

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
