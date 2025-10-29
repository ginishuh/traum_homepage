# TRR Website & Blog

정적 홈페이지(`www.trr.co.kr`)와 블로그(`blog.trr.co.kr`)를 컨테이너로 운영하는 단일 레포입니다.

## 폴더 구조
- 운영 가이드: `docs/OPERATIONS.md`
- `src/` — 홈페이지 정적 파일(HTML/CSS/JS)
- `Dockerfile` — 홈페이지 빌드/런(nginx unprivileged, 8080)
- `nginx.conf` — 보안 헤더/캐시/압축 기본 설정
- `docker-compose.yml` — `web` 서비스(이미지 빌드 후 실행)
- `traum_blog/` — Hugo + Decap CMS 블로그(별도 compose/Dockerfile 포함)
  - `static/brand/` — 회사 로고 등 브랜드 에셋(홈/블로그 공용)

## 환경변수(.env)
홈페이지 컨테이너 바인딩은 `.env`로 조정합니다. 예시는 `.env.example` 참고.

```
HTTP_BIND_HOST=127.0.0.1
HOMEPAGE_PORT=17176
```

## 로컬 실행
```bash
# 홈페이지 (http://127.0.0.1:17176)
docker compose build web && docker compose up -d web

# 블로그 (http://127.0.0.1:17177)
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

### 브랜드 에셋 경로(공용)
- 저장 위치: `traum_blog/static/brand/`
- 프로덕션 참조 URL: `https://blog.trr.co.kr/brand/<파일명>.svg`
- 로컬 참조 URL: `http://127.0.0.1:17177/brand/<파일명>.svg`
- 캐시 주의: SVG는 30일 + `immutable` → 교체 시 파일명 버저닝(예: `logo.20251028.svg`)

## 자동배포(블로그) · GitHub Secrets
블로그는 커밋 시 GitHub Actions가 Hugo로 빌드하고 결과물(`traum_blog/public/`)만 VPS로 rsync 동기화합니다.

- 워크플로: `.github/workflows/deploy-blog.yml`
- Secrets(레포 Settings → Secrets and variables → Actions)
  - Name `DEPLOY_HOST`  → Value `서버_IP`
  - Name `DEPLOY_USER`  → Value `root` (또는 `deploy`)
  - Name `DEPLOY_SSH_PORT` → Value `22` (기본값이면 생략 가능)
  - Name `DEPLOY_SSH_KEY` → Value (SSH 개인키 전체. 예: `-----BEGIN OPENSSH PRIVATE KEY----- ...`)  
    - 권장: 배포 전용 키 생성 후 공개키는 VPS `~/.ssh/authorized_keys`에 등록
    - 예시(로컬/Git Bash):
      - `ssh-keygen -t ed25519 -C "gh-actions-deploy-trr" -f ~/.ssh/gh_actions_trr -N ''`
      - `ssh-copy-id -i ~/.ssh/gh_actions_trr.pub root@서버_IP`
      - `ssh -i ~/.ssh/gh_actions_trr root@서버_IP 'echo OK'` (접속 확인)

배포 흐름: CMS에서 글 발행(=커밋) → Actions 자동 실행 → 수십 초 내 반영(컨테이너 재시작 없음).

## 주의
- `.env`와 인증서는 커밋 금지(.gitignore 반영)
- 컨테이너는 비루트 이미지(`nginxinc/nginx-unprivileged`) 사용, 포트는 8080 고정


## 자동배포(웹/CD)
홈페이지(`web`)는 main 푸시 시 자동으로 빌드·재기동됩니다.

- 워크플로: `.github/workflows/deploy-web.yml`
- 트리거: `src/**`, `Dockerfile`, `nginx.conf`, `docker-compose.yml` 변경 또는 수동 실행
- 동작: SSH로 VPS 접속 → `/srv/traum_homepage` 최신화 → `docker compose build web && up -d web`

## 로컬 개발 팁
- 컨테이너 포트 바인딩은 `.env`로 조정 가능합니다(`HTTP_BIND_HOST`, `HOMEPAGE_PORT`).
