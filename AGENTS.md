# AGENTS.md — Working Rules for Agents/Contributors

Scope: Entire repository.

## Goals
- Keep this repo simple: static homepage + static blog with minimal infra.
- Favor unprivileged containers and loopback binds (no public ports from Compose).

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
- Local dev only: `DEV_UID`, `DEV_GID` for `blog-local` to avoid root-owned files.

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
- For local dev, `blog-local` supports host UID/GID via `DEV_UID/DEV_GID`.

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
- Homepage
  - Run (live mount): `docker compose up -d web-local`
  - Build+Run (prod): `docker compose build web && docker compose up -d web`
- Blog
  - `cd traum_blog && docker compose build blog && docker compose up -d blog`
  - OAuth for Decap CMS: set `traum_blog/.env` and `docker compose up -d oauth`

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
- No long-lived feature branches unless necessary.

## Commit Convention (Conventional Commits)
- Format: `type(scope)!: subject`
  - `type`: `feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`
  - `scope` (common): `web|blog|oauth|docs|ci|infra|nginx|compose|deps`
  - `subject`: imperative, concise, ≤ 72 chars, no trailing period
- Body (optional): explain the why, notable decisions, and risks. Wrap ~72 cols.
- Footer (optional): `Closes #123`, `Refs #456`. Use `BREAKING CHANGE:` for breaking.
- Breaking change: add `!` after scope and a `BREAKING CHANGE:` footer describing migration.
- Revert: `revert: <short-hash> <original subject>` and link the reason/issue.
- Language: Prefer English imperative for consistency; Korean allowed in the body when helpful.

Examples
- `feat(blog): add hero image support`
- `fix(oauth): handle missing code parameter (400)`
- `docs: add OPERATIONS.md and link from README`
- `ci(web): add deploy workflow (SSH compose build+up)`
- `refactor(web): extract nginx headers to template`
- `chore(deps): bump hugo base image`
- `revert: 1a2b3c4 fix(oauth): handle missing code parameter`

Granularity
- One logical change per commit; separate refactors from behavior changes.
- Squash before merge if PR contains fixup/cleanup commits.

## Troubleshooting
- File ownership issues: `sudo chown -R $USER:$USER <path>` then avoid root containers.
- Port conflicts: adjust `.env` ports; keep loopback binds.
