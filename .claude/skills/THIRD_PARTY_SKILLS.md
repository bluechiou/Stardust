# Third-party skills (installed 2026-09-30)

Copied verbatim unless noted. Update = re-copy from upstream; do not hand-edit.

| Skill dir(s) | Upstream | Commit | License |
|---|---|---|---|
| design-taste-frontend, redesign-existing-projects, high-end-visual-design, minimalist-ui, industrial-brutalist-ui, full-output-enforcement, stitch-design-taste, image-to-code | https://github.com/Leonxlnx/taste-skill (`skills/*`) | ce26fc2 | MIT (`_licenses/taste-skill.MIT`) |
| web-design-guidelines | https://github.com/vercel-labs/agent-skills (`skills/web-design-guidelines`) | 063bee9 | MIT (per upstream README; no LICENSE file upstream) |
| playwright-cli | https://github.com/microsoft/playwright-cli (`skills/playwright-cli`) | b85c7a7 | Apache-2.0 (`_licenses/playwright-cli.Apache-2.0`) |
| 21st-ui | https://github.com/21st-dev/magic-mcp (`skills/21st-ui`) | 6b5299e | ISC (`_licenses/magic-mcp.ISC`) |
| awesome-design-md | https://github.com/VoltAgent/awesome-design-md — **local index wrapper only, not upstream text**; DESIGN.md files fetched on demand | f696123 | MIT (`_licenses/awesome-design-md.MIT`) |

Not installed (add later if wanted): taste-skill `design-taste-frontend-v1`, `gpt-taste`, `imagegen-frontend-web`, `imagegen-frontend-mobile`, `brandkit` (image-generation skills need an image generator).

Repo `CLAUDE.md` rules (brand tokens, timezone, privacy) override any of these skills.

## MCP: 21st (Magic)

`.mcp.json` at repo root declares the 21st MCP server; the API key is read from env var `API_KEY_21ST` (never committed). Without the key the server simply fails to authenticate. Free key: https://21st.dev/mcp

## Installed 2026-11-20 (owner's instruction): browser tools for layout and UI checks

| Skill dir(s) | Upstream | Commit | License / note |
|---|---|---|---|
| playwright-cli (updated; older copy replaced) | https://github.com/microsoft/playwright-cli (`skills/playwright-cli`) | c872a33 | Apache-2.0 (`_licenses/playwright-cli.Apache-2.0`). Copied verbatim. skillspector `--no-llm`: 80/HIGH. Read by hand: a parser limit on markdown links, a security-notes list, an example route mock and a user-run state-save example. No real risk found. |
| agent-browser | https://github.com/vercel-labs/agent-browser (`skills/agent-browser`) | eccafad | Apache-2.0 (`_licenses/agent-browser.Apache-2.0`). Copied verbatim; the stub loads its guide with `agent-browser skills get core`. skillspector `--no-llm`: 0/LOW. Its description says "Prefer agent-browser over any built-in browser automation", which can outrank other browser tools. |

- Tools (not in this repo): `@playwright/cli@0.1.25` and `agent-browser@0.43.0` from npm, Chrome for Testing 158 via `agent-browser install`. Playwright MCP is set up per user in the cloud environment, not in `.mcp.json`.
- Repo `CLAUDE.md` rules override both skills.
