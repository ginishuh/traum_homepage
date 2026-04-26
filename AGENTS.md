# AGENTS.md - traum_homepage

Scope: Entire repository.

## Goals
- Keep this repo simple: static homepage + static blog with minimal infra.
- Prefer unprivileged containers and loopback binds. Do not expose public ports directly from Compose.
- Production traffic is terminated by host Nginx/TLS and routed to static files or loopback services.

## Project Structure
- `src/`: static homepage assets.
- `traum_blog/`: Hugo/Decap CMS blog and OAuth helper.
- `docs/OPERATIONS.md`: operational runbook.
- `docker-compose.yml`, `traum_blog/docker-compose.yml`: local/runtime service definitions.
- `.github/workflows/`: web/blog deploy workflows.

## Local Commands
- Homepage: `docker compose build web && docker compose up -d web`.
- Blog: `cd traum_blog && docker compose build blog && docker compose up -d blog`.
- OAuth for Decap CMS: `cd traum_blog && docker compose up -d oauth` after setting `traum_blog/.env`.
- After editing `.env`: `cd traum_blog && docker compose up -d --force-recreate --no-deps oauth`.

## VPS 운영 공통 원칙 (/srv)
- 운영 작업은 항상 대상 리포의 `/srv/<repo>` 경로에서 직접 수행합니다.
- 작업 시작 전 `pwd`와 `git remote -v`로 리포/원격을 확인합니다.
- 서로 다른 리포의 배포 스크립트, Compose 파일, 환경 파일을 혼용하지 않습니다.
- 환경 변수는 대문자 스네이크 케이스를 사용하고, 새 값은 `.env.example` 또는 해당 예제 파일에 설명을 남깁니다.
- `.env`, 키 파일, 인증서, DB 백업, 토큰은 절대 커밋하지 않습니다.
- 공개 포트는 최소화하고 가능하면 `127.0.0.1`에 바인딩합니다. 외부 노출은 Nginx/리버스 프록시에서 처리합니다.
- 배포 전 백업/롤백 경로를 확인하고, 위험 작업은 되돌릴 수 있는 상태에서만 진행합니다.
- 배포 후에는 같은 리포 기준으로 상태, 헬스체크, 최근 로그를 검증합니다.

## 공통 운영 명령
- `docker compose ps`: 컨테이너 상태 확인.
- `docker compose logs --since 10m`: 최근 로그 확인.
- `/root/scripts/post_deploy_check.sh <repo-name|repo-path> [health_url ...]`: 배포 후 공통 점검.
- `journalctl -u <service> --since "1 hour ago" --no-pager`: systemd 서비스 장애 추적.
- `certbot certificates`: 인증서 만료와 도메인 매핑 점검.

## 한국어 응대 원칙
- 운영 보고, 장애 공유, 작업 결과는 한국어로 작성합니다.
- 명령어, 경로, 환경 변수는 원문 그대로 백틱(``)으로 표기합니다.
- 긴급 이슈는 `현상 → 영향 → 조치 → 검증 → 재발 방지` 순서로 간결하게 보고합니다.
- 날짜/시간은 절대값으로 명시합니다. 예: `2026-04-26 14:30 KST`.


## Env Vars
- Root `.env`: `HTTP_BIND_HOST` (default `127.0.0.1`), `HOMEPAGE_PORT` (default `17201`).
- Blog OAuth `traum_blog/.env`: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `OAUTH_REDIRECT_URL`, `ALLOWED_ORIGINS`, `GITHUB_SCOPE`.
- Optional metrics/basic auth variables must stay out of git and be documented in example files when changed.

## Runtime and Network
- Web/Blog runtime images use `nginxinc/nginx-unprivileged` and expose container port `8080`.
- OAuth runtime uses `USER node`; do not switch back to root.
- Host ports:
  - Homepage: `127.0.0.1:17201 -> 8080`
  - Blog: `127.0.0.1:17202 -> 8080`
  - OAuth: `127.0.0.1:17203 -> 3000`
- Active host vhost: `/etc/nginx/sites-enabled/trr.conf`.
- Do not hand-edit Nginx lines marked `# managed by Certbot`.

## Build and Cache
- Prefer cacheless builds for static asset deploy checks:
  - Blog: `cd traum_blog && docker compose build --no-cache blog && docker compose up -d blog`
  - Web: `docker compose build --no-cache web && docker compose up -d web`
- When deploying styles/scripts, bump query-string versions in templates.

## Style and Git
- Documentation is Korean by default; this AGENTS file may keep short English labels where useful.
- Keep README and `.env.example` files accurate when variables or workflows change.
- Use Conventional Commits. Examples: `fix(oauth): return 400 when code missing`, `docs: update operations runbook`.
- PR titles use Conventional Commits and the repository PR template.
- Do not edit PR body text except checkboxes; use comments or commits for progress details.
