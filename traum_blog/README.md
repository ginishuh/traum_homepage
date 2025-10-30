# traum_blog (Hugo + Decap CMS)

- 정적 블로그(Hugo) + 글쓰기 UI(Decap CMS)
- 배포 대상: `blog.trr.co.kr`
- 구성: 정적 웹(nginx-unprivileged) + GitHub OAuth 서버(Node) 컨테이너

## 포트
- 블로그 웹: 127.0.0.1:17177 → 컨테이너 8080
- OAuth 서버: 127.0.0.1:17178 → 컨테이너 3000

## 빠른 시작(로컬)
```bash
cd traum_blog
# 정적 빌드 이미지(운영과 동일 경로)
docker compose build blog && docker compose up -d blog
# (선택) OAuth 서버
docker compose up -d oauth
# Admin UI (Decap) 정적 파일: http://localhost:17177/admin/
#  - 로컬/운영을 자동으로 판별해 `/admin/config.dev.yml` 또는 `/admin/config.yml` 설정을 불러옵니다.
```

### 캐시 없이 빌드(중요)
- Decap CMS 스크립트/스타일 변경 시 로컬/브라우저 캐시가 강함(immutable)
- 아래처럼 항상 `--no-cache`로 빌드하거나, CSS 링크에 버전 쿼리를 갱신하세요.
```bash
cd traum_blog
docker compose build --no-cache blog && docker compose up -d blog
```
> 배포 시에도 스태틱 파일은 30일 캐시/immutable입니다. 템플릿의 CSS 링크에 버전 쿼리(`?v=yyyymmdd`)를 갱신해 배포하세요.

### Decap CMS 스크립트 업데이트
- 관리자 UI는 `static/admin/decap-cms.js`와 `static/admin/decap-cms.js.LICENSE.txt`(레포에 커밋된 파일)를 그대로 서빙합니다.
- 새 버전으로 갱신하려면 다음 명령을 실행한 뒤 변경분을 커밋하세요.
  ```bash
  curl -fsSL https://unpkg.com/decap-cms@3.8.4/dist/decap-cms.js -o static/admin/decap-cms.js
  curl -fsSL https://unpkg.com/decap-cms@3.8.4/dist/decap-cms.js.LICENSE.txt -o static/admin/decap-cms.js.LICENSE.txt
  ```
- 버전 업그레이드 시에는 위 URL의 버전을 원하는 릴리즈로 바꾸고, `layouts/_default/baseof.html`의 CSS/JS 쿼리 스트링도 함께 갱신하세요.
- OAuth 리다이렉트/토큰 수신은 **호스트명이 동일해야** 하므로, 로컬 테스트 시 반드시 `http://localhost:17177/admin/`으로 접속하세요.

## 운영(VPS)
1) GitHub OAuth App 생성
   - Homepage URL: https://blog.trr.co.kr
   - Authorization callback URL: https://blog.trr.co.kr/oauth/callback
   - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` 확보
2) `.env` 만들기
```env
# OAuth Server
GITHUB_CLIENT_ID=xxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxx
ALLOWED_ORIGINS=https://blog.trr.co.kr
OAUTH_REDIRECT_URL=https://blog.trr.co.kr/oauth/callback
# private repo면 전체 권한이 필요 → repo, 공개만이면 public_repo
GITHUB_SCOPE=repo
```
3) 컨테이너 기동
```bash
cd ~/traum_homepage/traum_blog
docker compose build blog
docker compose up -d blog oauth
```
4) 리버스 프록시(Nginx) 호스트 설정
```nginx
# /etc/nginx/sites-available/blog.trr.co.kr
server {
    listen 80;
    server_name blog.trr.co.kr;

    location / {
        proxy_pass http://127.0.0.1:17177;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    # OAuth 엔드포인트 경유
    location /oauth/ {
        proxy_pass http://127.0.0.1:17178/;
        proxy_set_header Host $host;
    }
}
```
- TLS(certbot) 적용 후 443 서버블록 추가 권장.

## Decap CMS
- 접근: https://blog.trr.co.kr/admin/
- GitHub 로그인 → repo에 글(.md) 커밋/PR(편집 워크플로) 발생
- 설정: `static/admin/config.yml`
- .env 변경 시 OAuth 컨테이너 재생성 필요:
```bash
cd traum_blog && docker compose up -d --force-recreate --no-deps oauth
```
 - GitHub 권한 스코프를 변경했다면, GitHub > Settings > Applications > Authorized OAuth Apps에서 기존 승인을 Revoke 후 다시 로그인하세요.

## 폴더 구조
```
traum_blog/
  docker-compose.yml
  Dockerfile            # Hugo 빌드 → nginx-unpriv serve
  nginx.conf
  config.toml           # Hugo 설정(baseURL 등)
  content/              # Hugo 콘텐츠(Markdown)
  layouts/              # 최소 템플릿
  static/
    admin/
      index.html        # Decap CMS 앱
      config.yml        # CMS 설정(GitHub backend)
  oauth/
    Dockerfile
    package.json
    server.js           # GitHub OAuth 프록시(Decap용)
```

## 참고
- Decap GitHub 백엔드와 OAuth 프록시 필요사항은 공식 문서와 예시를 따릅니다.
