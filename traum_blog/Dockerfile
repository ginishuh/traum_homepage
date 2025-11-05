# Build stage: Hugo extended image to generate static site
# (use GHCR mirror to avoid Docker Hub TLS timeouts observed on VPS)
# Hugo official image on GHCR uses 'v' prefix for tags
FROM ghcr.io/gohugoio/hugo:v0.147.6 AS builder
WORKDIR /src
COPY . .
ARG HUGO_ENV=production
ENV HUGO_ENV=${HUGO_ENV}
# Decap CMS 앱 스크립트는 static/admin/decap-cms.js로 커밋되어 있음
# 빌드 락 파일(.hugo_build.lock)이 포함된 경우 권한 문제를 피하기 위해 제거 후 빌드
# 환경별 설정 적용을 위해 --environment 플래그를 명시
RUN rm -f .hugo_build.lock && \
    hugo --minify --environment ${HUGO_ENV}

# Runtime: nginx unprivileged serving built content
FROM nginxinc/nginx-unprivileged:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /src/public /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK CMD test -f /usr/share/nginx/html/index.html || exit 1
