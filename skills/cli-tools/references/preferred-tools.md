# Preferred Tools - Detailed Reference

Modern CLI tools that replace legacy Unix utilities. See `SKILL.md` for the
full Legacy/Modern table — this file adds the install command and the
gotcha per tool that a generic tutorial would get wrong.

---

## File Search & Code Navigation

### rg (ripgrep) instead of grep

**Install:** `cargo install ripgrep` or `apt install ripgrep`

```bash
rg 'TODO|FIXME'                     # recursive by default, respects .gitignore
rg --json 'pattern' | jq 'select(.type == "match")'
```

### fd instead of find

**Install:** `cargo install fd-find` or `apt install fd-find`

```bash
fd -e json
```

CAUTION: `fd -e tmp -x rm {}` is destructive — preview matches with
`fd -e tmp` alone first.

### rga (ripgrep-all) instead of grep on documents

**Install:** `cargo install ripgrep_all` or download from
https://github.com/phiresky/ripgrep-all/releases

Searches inside PDFs, Office docs, ZIP archives, and SQLite databases by
converting to text on-the-fly: `rga 'financial statement' <path>`

### tokei / scc instead of cloc or wc -l

**Install:** `cargo install tokei` or `go install github.com/boyter/scc/v3@latest`

Both are far faster than cloc with accurate language detection. `scc`
additionally estimates complexity and cost (`scc --by-file`, `scc -f json`).

---

## Structured Data Processing

jq/yq/dasel/qsv usage depth (filtering, transforms, joins) lives in
`data-tools-skill` — this section covers only the install/selection gotcha
per tool.

### jq (JSON)

**Install:** `apt install jq` or https://jqlang.github.io/jq/

### yq (YAML)

**Install:** `go install github.com/mikefarah/yq/v4@latest` or `brew install yq`

**Important:** Do NOT use `pip install yq` — that installs kislyuk/yq, a
different (Python jq-wrapper) tool. This skill documents Mike Farah's
Go-based yq (`mikefarah/yq`).

### dasel (TOML/XML/JSON/YAML, one syntax)

**Install:** `go install github.com/tomwright/dasel/v2/cmd/dasel@latest`

Only tool in this catalog with native TOML support.

### qsv (CSV)

**Install:** https://github.com/dathere/qsv/releases

Handles quoting/headers/encoding correctly where `awk`/`sed` break; see
`data-tools-skill` for the cookbook, including `qsv sqlp` for SQL-on-CSV.

---

## Git & Diff Tools

### difft (difftastic) instead of diff

**Install:** `cargo install difftastic`

Structural diff — understands language syntax, ignores formatting-only
changes.

```bash
git config --global diff.tool difftastic
git config --global difftool.difftastic.cmd 'difft "$LOCAL" "$REMOTE"'
```

### git absorb instead of git commit --fixup

**Install:** `cargo install git-absorb`

Auto-identifies which staged hunks belong to which prior commit and
creates the fixup commits: `git add -p && git absorb`.

---

## Security

### semgrep instead of manual grep for security

**Install:** `pip install semgrep` or `brew install semgrep`

AST-aware static analysis with pre-built OWASP/CWE rulesets — far more
accurate than text-based grep patterns for security review.

```bash
semgrep --config auto --json . | jq '.results[] | {path: .path, line: .start.line}'
```

---

## Benchmarking

### hyperfine instead of time

**Install:** `cargo install hyperfine` or `apt install hyperfine`

```bash
hyperfine --warmup 3 'grep -r "pattern" .' 'rg "pattern"'
```

NOTE: `--prepare` commands that clear the page cache
(`echo 3 | sudo tee /proc/sys/vm/drop_caches`) require sudo/root.

Do not assert a speedup from memory — run hyperfine on the actual
workload before making the claim.

---

## Viewing & General

### bat instead of cat

**Install:** `cargo install bat` or `apt install bat` (binary is `batcat`
on Debian/Ubuntu — see `references/binary_to_tool_map.md`)

```bash
bat -pp data.json | jq '.'    # plain mode strips decoration for piping
```
