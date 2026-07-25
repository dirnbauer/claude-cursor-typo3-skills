# Troubleshooting

## PATH Issues

When a tool installs but still shows "command not found":

1. **Check where it was installed:**
   ```bash
   # Common install locations
   ls -la ~/.local/bin/<tool>
   ls -la ~/.cargo/bin/<tool>
   ls -la ~/.npm-global/bin/<tool>
   ls -la /usr/local/bin/<tool>
   ```

2. **Ensure PATH includes common directories:**
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$HOME/.npm-global/bin:$PATH"
   ```

3. **Reload shell configuration:**
   ```bash
   source ~/.bashrc        # or ~/.zshrc
   hash -r                 # Clear command cache
   exec $SHELL             # Restart shell
   ```

## Node/nvm: global installs land off-PATH (a `node` shim hijacks npm's prefix)

When a global install succeeds (`npm i -g <tool>` reports "added N packages") but
`command -v <tool>` then fails — or `npm prefix -g` points at a Node version that
isn't your active/default one — suspect a **manual `node` symlink on PATH ahead of
nvm** (commonly `~/.local/bin/node`, often created to give another tool a stable
node).

Because that shim is first on PATH, **every** `node`/`npm` resolves through it, so
npm's global prefix is locked to that Node's tree — and globals (eslint, pnpm,
prettier, …) land in a `bin/` that isn't on PATH. npm self-update can also hit the
wrong tree.

Diagnose:

```bash
command -v node                 # may show only the shim, e.g. ~/.local/bin/node
node -p 'process.execPath'      # the REAL node the shim points at
npm prefix -g                   # the prefix globals install into
nvm version default             # what nvm thinks the default is
```

If `process.execPath` / `npm prefix -g` disagree with the nvm default, the shim is
the cause.

Fix — remove or re-point the shim identified above (the `node` on PATH that is
**not** under `~/.nvm` — commonly `~/.local/bin/node`, but use the path your
diagnosis returned), then align the nvm default:

```bash
SHIM=~/.local/bin/node          # <- replace with the shim path from the diagnosis
rm "$SHIM"                      # or: ln -sf "$(nvm which default)" "$SHIM"
nvm alias default node          # point default at the newest installed Node
hash -r
```

## Installation Blocked (Permission/System Restrictions)

When system prevents normal installation, use these alternatives:

1. **Docker (no install required):**
   ```bash
   # Run tool in container
   docker run --rm -v "$PWD:/work" -w /work <tool-image> <tool> <args>

   # Create alias for convenience
   alias <tool>='docker run --rm -v "$PWD:/work" -w /work <tool-image> <tool>'
   ```

2. **Manual binary download:**
   ```bash
   # Download release binary directly
   curl -L <release-url> -o ~/.local/bin/<tool>
   chmod +x ~/.local/bin/<tool>
   ```

3. **Compile from source:**
   ```bash
   git clone <repo-url>
   cd <repo>
   make && make install PREFIX=~/.local
   ```

4. **Use package manager with user scope:**
   ```bash
   pip install --user <tool>
   npm install -g <tool> --prefix ~/.npm-global
   cargo install <tool>  # Installs to ~/.cargo/bin
   ```

## Batch Updaters That "Freeze"

A batch update script that suppresses output (`cmd >/dev/null 2>&1`) but leaves
stdin attached to the terminal turns any hidden interactive prompt into an
invisible, indefinite hang — observed with `composer global update` waiting
hours on an unseen GitHub-token prompt.

When wrapping package-manager commands for unattended runs:

1. **Detach stdin**: run every command `</dev/null` so a prompt hits EOF and
   fails fast instead of blocking on the terminal.
2. **Prefer the tool's non-interactive flag** (`composer --no-interaction`,
   `apt-get -y` + `DEBIAN_FRONTEND=noninteractive`, `npm --yes`).
3. **Surface failures**: don't `|| true` into silence — capture output to a
   temp file and print the exit code plus the last ~20 lines when a command
   fails, or the hang/failure is undiagnosable.
4. **Diagnose a stuck run** via `/proc/<pid>/fd` (fd 0 → `/dev/pts/*` with
   fd 1/2 → `/dev/null` = waiting on an invisible prompt) and
   `/proc/<pid>/wchan` (`wait_woken` ≈ tty read).

## `timeout` Is Not Portable — Guard It

`timeout` is GNU coreutils. A stock macOS does **not** ship it (Homebrew
coreutils provides `gtimeout`), so a hard-coded `timeout 2 <tool> --version`
does not merely lose its time bound — the whole command fails with
`timeout: command not found`, producing **empty output**. Wrapped in the usual
`|| true` / `2>/dev/null`, that failure is silent, and every downstream check
sees "the tool produced nothing" rather than "the guard is missing". Symptom on
a CI matrix: a step that works on `ubuntu-latest` and fails on `macos-latest`
with the tool reported as absent or unversioned.

Resolve it once and reuse:

```bash
run_bounded() {            # run_bounded SECONDS CMD...
  local secs="$1"; shift
  if command -v timeout >/dev/null 2>&1;  then timeout  "$secs" "$@"
  elif command -v gtimeout >/dev/null 2>&1; then gtimeout "$secs" "$@"
  else "$@"                # no bound available — still correct, just unbounded
  fi
}
```

Falling back to an unbounded run is the right default: `</dev/null` is what
actually prevents the common hang (a command blocking on a prompt), and it is
portable. The timeout is the second line of defence, for a command that blocks
on something other than stdin.

## Probing a Tool for a Capability: Validate the Output Shape

When detecting whether a CLI supports something by *running* it
(`<tool> completion bash`, `<tool> --version`, `<tool> config get …`), a
non-zero exit is not the only failure mode, and neither is empty output. A tool
that does not recognise the subcommand may **treat your probe words as
arguments and do real work**: `bandit complete bash` runs a security scan over
paths named `complete` and `bash`, exits 0, and prints a report that contains
the word "complete" — passing any check that merely greps for a keyword.

So:

1. **Validate the shape of what came back**, not just that something did. For a
   bash completion script, require an actual registration
   (`complete -…`, `compgen `, `COMPREPLY`) rather than the substring
   `complete`.
2. **Run probes from a scratch directory** with stdin detached, so a
   misinterpreted argument cannot match real files or consume input.
3. **Confirm the result refers to the tool you probed.** A wrapper can return
   its host's answer: `rga --generate complete-bash` forwards to ripgrep and
   returns ripgrep's script verbatim, and a `gh` extension's `completion`
   subcommand can emit `gh`'s own completion. Installing either under the
   wrapper's name shadows the host tool.
