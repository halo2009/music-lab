# Music Lab — 종합 음악 학습 앱 Alpha 0.1

한국어 웹앱으로, 조성을 연동한 **화성학 · 기타 지판 · 청음 · 보컬 과학 · 코드 스튜디오 · 연습 기록** 기능을 제공합니다.

## 가장 간단한 실행 방법 (Mac)

압축을 풀고 Mac의 **터미널**에서 `music-lab` 폴더로 이동한 다음:

```bash
cd ~/Downloads/music-lab
python3 -m http.server 8000
```

웹브라우저에서 `http://localhost:8000`을 여세요. Node.js 설치가 필요 없습니다.

> 보안 제한 때문에 `index.html`을 더블클릭하는 `file://` 방식은 JavaScript 모듈이 정상 실행되지 않을 수 있습니다. 로컬 서버를 사용하세요.

## GitHub Pages로 배포

1. GitHub에 `music-lab` 저장소를 만들고 이 폴더의 **전체 파일** (`.github` 폴더 포함)을 올립니다.
2. 기본 브랜치를 `main`으로 지정합니다.
3. 저장소 `Settings → Pages → Build and deployment → Source`에서 **GitHub Actions**를 선택합니다.
4. `main` 브랜치에 새 커밋을 올리면 포함된 `.github/workflows/deploy.yml`이 배포합니다.
5. 배포된 HTTPS 주소에서 iPhone Safari로 접속하고 `공유 → 홈 화면에 추가`로 설치할 수 있습니다.

> 사용자는 별도 GitHub Actions workflow를 만들 필요가 없습니다. 빌드 과정 없이 정적 파일로 배포됩니다.

## 포함된 기능

- 대시보드: 현 조성과 스케일, 청음 정확도, 연습 시간, 메뉴별 바로가기
- 화성학: 12개 으뜸음 × 메이저/내추럴 마이너, 다이아토닉 3화음·7화음, 실제 음 구성과 연주
- 기타: 표준 튜닝 6현 0–15프렛 음, 다양한 스케일, 코드톤 표시 및 소리 재생
- 청음: 높낮이, 음정 맞히기, 장단 3화음 듣기, 누적 정답률
- 보컬 과학: 인체 성도 구조 개념도, M1/M2/두성/믹스 용어 설명, 가상 공명 슬라이더, 교육용 합성 소리, 실시간 마이크 피치 추정
- 작곡: 4마디 코드 진행, 7가지 다이아토닉 코드 선택, 프리셋·랜덤, BPM 변경 및 재생
- 연습 기록: 분야, 분 단위 시간, 레슨 메모, 로컬 저장, JSON 백업과 복원
- 다크/라이트 테마, 모바일 반응형 하단 메뉴, PWA 및 서비스 워커

## 중요한 범위와 제한

- 초기 설계에서 검토한 React/TypeScript 버전 대신 **외부 패키지 없이 바로 실행되는 ES 모듈 구조**를 채택한 첫 버전입니다. 이후 모듈별로 React로 이전 가능합니다.
- 보컬 단면도와 성문 단면은 실제 MRI/후두 촬영이나 생체역학 3D 모델이 아닌 **교육용 개념도**입니다.
- 음색 예시는 두 개의 대역통과 필터를 적용한 신시사이저이며 **인체 해부학 물리 시뮬레이터가 아닙니다**.
- 마이크 피치 분석은 자동상관 기반 단일음 근사 추정입니다. 다성음, 잡음, 강한 배음에서 오류가 발생할 수 있으며 성대 상태·발성법·질환을 진단할 수 없습니다.
- 초기 보컬 기능에는 실제 3D 모델, 녹음 A/B 비교, 음성의 성대 접촉률 판정은 들어 있지 않습니다.
- 기기별 `localStorage`에 기록을 저장합니다. 서버 계정이나 클라우드 동기화는 없습니다.
- 브라우저에서 오디오를 처음 실행하려면 재생 버튼을 눌러야 합니다. 마이크는 `localhost` 또는 HTTPS에서 브라우저 권한이 필요합니다.
- 화성학은 메이저·내추럴 마이너 다이아토닉을 제공합니다. 고급 재즈 화성, 정확한 기타 핑거링 추천, MIDI 내보내기는 향후 구현 범위입니다.
- 음원은 브라우저 오실레이터로 합성하며, 실제 악기·보컬 표본 음원이 아닙니다.

## 주요 과학 참고 자료

- Roubeau, Henrich, Castellengo (2009), *Laryngeal vibratory mechanisms: the notion of vocal register revisited*. https://pubmed.ncbi.nlm.nih.gov/18538982/
- *Vocal tract resonances in singing* (2014). https://pubmed.ncbi.nlm.nih.gov/24437789/
- *Lower Vocal Tract Morphologic Adjustments* (2015). https://pmc.ncbi.nlm.nih.gov/articles/PMC4505946/

논문에서 실측된 결과와 교육 현장의 발성 감각 설명을 구분하여 제시합니다. 발성 시 통증이 생기거나 지속적 쉰 목소리가 있다면 연습을 멈추고 전문가의 안내를 받으세요.

## 개발 폴더

```text
index.html                  앱 입구
src/app.js                  화면 구성 및 상호작용
src/music.js                음정·스케일·다이아토닉 계산
src/audio.js                Web Audio 재생 엔진
src/mic.js                  마이크 기반 피치 추정
src/style.css               다크·라이트 반응형 스타일
assets/icon.svg             앱 아이콘
manifest.webmanifest        설치 정보
sw.js                       오프라인 캐시
.github/workflows/deploy.yml GitHub Pages 자동 배포
```

## 품질 점검

개발은 로컬 서버를 통한 실제 브라우저 실행을 전제로 합니다. 주요 학습 도구는 JavaScript로 작동하며 별도의 패키지 설치를 요구하지 않습니다.
