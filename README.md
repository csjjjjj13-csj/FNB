# 브랜드 허브

내가 기획한 브랜드(개요, 브랜드컬러, 카피문구, 메뉴, 시즌메뉴, 이벤트, 원가 계산기, 발표자료 등)를 한곳에 정리하는 개인용 정적 웹사이트입니다. GitHub Pages로 호스팅하고, 브랜드 등록/수정은 사이트 안에서 바로 GitHub 저장소에 커밋되도록 만들어졌습니다.

## 사용 방법

1. 이 저장소를 GitHub Pages로 배포합니다 (Settings → Pages → Branch: main, 루트 폴더).
2. 사이트에 접속해 "설정" 메뉴에서 GitHub 사용자명, 저장소 이름, 브랜치, Personal Access Token(Contents: Read and write 권한)을 입력하고 저장합니다.
3. "브랜드 추가"에서 새 브랜드를 등록하면 자동으로 저장소에 커밋됩니다. 등록된 브랜드는 상세 페이지에서 "수정하기"로 바로 편집할 수 있습니다.
4. 이미지와 PPT 발표자료는 파일 선택으로 업로드하면 자동으로 저장소에 올라가고, 발표자료는 누구나 다운로드할 수 있는 링크가 생성됩니다.

## 폴더 구조

```
index.html          브랜드 목록
brand.html           브랜드 상세 페이지
add-brand.html       브랜드 추가/수정 폼
settings.html        GitHub 연결 설정
assets/css/          스타일
assets/js/           로직 (github-api.js: GitHub API 헬퍼)
data/brands/         브랜드별 JSON 데이터 + index.json(목록)
images/{slug}/       브랜드별 업로드 이미지
files/{slug}/        브랜드별 업로드 PPT 파일
```

## 참고

- 방금 업로드한 이미지/파일은 GitHub Pages가 다시 빌드될 때까지(보통 수십 초~1~2분) 잠깐 열리지 않을 수 있습니다. 사이트가 자동으로 몇 차례 재시도하니 잠시 기다렸다가 새로고침해보세요.
- Personal Access Token은 브라우저에 저장되므로, 개인적으로만 사용하는 것을 권장합니다.
