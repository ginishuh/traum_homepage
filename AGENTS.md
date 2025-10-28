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
- Commit messages: `type(scope): subject` (e.g., `feat(blog): add search`).
- No long-lived feature branches unless necessary.

## Troubleshooting
- File ownership issues: `sudo chown -R $USER:$USER <path>` then avoid root containers.
- Port conflicts: adjust `.env` ports; keep loopback binds.
