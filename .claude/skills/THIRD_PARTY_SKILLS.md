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

## Installed 2026-11-05 (Blue's instruction): Instagram skills

| Skill dir(s) | Upstream | Commit | License / note |
|---|---|---|---|
| ig-audit, ig-caption, ig-carousel, ig-comment, ig-dm, ig-human, ig-plan, ig-profile, ig-reel, ig-reply, ig-repurpose, ig-story, ig-viral | https://github.com/Jakeschincariol/instagram-agent-skill (`skills/*`) | d03c56b | MIT (`_licenses/instagram-agent-skill.MIT`). Copied verbatim, byte-identical to the audited upstream. `templates/voice.md` and the plugin manifest are not copied. |

Audit before install: the Python tools use only the standard library, no network, and write only to the `--out` path you give. The `SKILL.md` files hold no hidden instructions. The skills write drafts; a human posts.

Known limits (read before use):
- **Repo rules win.** `CLAUDE.md` §1: nothing a user wrote (emotions, diary, dreams, wishes, health) goes into a post, a caption, a screenshot or a test, even as an "example". Use invented text only.
- **English-tuned scripts.** On Chinese text `hookscore.py` counts "words" and spoken time wrongly, `detect.py` says "too short to judge", and `slop.json` is an English lexicon. `caption.py` character counts and the 125-character preview still work.
- **Voice file path is hardcoded** to `~/.claude/instagram/voice.md` (also `swipe.md`, `log.md`, `plan.md`). Two brands would share one voice file, and a cloud container does not keep `~`. Not fixed yet; decide a per-brand location with Blue first. No `voice.md` is committed here: it is unverified whether Vercel serves `.claude/` on this static site (no `.vercelignore`).
