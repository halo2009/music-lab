# Music Lab Alpha 0.5 — 발성 원리 안내·기준음 피치 가이드

## 이번에 실제 추가한 기능
- 보컬 과학에 **4단계 소리 발생 원리 탐색**: 숨의 흐름 → 성대 진동 → 성도 공명 → 들리는 목소리. 단계를 탭해 쉬운 설명과 정확한 한계를 확인할 수 있습니다.
- 보컬 소리 비교에 **아 → 우 동일 F0 비교 듣기** 버튼 추가. 실제 인체 목소리가 아닌 교육용 합성 예시입니다.
- 보컬 분석에 **기준음 대비 센트 편차 가이드(낮음/기준음/높음)** 추가. 마이크의 피치 추정치를 보여줄 뿐 진성·가성·두성 및 목 건강을 판정하지 않습니다.
- **기준음 선택 저장 오류 수정**: 선택 메뉴와 ±반음 버튼으로 편안한 목표음을 지정하고 샘플 피아노로 들을 수 있습니다.
- 기존 Alpha 0.4.1의 피아노 샘플, 3D 교육용 후두 모델, A/B 녹음, 청각훈련, 화성학, 기타, 작곡, MIDI, 연습 기록을 유지합니다.

### 빠른 사용법
1. **보컬 → 원리 배우기**로 이동해 위쪽의 `01 숨의 흐름`부터 눌러 4단계를 탐색합니다.
2. **소리 비교하기**에서 `아 → 우 순서대로 듣기`로 동일한 음높이에서 모음 변화를 들어봅니다.
3. **내 목소리 보기**에서 편안한 기준음을 고르고 피아노를 들은 후 마이크를 켭니다. 음정 차이는 짧게 관찰합니다.

### 주의 사항
- 소리가 불편하거나 통증이 있다면 중단합니다. 높은 음을 내도록 유도하거나 진성을 가성으로 강제 전환하지 않습니다.
- 마이크를 통한 음높이 추정은 환경·기기에 영향을 받습니다. 앱은 성대를 실제로 촬영하거나 발성 기전을 진단하지 않습니다.
- 3D 모델은 **실제 인체 스캔이 아닌 교육용 개념 모형**이며, 실제 사람의 자연스러운 음성 녹음 예시는 아직 포함하지 않았습니다.
- 데이터는 브라우저별로 로컬 저장됩니다. GitHub Pages 업데이트 뒤 버전이 바뀌지 않으면 캐시를 새로고침하세요. 사이트 데이터를 일괄 삭제하면 기록이 사라질 수 있습니다.

## 로컬 실행
`music-lab` 폴더에서 `python3 -m http.server 8000`을 실행한 뒤 `http://localhost:8000`에 접속합니다.

## 기존 GitHub Pages에 업데이트
https://github.com/halo2009/music-lab 에서 **Add file → Upload files**를 눌러 압축 해제한 `music-lab` 폴더 내부의 파일과 폴더 전체를 업로드하고 **Commit changes**를 클릭합니다. ZIP 자체를 업로드하지 마세요. 특히 `src/pitch-guide.js`와 `src/app.js`, `src/style.css`, `sw.js`가 포함되어야 합니다.

---

# Music Lab Alpha 0.4.1 — 사용법 간단히·쉬운 발성 원리

## 보컬 메뉴에서 시작하기
1. **원리 배우기**: 신체 부위와 3D를 눌러 보고, 8개의 발성 원리를 쉬운 설명부터 읽으세요. 자세한 내용과 용어 뜻은 눌러 펼칠 수 있습니다.
2. **소리 비교하기**: 아/에/이/오/우를 고르고 **선택한 소리 듣기**를 누르세요. 고급 설정과 공명 그래프는 필요할 때만 열면 됩니다.
3. **내 목소리 보기**: 기준음을 듣고 마이크를 켜서 음높이를 관찰하거나, Take A와 Take B를 짧게 녹음하여 비교하세요.

- 새로운 UI는 기존 음악 이론, 기타, 청각훈련, 코드 스튜디오 및 피아노 샘플을 보존합니다.
- 진성·가성·두성 자동 진단을 제공하지 않습니다. 3D는 실제 인체 촬영이 아닌 교육용 모형입니다.
- 데이터는 현재 기기에 저장되므로 GitHub Pages 재업로드 후에도 기록을 유지하려면 동일 브라우저를 사용하고 사이트 데이터를 삭제하지 마세요.
- GitHub Pages에서 기존 버전이 보이면 일반 새로고침이 아닌 강력 새로고침을 해보세요.

---

# Music Lab — 종합 음악 학습 앱 Alpha 0.4

macOS, iPad, iPhone을 지원하는 개인용 음악 이론·연습 웹앱. 기존 Alpha 0.1의 기능을 유지하고 악보 기반 청음, 피아노 음원, MIDI, 발성 설명 기능을 확장했습니다.

## 실행하기

1. 다운로드된 ZIP을 압축 해제합니다.
2. Mac 터미널에서 압축 해제된 `music-lab` 폴더로 이동합니다.
3. `python3 -m http.server 8000`을 입력합니다.
4. 브라우저에서 `http://localhost:8000`을 엽니다.

`index.html` 파일을 더블클릭하면 ES 모듈이 브라우저 보안 정책에 의해 실행되지 않을 수 있습니다. 항상 localhost 서버 또는 HTTPS로 사용하세요.

## 기존 GitHub 저장소 업데이트

기존 저장소가 `https://github.com/halo2009/music-lab`라면:

1. GitHub 저장소 > **Add file → Upload files**로 이동합니다.
2. 새로 압축을 푼 `music-lab` 폴더 *안에 있는 모든 파일과 폴더*를 Finder에서 선택해 업로드 화면으로 드래그합니다. (필요시 Finder `⌘+Shift+.`로 숨김 폴더 보기)
3. 업로드 대상에 `src/app.js`, `src/audio.js`, `src/staff.js`, `src/midi.js`, `src/larynx3d.js`, `src/recorder.js`, `assets/treble-clef.svg`, `assets/bass-clef.svg`, `sw.js`가 있는지 확인합니다.
4. **Commit changes**를 클릭합니다. 기존 파일은 업데이트되고 새 파일이 추가됩니다.
5. 저장소에서 Pages를 이전과 동일하게 설정한 경우 자동 갱신됩니다. 새 버전이 안 보이면 사이트를 다시 열어 캐시를 새로고침하세요.

**주의:** ZIP 자체를 저장소에 올리지 마세요. 파일 전체를 올려야 웹앱이 동작합니다. 사용 중인 GitHub Pages가 `main / (root)` 배포라면 그대로 유지할 수 있습니다.

## Alpha 0.2 기능

- **청각·악보 훈련**: 높은/낮은음자리표 SVG 악보, 7음계/반음 포함 12음계, 소리 → 건반, 악보 → 건반, 3음 선율, 10문제 세트, 기준음 C4, 문제 반복 듣기, 최근 7일 학습 통계, 오답 표시.
- **기존 청음**: 높낮이·음정·장단 화음 판단.
- **피아노 음원**: 오픈 라이선스 FluidR3_GM 그랜드피아노 샘플 온라인 재생 우선, 샘플을 아직 못 불러왔거나 네트워크가 차단되면 피아노형 합성음 사용.
- **작곡 스튜디오**: 코드 진행·BPM 재생, 4마디 피아노 롤 멜로디 입력, 코드와 함께 재생, Standard MIDI File(.mid) 내보내기.
- **보컬 과학**: 기존 해부학·M1/M2 설명·마이크 피치 추정·성도 공명 슬라이더 외에 3D 투영 입체 *개념도* 회전 및 성문 열림 조절, 탭에서 보컬 테이크 A/B 녹음 비교.
- **기존 기능 유지**: 화성학, 기타 지판, 대시보드, 연습 노트, JSON 백업(청각훈련 통계 포함), 다크/라이트 테마, PWA.

## 주의 사항

- **3D 모형은 실제 사람의 MRI/CT/후두 내시경 자료를 복원한 모델이 아닙니다.** 교육용 저해상도 입체 개념도입니다. 구조와 성문 열림 조절로 M1/M2를 의학적으로 진단할 수 없습니다.
- 실시간 피치 그래프는 근사 측정값이며 성대의 형태나 기능은 확인할 수 없습니다.
- A/B 녹음은 현재 브라우저 탭 안에서만 유지됩니다. 새로고침하면 사라집니다. 외부 서버에 업로드하지 않습니다.
- 청음 문제와 연습 기록은 기기별 localStorage에 저장합니다. iPhone과 Mac 자동 동기화는 지원하지 않습니다.
- 온라인 피아노 음원은 외부 서버의 응답 및 CORS 정책에 따라 늦게 로딩되거나 실패할 수 있습니다. 실패 시 대체 음색이 자동 사용됩니다.
- 오디오 시작과 마이크 녹음은 사용자 클릭을 필요로 합니다. 마이크는 HTTPS 또는 localhost에서만 사용하세요.
- 모바일의 건반은 좌우로 스크롤할 수 있습니다.
- 기능이 많지만 아직 Alpha이므로 고급 보이싱 추천, 음원 분리, 음향학적으로 정확한 3D 성도 시뮬레이션은 제공하지 않습니다.

## 음원 저작권 표시

온라인 샘플: **FluidR3_GM SoundFont acoustic grand piano**, sampled soundfont licensed under **Creative Commons Attribution 3.0 (CC BY 3.0)**. Soundfont project: https://gleitz.github.io/midi-js-soundfonts/ . Original FluidR3_GM authors/creators retain rights. This project does not redistribute the soundfont recordings inside its ZIP; it optionally requests them from the soundfont project's site. For license details: https://creativecommons.org/licenses/by/3.0/ .

높은음자리표·낮은음자리표 그래픽은 프로젝트에 포함된 편집 가능한 SVG 벡터 이미지이며, 인터랙티브 오선지의 음표 위치는 앱 자체 계산기로 생성됩니다. 외부 청각훈련 앱의 스크린샷이나 이미지 파일은 사용하지 않았습니다.

## 과학적 배경

- Roubeau, Henrich & Castellengo (2009). *Laryngeal vibratory mechanisms: the notion of vocal register revisited*. https://pubmed.ncbi.nlm.nih.gov/18538982/
- Vocal tract resonances in singing (2014). https://pubmed.ncbi.nlm.nih.gov/24437789/
- Lower Vocal Tract Morphologic Adjustments (2015). https://pmc.ncbi.nlm.nih.gov/articles/PMC4505946/

이 연구의 관찰 결과와 보컬 교육에서 사용하는 주관적 감각 표현은 분리해 설명합니다.

## 프로젝트 구조

```text
music-lab/
├── index.html
├── manifest.webmanifest
├── sw.js
├── src/
│   ├── app.js              화면 및 이벤트
│   ├── style.css           반응형 테마
│   ├── music.js            조성·코드 계산
│   ├── audio.js            그랜드 피아노 + 대체 합성음
│   ├── staff.js            음자리표 오선지·건반 생성
│   ├── midi.js             피아노 롤 + MIDI 내보내기
│   ├── larynx3d.js         후두 구조의 교육용 입체 모형
│   ├── recorder.js         보컬 A/B 녹음
│   └── mic.js              마이크 음정 추정
├── assets/
│   ├── treble-clef.svg
│   └── bass-clef.svg
└── .github/workflows/deploy.yml
```

## 내부 테스트

- Node 모듈 구문 검사: 통과
- 24개 조성·모드 코드 계산: 통과
- 브라우저 UI: 청각훈련 10/10 문제 처리, 높은/낮은음자리표 전환, 악보 읽기, 피아노 롤, 보컬 입체모형 로드: 통과
- macOS/iOS Safari에서의 실제 마이크·외부 샘플 재생은 실행 장치에서 권한 승인 후 최종 확인해야 합니다.

## Alpha 0.3 (2026-10-18) — 피아노 / 보컬 업그레이드

- 모든 연주 페이지의 실제 피아노 샘플 오프라인 번들: `assets/piano/*.mp3` (23종을 인접한 음높이에 재생속도 보간). `src/audio.js`에서 로딩 상태 표시, 실패시 합성음으로 대체. 외부 MIDI JS URL에 의존하지 않습니다.
- **중요한 음원 라이선스:** 샘플은 `TimGM6mb.sf2`의 피아노 프로그램을 FluidSynth로 렌더링했으며 GPL-2.0 조건입니다. 자세한 원저작자·출처·라이선스는 `assets/piano/LICENSE.txt`와 `assets/piano/LICENSE-GPL-2.0.txt`를 보세요. 외부 서비스에 재배포할 때 이 안내를 유지하세요.
- 보컬 연구실의 조명 기반 3D 메쉬 교육용 모형(성대, 전정주름, 피열연골), 좌우회전·시야·확대·성문 열림 슬라이더 및 느린 애니메이션.
- 성대 음원/성도 공명 교육용 소리 합성: F0, 기식량, 턱, 혀, 입술 제어 및 F1/F2/F3 그래프.
- 마이크의 실시간 음향 에너지 스펙트럼과 세밀한 피치 트레이스.
- 이전 0.2 화성학/기타/청각·악보 훈련/코드/작곡 MIDI/연습 기록 기능 유지.

**한계:** 발성 시뮬레이션은 의학용 해부학 3D 스캔이 아닌 교육용 메쉬, 합성 소리 역시 실제 사람의 진성·가성을 직접 측정한 자료가 아닙니다. 마이크만으로 M1/M2, 근육 사용, 성대 접촉을 결정하거나 건강 상태를 판정할 수 없습니다. 앱은 진단이나 실제 발성 지도 대체물이 아닙니다.

**배포:** GitHub Pages에서 `main` / `(root)`를 배포 중이라면 새 버전의 압축을 풀어 프로젝트 폴더의 파일·하위 폴더를 같은 저장소에 업로드하면 됩니다. 앱은 `music-lab-alpha-v4-voice` 서비스 워커로 캐시를 갱신합니다. 예전 버전이 보일 때는 강력 새로고침을 진행하세요.


## Alpha 0.4 (2026-10-18) — 보컬 연구실 정밀화

기존 Alpha 0.3의 피아노 샘플 23종, 청음/악보/기타/화성학/작곡/백업 기능을 그대로 보존하고 **보컬** 페이지에 3개의 전환 탭을 추가했습니다.

1. **보컬 과학:** 성도 측면 단면도 및 회전 가능한 교육용 3D 후두 메쉬. 구조 강조(성대·전정주름·후두 연골·피열연골), 성문 개폐와 느린 애니메이션. M1/M2/두성/믹스 용어의 과학적 차이. 자료별 연구 근거를 포함한 8개 주제 학습 자료와 6개 퀴즈.
2. **음색 실험실:** 모음 프리셋 /a e i o u/ 개념도, 턱·혀·입술·F0·기식소음 조절, F1/F2/F3 필터 반응 그래프, 합성음 청취 및 개념 비교. 이 F값과 합성 소리는 교육용 계산값으로 실측 포먼트나 특정 실제 사람의 목소리가 아닙니다.
3. **목소리 분석·연습:** 마이크 입력의 실시간 주파수/목표음 편차/보정되지 않은 dBFS/스펙트럼 중심/주파수 스펙트럼 관찰, 실제 피아노 기준음 듣기, 녹음 테이크 A/B 청취·파일 다운로드, 보컬 관찰 메모 기기별 저장.

### 본 버전의 과학적 정확도와 한계

- 일반 마이크만으로 실제 성대의 모양·성문 접촉·후두 근육 사용량·M1/M2를 확정하거나 음성 질환을 진단할 수 없습니다.
- 현재 3D는 해부학 교육용 메시 모델이며 MRI·CT·후두 내시경 스캔이 아닙니다. 정확한 물리 기반 3D 움직임·전문 음성 합성·실측 포먼트 추정·의료 분석 도구가 아닙니다.
- 스펙트럼 중심과 입력 레벨은 마이크 설정·위치·주변 소음의 영향을 받습니다. 단순 규칙에 따른 음향 설명은 검증된 발성 유형 분류가 아닙니다.
- 음성 데이터는 외부 서버로 전송하지 않습니다. 녹음파일은 브라우저 메모리 내에서만 유지되므로 **새로고침 전에 다운로드**하세요. 관찰 메모는 해당 기기의 localStorage에 저장됩니다.
- 앱에 표기된 발성 연습은 편안한 범위에서 진행하도록 권장합니다. 목에 통증·어지러움·호흡 불편이 나타나면 멈추세요.

### 새 파일

- `src/vocal-content.js`: 검증 가능한 근거와 단원·이해도 퀴즈, 모음 컨트롤 프리셋.
- `src/voice-metrics.js`: 브라우저 마이크의 RMS/dBFS, 스펙트럼 중심, 피치 변동폭 등 비진단적 음향 특징 계산.
- `src/app.js` 및 `src/style.css`: 보컬 3개 탭의 UI와 이벤트, 음향 지표, A/B 녹음, 관찰 노트.
- `src/larynx3d.js`: 구조별 강조 보기.

### 근거 문헌

- NIDCD, *Taking Care of Your Voice*: https://www.nidcd.nih.gov/health/taking-care-your-voice
- NIDCD, *How Does the Human Body Produce Voice and Speech?*: https://www.nidcd.nih.gov/news/multimedia/how-does-human-body-produce-voice-and-speech-text-version
- Roubeau, Henrich & Castellengo (2009), *Laryngeal vibratory mechanisms*: https://pubmed.ncbi.nlm.nih.gov/18538982/
- ASHA, *Voice Disorders — Acoustic Assessment*: https://www.asha.org/practice-portal/clinical-topics/voice-disorders

### 업데이트 방법

기존 저장소에 압축파일 자체가 아닌 `music-lab` 폴더 내 전체 파일을 업로드하세요. 특히 `src/vocal-content.js`, `src/voice-metrics.js`, `src/app.js`, `src/style.css`, `src/larynx3d.js`, `sw.js`, `index.html`이 업로드되었는지 확인하세요. `.github/workflows/deploy.yml`이 이미 있다면 GitHub Pages에 다시 게시됩니다.

오래된 버전이 계속 보이면 `https://halo2009.github.io/music-lab/?v=0.4`에서 강력 새로고침하세요. 앱 내 데이터는 브라우저/기기별로 관리되며 GitHub와 자동 동기화하지 않습니다.
