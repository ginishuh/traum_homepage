# traum_homepage

간단한 정적 홈페이지를 Nginx 컨테이너로 서빙하기 위한 최소 스캐폴딩입니다. `www.trr.co.kr`을 VPS에서 호스팅할 때 사용하세요.

## 구조
- `src/` — 정적 파일(HTML/CSS/JS, 이미지 등)
- `Dockerfile` — Nginx 베이스 이미지에 정적 파일과 설정을 담습니다.
- `nginx.conf` — 보안 헤더/캐시/압축 등 기본 설정 포함.
- `docker-compose.yml`
  - `web` — 프로덕션용(이미지 빌드 후 실행)
  - `web-local` — 로컬 개발용(소스 볼륨 마운트)

## 빠른 시작(로컬)
```bash
cd traum_homepage
# 개발 모드(라이브 파일 마운트): http://localhost:17176
docker compose up -d web-local
# 프로덕션 모드(이미지에 정적 파일 포함):
docker compose build web && docker compose up -d web
```

## VPS 배포 개요
1) DNS에서 `www.trr.co.kr` A 레코드를 VPS 공인 IP로 지정.
2) 서버에서 빌드/실행:
```bash
cd ~/traum_homepage
export UID=$(id -u) GID=$(id -g)
docker compose build web
# 리버스 프록시/포트 정책에 따라 아래 둘 중 하나
# - 단독 포트 바인딩(예: 테스트용 17176 → 컨테이너 8080)
docker compose up -d web
# - 또는 별도 리버스 프록시(nginx/traefik/caddy) 뒤에 붙이기 → 포트 바인딩 제거하고 네트워크만 연결
```

### 리버스 프록시(Nginx) 예시 스니펫
VPS에 공용 Nginx가 있다면 다음 서버 블록으로 `www.trr.co.kr`을 컨테이너에 프록시하세요.

```
server {
    listen 80;  # 프록시 서버 블록은 80/443에 바인딩
    server_name www.trr.co.kr;

    location / {
        proxy_pass http://127.0.0.1:17176; # (traum-homepage 컨테이너는 8080 리스닝)
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

TLS는 certbot 또는 caddy/traefik 중 선호하는 방식으로 구성하세요.

## 파일 교체
현재 `src/index.html`은 플레이스홀더입니다. 기존 웹호스팅의 정적 자산을 `src/`에 넣고 다시 빌드/기동하면 됩니다.

## 참고
- 컨테이너는 `user: "${UID:-1000}:${GID:-1000}"`로 실행되어 호스트에 쓰는 경우에도 권한 꼬임을 방지합니다.
- 정적 파일만 필요한 경우로 가정했습니다. 서버사이드 렌더링/백엔드 필요 시 알려주세요.
