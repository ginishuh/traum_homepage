FROM nginxinc/nginx-unprivileged:alpine

# 기본 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 정적 파일 복사
COPY src/ /usr/share/nginx/html/

EXPOSE 8080
HEALTHCHECK CMD test -f /usr/share/nginx/html/index.html || exit 1
