# Build stage: Hugo extended image to generate static site
FROM klakegg/hugo:ext-alpine AS builder
WORKDIR /src
COPY . .
ARG HUGO_ENV=production
ENV HUGO_ENV=${HUGO_ENV}
# Decap CMS 앱 스크립트를 로컬로 벤더링(네트워크/차단 이슈 제거)
RUN apk add --no-cache curl && \
    curl -fsSL -o static/admin/decap-cms.js https://unpkg.com/decap-cms@3.8.4/dist/decap-cms.js
RUN hugo --minify

# Runtime: nginx unprivileged serving built content
FROM nginxinc/nginx-unprivileged:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /src/public /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK CMD test -f /usr/share/nginx/html/index.html || exit 1
