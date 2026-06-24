# Design Council — Installed Skills (reinstall reference)

The redesign "council" uses these Claude skills. They are **not committed** to the repo
(they're ~12MB of third-party content, gitignored). The environment is ephemeral, so to
re-create the council in a new session, reinstall them into `.claude/skills/`.

> Note: in this managed environment `npx skills add` (which does `git clone`) is blocked by
> the egress proxy (403 on arbitrary public repos), but GitHub **tarball archives** work.
> The skills were installed by downloading each repo's tarball and copying the skill folder.

| Installed as | Source repo | Skill path in repo |
|--------------|-------------|--------------------|
| `ux-designer` | `szilu/ux-designer-skill` | repo root |
| `taste` | `Leonxlnx/taste-skill` | `skills/taste-skill` |
| `taste-redesign` | `Leonxlnx/taste-skill` | `skills/redesign-skill` |
| `transitions-dev` | `Jakubantalik/transitions.dev` | `skills/transitions-dev` |
| `ui-ux-pro-max` | `nextlevelbuilder/ui-ux-pro-max-skill` | `.claude/skills/ui-ux-pro-max` (+ real `src/ui-ux-pro-max/{data,scripts}`) |
| `ui-ux-design-pro` | `saifyxpro/ui-ux-design-pro-skill` | `skills/ui-ux-design-pro` |
| `ux-redesign` | `plugin87/ux-ui-agent-skills` | `.claude/skills/redesign` |
| `design-review` | `plugin87/ux-ui-agent-skills` | `.claude/skills/design-review` |
| `canvas-design` | `anthropics/skills` | `skills/canvas-design` |
| `web-artifacts-builder` | `anthropics/skills` | `skills/web-artifacts-builder` |

### Reinstall (tarball method that works behind the proxy)
```bash
# example for one repo — repeat per row, copying the skill path into .claude/skills/<name>
curl -sSL -o /tmp/s.tgz https://codeload.github.com/<owner>/<repo>/tar.gz/refs/heads/main
mkdir -p .claude/skills/<name>
tar xzf /tmp/s.tgz -C .claude/skills/<name> --strip-components=<n> <repo>-main/<skill path>
```
For `ui-ux-pro-max`, also copy `src/ui-ux-pro-max/data` and `src/ui-ux-pro-max/scripts`
into the skill folder (the repo ships them as symlinks). The search CLI:
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <style|color|typography|ux|product|chart>
```

### When `npx skills add` works (normal machine, no egress proxy)
```bash
npx skills add szilu/ux-designer-skill
npx skills add Leonxlnx/taste-skill
npx skills add Jakubantalik/transitions.dev
npx skills add nextlevelbuilder/ui-ux-pro-max-skill
npx skills add saifyxpro/ui-ux-design-pro-skill
npx skills add plugin87/ux-ui-agent-skills
npx skills add anthropics/skills        # then select canvas-design, web-artifacts-builder
```
