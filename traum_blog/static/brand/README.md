# 브랜드 에셋(Company Brand Assets)

이 디렉터리는 TRR의 공식 브랜드 자산을 보관합니다. (예: 로고, 심볼, 마크, 아이콘)

## 경로 및 사용
- 프로덕션(URL)
  - 블로그: `https://blog.trr.co.kr/brand/<파일명>.svg`
  - 홈페이지에서 공용 사용: 위 블로그 경로를 그대로 참조합니다.
- 로컬 개발
  - `http://127.0.0.1:17177/brand/<파일명>.svg`

## 권장 파일명
- 기본 로고: `logo.svg`
- 다크 테마용: `logo-dark.svg`
- 심볼(아이콘): `logo-mark.svg`
- 가로형: `logo-horizontal.svg`

## 캐시 전략(중요)
- Nginx가 SVG에 `Cache-Control: public, max-age=2592000, immutable`를 부여합니다.
- 로고 교체 시 파일명을 버저닝하세요. 예: `logo.20251028.svg` 또는 `logo.abcd1234.svg`.
- 레퍼런스를 새 파일명으로 교체해야 즉시 반영됩니다.

## 중복 보관 금지
- 동일 파일을 홈페이지(`src/`)에 다시 복사하지 않습니다(드리프트 방지).
- 예외: 같은 오리진이 필요한 `<svg><use href="#id"></use></svg>` 스프라이트 등 특수 케이스.

## 라이선스/보안
- 사내 소유 자산만 보관하세요. 제3자 저작물/폰트는 라이선스를 확인하고 출처를 명시하세요.

