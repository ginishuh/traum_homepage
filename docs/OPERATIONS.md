# 운영 가이드 (TRR Website & Blog)

이 문서는 VPS 운영 관점의 필수 절차를 요약합니다. 로컬 개발 방법은 README도 참고하세요.

## 개요
- 도메인: `trr.co.kr`, `www.trr.co.kr`, `blog.trr.co.kr`
- 프로덕션 구성(정적 전환)
  - 홈페이지: 호스트 Nginx가 `/srv/www/trr/` 정적 서빙(컨테이너 미사용)
  - 블로그: Hugo 빌드 산출물 `/srv/traum_homepage/traum_blog/public/` 정적 서빙
  - OAuth: `traum-blog-oauth` (127.0.0.1:17203 → 3000, 컨테이너 유지)
- 리버스 프록시: `/etc/nginx/sites-enabled/trr.conf`
- TLS: Let’s Encrypt(`certbot`) 자동 갱신

## DNS 요약
- 네임서버는 기존(M365 사용처) 유지.
- A 레코드만 VPS로 지정: `@`, `www`, `blog` → `서버_IP`  
  (반드시 실제 VPS 공인 IP를 입력하세요. 예: 203.0.113.10 는 문서용 예시)
- SOA/NS 수정 불필요.

## 환경변수(.env)
- 루트: `.env`(예시: `.env.example`)
  - `HTTP_BIND_HOST=127.0.0.1`, `HOMEPAGE_PORT=17201`
- 블로그 OAuth: `traum_blog/.env`(예시: `.env.example`)
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
  - `OAUTH_REDIRECT_URL=https://blog.trr.co.kr/oauth/callback`
  - `ALLOWED_ORIGINS=https://blog.trr.co.kr`
  - `GITHUB_SCOPE=public_repo`(공개 레포 기준)
  - (선택) `BASIC_AUTH_USER`, `BASIC_AUTH_PASS`
 

## CI/CD
- 블로그 자동배포(무중단)
  - 워크플로: `.github/workflows/deploy-blog.yml`
  - 트리거: `traum_blog/**` 푸시 또는 /admin 발행
  - 동작: GitHub Actions → Hugo 빌드 → `/srv/traum_homepage/traum_blog/public/` rsync
  - Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_PORT(옵션)`, `DEPLOY_SSH_KEY`
 - 홈페이지 CD(정적 배포)
  - 워크플로: `.github/workflows/deploy-web.yml`
  - 트리거: `src/**`
- 동작: rsync `src/` → `/srv/www/trr/` (필요 시 nginx reload)

## 운영 명령(빈번)
```
# 정적 동기화(수동)
rsync -az --delete src/ user@host:/srv/www/trr/

# 컨테이너 로그(OAuth)
docker logs -f traum-blog-oauth

# Nginx 적용/검사
nginx -t && systemctl reload nginx

# 인증서 갱신 리허설
certbot renew --dry-run
```

### nginx reload 권한 설정(선택)
- Actions 워크플로는 배포 후 `sudo -n systemctl reload nginx || sudo -n nginx -s reload || true`를 시도합니다.
- 비대화식 재로드를 허용하려면 배포 계정에 제한된 `sudoers` 규칙을 추가하세요(호스트에서 실행).
  ```
  # /etc/sudoers.d/trr-nginx-reload
  deploy ALL=(root) NOPASSWD:/bin/systemctl reload nginx,/usr/sbin/nginx -s reload
  ```
  - `deploy`는 실제 배포 사용자로 치환
  - 필요 최소 명령만 허용하도록 유지

## 프록시/TLS
- 프록시 파일: `/etc/nginx/sites-enabled/trr.conf`
  - `trr.co.kr` → `https://www.trr.co.kr` 301
- `www.trr.co.kr` → root `/srv/www/trr/`
  - `blog.trr.co.kr` → root `/srv/traum_homepage/traum_blog/public/`, `/oauth/` → 127.0.0.1:17203/

## 검증 체크리스트(정적 전환)
- `curl -I https://www.trr.co.kr` 200 OK 확인
- `curl -I https://blog.trr.co.kr/admin/config.yml` → 200, `Content-Type: text/yaml` 확인
- `curl -I https://www.trr.co.kr/styles.css` 등 정적 자산에 `Cache-Control: public, max-age=2592000, immutable` 확인
- 블로그 `/admin` 로그인 플로우 정상(Decap CMS OAuth 프록시 127.0.0.1:17203 동작)
- 외부 공개 포트 무노출(Compose 바인드는 루프백 고정)

## 롤백 절차(요약)
1) vhost를 이전 프록시 방식으로 되돌림
   - `www` → `http://127.0.0.1:17201`, `blog` → `http://127.0.0.1:17202`, `/oauth/` → `http://127.0.0.1:17203/`
2) 필요 시 컨테이너 복구: `docker compose build web && docker compose up -d web`
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

## Decap CMS 로그인 점검
- GitHub OAuth App
  - Homepage URL: `https://blog.trr.co.kr`
  - Authorization callback URL: `https://blog.trr.co.kr/oauth/callback`
  - Private 레포면 `GITHUB_SCOPE=repo`, 공개 레포면 `public_repo`
- 설정 파일 복사
  - 로컬: `cp traum_blog/static/admin/config.dev.yml traum_blog/static/admin/config.yml`
  - 운영: Actions가 자동으로 `config.yml`을 생성합니다(없을 경우 `config.prod.yml`을 사용)
  - Nginx에서 YAML MIME 고정(오류 예방)
    ```nginx
    location = /admin/config.yml {
        types { };
        default_type text/yaml;
        try_files $uri =404;
    }
    ```
- 로컬 확인: `http://localhost:17202/admin/`
- 자동 테스트: `OAUTH_TEST_MODE=1 npx playwright test` (사전에 `cd tests/e2e && npm install`)
- `.env` 기본값은 `DEV_ALLOW_ALL_ORIGINS=0`, `OAUTH_TEST_MODE=0` (테스트 시에만 1로 전환)
- `.env` 수정 후에는 `docker compose up -d --force-recreate --no-deps oauth` 로 OAuth 컨테이너 재기동
