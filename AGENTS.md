# AGENTS.md — Working Rules for Agents/Contributors

Scope: Entire repository.

## Goals
- Keep this repo simple: static homepage + static blog with minimal infra.
- Prefer unprivileged containers and loopback binds (no public ports from Compose).

## Language
- Interactive responses from agents/helpers: Korean (all conversations must be in Korean).
- Documentation (README, OPERATIONS, guides, PR template): Korean by default.
- This file (AGENTS.md) is intentionally written in English; other docs remain Korean.
- Code comments: Korean by default; keep standard identifiers/terms in original English when needed.
- Borrowed proper nouns/terms from external docs may remain in English (e.g., Conventional Commits type/scope).

## Do / Don’t
- Do use `nginxinc/nginx-unprivileged` and expose 8080 only.
- Do bind ports on loopback: `127.0.0.1:PORT:8080`.
- Do not commit secrets. `.env` files are ignored. Use `.env.example`.
- Do not run dev scripts with `sudo`. If Docker writes files, fix UID/GID mapping.

## Env Vars
- Root `.env` (used by Compose):
  - `HTTP_BIND_HOST` (default `127.0.0.1`)
  - `HOMEPAGE_PORT` (default `17176`)
- Blog OAuth `traum_blog/.env`:
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
  - `OAUTH_REDIRECT_URL` (e.g., `https://blog.trr.co.kr/oauth/callback`)
  - `ALLOWED_ORIGINS` (e.g., `https://blog.trr.co.kr`)
  - `GITHUB_SCOPE` = `public_repo` (public repo) or `repo` (private repo)
  - Optional: `BASIC_AUTH_USER`, `BASIC_AUTH_PASS`

## CI / CD (GitHub Actions)
- Blog auto-deploy: `.github/workflows/deploy-blog.yml`
  - Trigger: `traum_blog/**` changes or Decap CMS commits.
  - Action: Hugo build → rsync to `/srv/traum_homepage/traum_blog/public/` (no container restart).
  - Secrets required: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_PORT`(optional), `DEPLOY_SSH_KEY`.
- Web CD: `.github/workflows/deploy-web.yml`
  - Trigger: `src/**`, `Dockerfile`, `nginx.conf`, `docker-compose.yml` changes.
  - Action: SSH → `git reset --hard origin/main` → `docker compose build web && up -d web`.
- Optional Slack: `SLACK_WEBHOOK_URL` (if present, sends status notifications).

## Runtime users (non-root)
- Web/Blog runtime images are `nginxinc/nginx-unprivileged` (non-root 8080).
- OAuth runtime uses `USER node` (non-root). Do not switch back to root.

## Nginx / TLS (host)
- Active vhost: `/etc/nginx/sites-enabled/trr.conf`.
  - `trr.co.kr` → 301 to `https://www.trr.co.kr`.
  - `www.trr.co.kr` → `127.0.0.1:17176` (homepage).
  - `blog.trr.co.kr` → `127.0.0.1:17177`, `/oauth/` → `127.0.0.1:17178/`.
- TLS via certbot (`/etc/letsencrypt/live/trr.co.kr/…`).
- Do not hand-edit lines marked “# managed by Certbot”.

## DNS
- Keep existing nameservers (e.g., M365). Only add A records:
  - `@`, `www`, `blog` → VPS IP.
- SOA/NS remain managed by the DNS provider.

## Ops Runbook
- See `docs/OPERATIONS.md` for common commands, checks, and procedures.

## Local commands
- Homepage: `docker compose build web && docker compose up -d web`
- Blog: `cd traum_blog && docker compose build blog && docker compose up -d blog`
- OAuth for Decap CMS: in `cd traum_blog`, set `.env` then `docker compose up -d oauth`
- CMS Admin URLs
  - Local: `http://localhost:17177/admin/?config=config.dev.yml`
  - Production: `https://blog.trr.co.kr/admin/`

## Build/Cache
- Always prefer cacheless builds for static assets to avoid stale bundles (immutable caching in Nginx/Hugo output).
  - Blog (local): `cd traum_blog && docker compose build --no-cache blog && docker compose up -d blog`
  - Web  (local): `docker compose build --no-cache web && docker compose up -d web`
- When deploying styles/scripts, bump query-string versions in templates (e.g., `/css/blog.css?v=YYYYMMDD`).
- After changing `traum_blog/.env`, recreate only the OAuth container to apply new secrets/scopes:
  - `cd traum_blog && docker compose up -d --force-recreate --no-deps oauth`

## Ports
- Homepage: 127.0.0.1:17176 → 8080
- Blog:     127.0.0.1:17177 → 8080
- OAuth:    127.0.0.1:17178 → 3000

## Reverse proxy
- Terminate TLS at the host Nginx/Caddy/Traefik.
- Host routing:
  - `www.trr.co.kr` → `http://127.0.0.1:17176`
  - `blog.trr.co.kr` → `http://127.0.0.1:17177`, `/oauth/` → `http://127.0.0.1:17178/`

## Content workflow
- Homepage: edit under `src/` then rebuild.
- Blog: write posts in Decap CMS (`/admin`) → commits/PRs to this repo.

## Style / Git
- Keep README accurate. Update `.env.example` when variables change.
- Docs are Korean by default; file names/headings may be English when appropriate.
- No long-lived feature branches unless necessary.

## Commit Convention (Conventional Commits)
- Format: `type(scope)!: subject`
  - `type`: `feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|content|post|blog`
  - `scope` (e.g.): `web|blog|oauth|docs|ci|infra|nginx|compose|deps`
  - `subject`: concise English sentence, no trailing period (≤ 200 chars)
- Body (optional): motivation/impact (wrap at ~72 chars).
- Footer (optional): `Closes #123`, `Refs #456`; breaking changes via `BREAKING CHANGE:`.
- Breaking: add `!` after scope and describe in footer.
- Revert: `revert: <short-hash> <original subject>` with reason link.

Examples
- `feat(blog): add archive global search`
- `fix(oauth): return 400 when code missing`
- `docs: add OPERATIONS.md and link from README`
- `ci(web): add deploy workflow (SSH compose build+up)`
- `refactor(web): extract nginx header templates`
- `chore(deps): update hugo base image`
- `revert: 1a2b3c4 fix(oauth): return 400 when code missing`

Granularity
- One logical change per commit; separate refactors from behavior changes.
- Squash before merge if PR contains fixup/cleanup commits.

## PR / Review Rules
- PR title uses Conventional Commits (`type(scope): subject`), subject in English.
- Use `.github/pull_request_template.md`.
- Progress updates go to PR comments only. Keep the PR body structure; only tick checkboxes.
- Do not edit PR body text except checkboxes. Use comments or follow-up commits for explanations.
- Commitlint: header max 200; otherwise follow Conventional rules.
- Address review feedback in small commits and summarize in a comment.

## Troubleshooting
- File ownership issues: `sudo chown -R $USER:$USER <path>` then avoid root containers.
- Port conflicts: adjust `.env` ports; keep loopback binds.
- GitHub OAuth login fails
  - OAuth app: Homepage `https://blog.trr.co.kr`, Callback `https://blog.trr.co.kr/oauth/callback`
  - Scope: `public_repo` for public repo, use `repo` for private repo
  - Reproduce locally: `http://localhost:17177/admin/?config=config.dev.yml`
  - Test: `cd tests/e2e && npm install && npx playwright test`


## Commitlint
- Runs on PRs only (direct pushes not enforced). Blog CMS direct commits/deploy not affected.
- Rules: Conventional Commits; header max 200. See `.commitlintrc.yml`.
