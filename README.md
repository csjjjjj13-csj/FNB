# 브랜드 허브

내가 기획한 브랜드(개요 / 브랜드컬러 / 카피문구 / 메뉴라인업 / 시즌메뉴 / 이벤트 / 코스트 계산기)를
한 곳에서 정리하는 정적 웹사이트입니다. GitHub Pages로 호스팅하고, 브랜드를 등록/수정하면
사이트에서 바로 GitHub 저장소에 커밋됩니다.

## 폴더 구조

```
(저장소 루트)/
├─ index.html            브랜드 목록(홈)
├─ brand.html            브랜드 상세 페이지 (탭: 개요/컬러/카피/메뉴/시즌메뉴/이벤트/코스트계산기)
├─ add-brand.html        브랜드 등록/수정 폼
├─ settings.html         GitHub 연결 설정
├─ assets/
│  ├─ css/style.css
│  └─ js/ (index.js, brand.js, add-brand.js, settings.js, github-api.js)
├─ data/
│  └─ brands/
│     ├─ index.json      전체 브랜드 목록(요약 정보)
│     └─ jaengban-jip.json  샘플 브랜드 데이터(쟁반집)
└─ images/
   └─ jaengban-jip/       브랜드별 메뉴 이미지 저장 폴더
```

## GitHub Pages로 배포하기

1. 이 폴더 안의 내용물을 GitHub 저장소 루트에 올립니다. (`index.html`이 저장소 최상위에 오도록.)
2. 저장소의 **Settings → Pages** 로 이동합니다.
3. **Source**를 `Deploy from a branch`로, 브랜치는 `main`, 폴더는 `/root`로 설정합니다.
4. 몇 분 후 `https://아이디.github.io/저장소이름/` 주소로 사이트가 보입니다.

## GitHub 연결 설정 (최초 1회)

브랜드를 등록/수정하면 사이트가 자동으로 저장소에 커밋하도록 하려면, 먼저 개인 액세스 토큰을 연결해야 합니다.

1. 사이트에서 **⚙ GitHub 연결** 버튼을 눌러 `settings.html`로 이동합니다.
2. [github.com/settings/tokens](https://github.com/settings/tokens?type=beta) 에서 "Generate new token"으로 Fine-grained token을 만듭니다.
   - Repository access → Only select repositories → 이 사이트가 올라간 저장소 선택
   - Permissions → Repository permissions → **Contents: Read and write**
3. 생성된 토큰을 복사해서 설정 화면의 아이디 / 저장소 이름 / 브랜치 / 토큰 입력칸에 넣고 "연결 테스트" → "저장하기"를 누릅니다.

⚠️ 토큰은 사용 중인 브라우저의 localStorage에만 저장됩니다. 본인만 쓰는 컴퓨터에서 사용하세요.
공용 컴퓨터라면 설정 화면의 "연결 정보 삭제" 버튼으로 사용 후 지워주세요.

## 브랜드 등록 / 수정하는 방법

1. **+ 새 브랜드 추가**를 눌러 개요 / 브랜드컬러 / 카피문구 / 점심·저녁 메뉴 / 시즌메뉴 / 이벤트를 입력합니다.
2. **브랜드 등록하기** 버튼을 누르면 바로 GitHub 저장소에 `data/brands/브랜드슬러그.json`이 생성되고, `data/brands/index.json`도 자동으로 업데이트됩니다.
3. 저장 직후 브랜드 상세 페이지로 이동하는데, 이때는 방금 저장한 내용을 바로 미리 보여줍니다. 실제 배포된 사이트(다른 브라우저/기기)에는 GitHub Pages가 다시 빌드되는 몇 초~1분 정도 후 반영됩니다.
4. 이미 등록한 브랜드는 상세 페이지의 **✏️ 수정하기** 버튼으로 들어가서 내용을 바꾸고 저장하면 같은 방식으로 바로 반영됩니다. (수정 화면에서는 슬러그는 바꿀 수 없습니다.)
5. (선택) 메뉴 이미지는 `images/브랜드슬러그/` 폴더에 직접 올리고 경로를 입력하거나, 외부 이미지 URL을 바로 입력해도 됩니다. 이미지 파일 자체는 이 사이트에서 업로드되지 않으니, 저장소에 미리 넣어두거나 외부 URL을 쓰세요.

GitHub 연결이 안 되어 있거나 문제가 생기면, 등록 화면 하단의 "고급: JSON 파일로 직접 내보내기"에서 JSON을 다운로드해 수동으로 `data/brands/`에 넣는 방법도 여전히 사용할 수 있습니다.

## 코스트 계산기

브랜드 상세 페이지의 "코스트 계산기" 탭은 두 부분으로 구성됩니다.

- **메뉴 원가표**: 브랜드 JSON에 등록된 모든 메뉴(점심+저녁)의 판매가/원가를 기준으로
  원가율(원가÷판매가×100), 마진액(판매가-원가), 마진율을 자동 계산합니다.
- **빠른 계산기**: 판매금액과 원가액만 입력하면 원가율/마진액/마진율을 즉시 계산해주는 도구이며,
  직접 항목을 추가해 임시로 비교해볼 수 있습니다. (이 임시 항목은 브라우저에만 저장되며 JSON 파일에는 반영되지 않습니다.)

## 로컬에서 미리보기

```bash
cd (이 폴더)
python3 -m http.server 8080
# 브라우저에서 http://localhost:8080 접속
```
