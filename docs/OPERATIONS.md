# 운영 가이드 (TRR Website & Blog)

이 문서는 VPS 운영 관점의 필수 절차를 요약합니다. 로컬 개발 방법은 README도 참고하세요.

## 개요
- 도메인: `trr.co.kr`, `www.trr.co.kr`, `blog.trr.co.kr`
- 컨테이너(프로덕션)
  - 홈페이지: `traum-homepage` (127.0.0.1:17176 → Nginx 프록시)
  - 블로그: `traum-blog` (127.0.0.1:17177)
  - OAuth: `traum-blog-oauth` (127.0.0.1:17178)
- 리버스 프록시: `/etc/nginx/sites-enabled/trr.conf`
- TLS: Let’s Encrypt(`certbot`) 자동 갱신

## DNS 요약
- 네임서버는 기존(M365 사용처) 유지.
- A 레코드만 VPS로 지정: `@`, `www`, `blog` → `115.68.178.200`
- SOA/NS 수정 불필요.

## 환경변수(.env)
- 루트: `.env`(예시: `.env.example`)
  - `HTTP_BIND_HOST=127.0.0.1`, `HOMEPAGE_PORT=17176`
- 블로그 OAuth: `traum_blog/.env`(예시: `.env.example`)
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
  - `OAUTH_REDIRECT_URL=https://blog.trr.co.kr/oauth/callback`
  - `ALLOWED_ORIGINS=https://blog.trr.co.kr`
  - `GITHUB_SCOPE=public_repo`(공개 레포 기준)
  - (선택) `BASIC_AUTH_USER`, `BASIC_AUTH_PASS`
- 로컬 개발 편의: `DEV_UID`, `DEV_GID`(blog-local 전용)

## CI/CD
- 블로그 자동배포(무중단)
  - 워크플로: `.github/workflows/deploy-blog.yml`
  - 트리거: `traum_blog/**` 푸시 또는 /admin 발행
  - 동작: GitHub Actions → Hugo 빌드 → `/srv/traum_homepage/traum_blog/public/` rsync
  - Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_PORT(옵션)`, `DEPLOY_SSH_KEY`
- 홈페이지 CD(컨테이너 재빌드/재기동)
  - 워크플로: `.github/workflows/deploy-web.yml`
  - 트리거: `src/**`, `Dockerfile`, `nginx.conf`, `docker-compose.yml`
  - 동작: SSH → `/srv/traum_homepage` 최신화 → `docker compose build web && up -d web`

## 운영 명령(빈번)
```
# 컨테이너 상태/로그
docker ps
docker logs -f traum-homepage
docker logs -f traum-blog
docker logs -f traum-blog-oauth

# Nginx 적용/검사
nginx -t && systemctl reload nginx

# 인증서 갱신 리허설
certbot renew --dry-run

# 수동 재배포: (대부분 필요 없음)
cd /srv/traum_homepage/traum_blog && docker compose build blog && docker compose up -d blog
cd /srv/traum_homepage && docker compose build web && docker compose up -d web
```

## 프록시/TLS
- 프록시 파일: `/etc/nginx/sites-enabled/trr.conf`
  - `trr.co.kr` → `https://www.trr.co.kr` 301
  - `www.trr.co.kr` → 127.0.0.1:17176
  - `blog.trr.co.kr` → 127.0.0.1:17177, `/oauth/` → 127.0.0.1:17178/
- TLS 발급/갱신: `certbot --nginx -d trr.co.kr -d www.trr.co.kr -d blog.trr.co.kr`

## 보안 메모
- SSH 키 접속 사용. 필요 시 `sshd_config`에서 `PasswordAuthentication no`로 강화 가능.
- 컨테이너 런타임은 비루트(nginx-unprivileged / node 사용자).
- 비밀은 레포 커밋 금지(.env는 .gitignore 처리).

## 점검 체크리스트(빠른 확인)
```
curl -I https://www.trr.co.kr
curl -I https://blog.trr.co.kr
curl -I -L https://trr.co.kr  # www로 301 확인
```
