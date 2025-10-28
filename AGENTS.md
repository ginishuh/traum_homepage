# AGENTS.md — Working Rules for Agents/Contributors

Scope: Entire repository.

## Goals
- Keep this repo simple: static homepage + static blog with minimal infra.
- Favor unprivileged containers and loopback binds (no public ports from Compose).

## 언어 원칙
- 모든 에이전트/도우미의 대화형 응답은 한국어로 합니다.
- 문서는 한국어를 기본으로 작성합니다(README, OPERATIONS, 가이드 등).
- 코드 주석은 한국어를 기본으로 하되, 표준 명칭/식별자는 원문(영문) 유지 가능합니다.
- 외부 문서에서 가져온 고유 용어는 필요 시 영어 병기(예: Conventional Commits 타입/스코프).

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
- 문서는 한국어 기본, 표제/파일명은 상황에 따라 영문 허용.
- No long-lived feature branches unless necessary.

## Commit Convention (Conventional Commits)
- 형식: `type(scope)!: subject`
  - `type`: `feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`
  - `scope`(예): `web|blog|oauth|docs|ci|infra|nginx|compose|deps`
  - `subject`: 간결한 한국어 문장(72자 이내, 마침표 생략)
- 본문(선택): 변경 배경/의도/영향을 한국어로 기술(행 길이 ~72자 권장).
- 푸터(선택): `Closes #123`, `Refs #456`, 호환깨짐은 `BREAKING CHANGE:`로 기술.
- 호환깨짐: 스코프 뒤 `!` 표기 + `BREAKING CHANGE:` 푸터에 상세 서술.
- 되돌리기: `revert: <short-hash> <original subject>` 형식 + 사유 링크.
- 언어: Subject/Body는 한국어를 기본으로, `type`/`scope` 키워드는 Conventional 표준에 맞춰 영문 사용.

Examples
- `feat(blog): 대표 이미지 지원 추가`
- `fix(oauth): code 누락 시 400 처리`
- `docs: OPERATIONS.md 추가 및 README 링크`
- `ci(web): 배포 워크플로 추가(SSH compose build+up)`
- `refactor(web): nginx 헤더 템플릿 분리`
- `chore(deps): hugo 베이스 이미지 업데이트`
- `revert: 1a2b3c4 fix(oauth): code 누락 시 400 처리`

Granularity
- One logical change per commit; separate refactors from behavior changes.
- Squash before merge if PR contains fixup/cleanup commits.

## Troubleshooting
- File ownership issues: `sudo chown -R $USER:$USER <path>` then avoid root containers.
- Port conflicts: adjust `.env` ports; keep loopback binds.


## Commitlint
- PR에서만 검사합니다(직접 push에는 미적용). 블로그 CMS의 main 직접 커밋/배포에는 영향을 주지 않습니다.
- 규칙: Conventional Commits(한국어 subject 허용), 상세는 `.commitlintrc.yml` 참고.
