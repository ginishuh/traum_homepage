# Build stage: Hugo extended image to generate static site
FROM klakegg/hugo:ext-alpine AS builder
WORKDIR /src
COPY . .
ARG HUGO_ENV=production
ENV HUGO_ENV=${HUGO_ENV}
# Decap CMS 앱 스크립트는 static/admin/decap-cms.js로 커밋되어 있음
# 환경별 설정 적용을 위해 --environment 플래그를 명시
RUN hugo --minify --environment ${HUGO_ENV}

# Runtime: nginx unprivileged serving built content
FROM nginxinc/nginx-unprivileged:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /src/public /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK CMD test -f /usr/share/nginx/html/index.html || exit 1
