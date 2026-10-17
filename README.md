# Music Lab — 종합 음악 학습 앱 Alpha 0.2

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
