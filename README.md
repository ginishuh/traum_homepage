# TRR Website & Blog

정적 홈페이지(`www.trr.co.kr`)와 블로그(`blog.trr.co.kr`)를 컨테이너로 운영하는 단일 레포입니다.

## 폴더 구조
- `src/` — 홈페이지 정적 파일(HTML/CSS/JS)
- `Dockerfile` — 홈페이지 빌드/런(nginx unprivileged, 8080)
- `nginx.conf` — 보안 헤더/캐시/압축 기본 설정
- `docker-compose.yml`
  - `web` — 프로덕션(이미지 빌드 후 실행)
  - `web-local` — 로컬 개발(소스 마운트)
- `traum_blog/` — Hugo + Decap CMS 블로그(별도 compose/Dockerfile 포함)

## 환경변수(.env)
홈페이지 컨테이너 바인딩은 `.env`로 조정합니다. 예시는 `.env.example` 참고.

```
HTTP_BIND_HOST=127.0.0.1
HOMEPAGE_PORT=17176
```

## 로컬 실행
```bash
cd traum_homepage
# 홈페이지(라이브 마운트, http://127.0.0.1:17176)
docker compose up -d web-local

# 블로그(정적 이미지 빌드, http://127.0.0.1:17177)
cd traum_blog && docker compose build blog && docker compose up -d blog
# (선택) CMS OAuth 프록시: .env 설정 후
docker compose up -d oauth
```

## VPS 배포
1) DNS
   - `www.trr.co.kr` → VPS IP
   - `blog.trr.co.kr` → VPS IP
2) 컨테이너
```bash
# 홈페이지
cd ~/traum_homepage
docker compose build web && docker compose up -d web

# 블로그
cd ~/traum_homepage/traum_blog
docker compose build blog && docker compose up -d blog oauth
```
3) 리버스 프록시(Nginx 예시)
```
server {
    listen 80; server_name www.trr.co.kr;
    location / { proxy_pass http://127.0.0.1:17176; proxy_set_header Host $host; }
}
server {
    listen 80; server_name blog.trr.co.kr;
    location /      { proxy_pass http://127.0.0.1:17177; proxy_set_header Host $host; }
    location /oauth/ { proxy_pass http://127.0.0.1:17178/; proxy_set_header Host $host; }
}
```
4) TLS는 certbot 또는 Caddy/Traefik 권장.

## 블로그(Decap CMS)
- 관리페이지: `https://blog.trr.co.kr/admin/`
- GitHub OAuth App 등록(Homepage/Callback URL은 README의 블로그 섹션 참조)
- `traum_blog/.env.example`을 복사해 값 설정 후 `oauth` 서비스 기동

## 주의
- `.env`와 인증서는 커밋 금지(.gitignore 반영)
- 컨테이너는 비루트 이미지(`nginxinc/nginx-unprivileged`) 사용, 포트는 8080 고정
