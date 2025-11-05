#!/usr/bin/env bash
set -euo pipefail

# 새 글 스캐폴드 스크립트
# 사용법:
#   traum_blog/scripts/new_post.sh "제목" [category] [slug]
#   - category: market|ops|behind|story (기본 story)
#   - slug: 생략 시 제목을 기반으로 자동 생성

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
CONTENT_DIR="$ROOT_DIR/content"

title="${1:-}"
category="${2:-story}"
slug_input="${3:-}"

if [[ -z "$title" ]]; then
  echo "제목을 입력하세요. 예) new_post.sh \"시장 동향: 폐지 가격\" market" >&2
  exit 1
fi

case "$category" in
  market|ops|behind|story) ;;
  *) echo "카테고리는 market|ops|behind|story 중 하나여야 합니다." >&2; exit 1;;
esac

# 간단 슬러그 변환: 소문자, 공백→-, 허용문자 외 제거
to_slug() {
  echo "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9가-힣 _-]+//g' \
    | tr ' ' '-' \
    | sed -E 's/-+/-/g; s/^-|-$//g'
}

slug=${slug_input:-$(to_slug "$title")}
year=$(date +%Y)
datestr=$(date +%Y-%m-%dT%H:%M:%S%:z)

post_dir="$CONTENT_DIR/$category/$year"
post_path="$post_dir/$slug.md"

mkdir -p "$post_dir"
if [[ -e "$post_path" ]]; then
  echo "파일이 이미 존재합니다: $post_path" >&2
  exit 1
fi

cat > "$post_path" <<EOF
---
title: "$title"
date: $datestr
draft: true
category: "$category"
tags: []
description: ""
summary: ""
# kpis:
#   - { label: "가격", value: "↑ 3%" }
#   - { label: "물량", value: "보합" }
# thumbnail: "/uploads/example.jpg"   # 카드/OG 이미지 후보
# cover: "/uploads/example_cover.jpg"  # 본문 상단 커버 이미지 후보
# ogImage: "/uploads/example_og.jpg"   # 공유 전용 이미지(선택)
---

여기에 본문을 작성하세요.

EOF

echo "생성됨: $post_path"
echo "초안(draft:true)으로 생성되었습니다. 작성 후 CMS에서 발행하거나 draft를 false로 바꾸세요."

