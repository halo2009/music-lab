# Music Lab 개발 기록

## Beta 2 Preview 기준선

- 원본은 번들러 없이 실행되는 JavaScript ES 모듈 PWA다.
- 기존 Node 테스트 17개가 모두 통과했다. Node가 모듈 형식을 명시적으로 읽을 수 있도록 테스트 환경에 package.json을 추가했다.
- 문제 풀이 기록과 문제 서명은 기존 localStorage 키에 유지한다.

## Beta 2.1 — 문제 생성 엔진 3.0

- 문제 연구실에 난이도 1~5를 연결했다. 화성학·코드 유형에 조표, 음정, 전위, 텐션, 모드, 세컨더리 도미넌트, 모달 인터체인지, 트라이톤 대리 도미넌트, 이명동음 문제를 추가했다.
- 새 이론 문제는 출제기와 별도로 정답 후보를 판정한다. 표기 중심 문제와 같은 실제 음높이를 묻는 문제를 구분했다.
- 복수 정답을 채점하고 안내한다. 최근 풀이 160건에서 개념별 오답과 이후 정답을 반영해 복습 대상을 정한다.
- 수정 파일은 index.html, sw.js, src/app.js, test_alpha096_app.mjs다. 추가 파일은 package.json, src/problem-engine-v3.js, src/theory-questions.js, src/theory-verifier.js, test_beta21.mjs, DEVELOPMENT_LOG.md다.
- 테스트 파일 18개와 src JavaScript 및 서비스 워커 문법 검사가 통과했다. 자동 생성 검사 120,000건은 6개 분야 × 5개 단계 × 4,000개 시드로 구성했다. 기존 문제 유형은 구조와 기존 회귀 테스트로, 새 이론 유형은 추가 독립 판정기로 검사했다.
- 기존 UI가 난이도를 최대 3으로 잘랐다. 제한을 5로 수정하고 앱 이벤트 테스트에서 5단계 풀이와 저장을 확인했다.
- 이 버전의 기타 지판·초견·청음·리듬은 기존 출제 규칙을 재사용하므로 4·5단계에서 유형 자체가 달라지지 않는다. 실제 브라우저 실행은 설치된 Chromium 런처가 실행 파일을 찾지 못해 완료하지 못했다. 실제 iPhone, iPad, Logic Pro도 미검증이다.
- 다음 단계는 Beta 2.2 코드 스튜디오. 기존 반주 엔진은 드럼·베이스·피아노 믹서와 반복 범위를 지원한다. 기존 설정을 유지하면서 장르 표현, 기타 파트, 믹서 및 오디오 출력을 확장한다.
- 권장 모델과 설정은 Beta 2.1·2.2 모두 GPT-6.2 Astra / Medium / Standard다. 세션 모델이나 잔여 사용량을 변경·조회한 기록은 없다.

### Beta 2.1 재검토

- 기타 지판 4·5단계에서 지정 현과 여러 동음 위치를 연습한다. 기타 초견은 지정 프렛 범위와 여러 동음 위치, 청음은 7화음 종류와 전위, 리듬은 4/4와 6/8 마디 완성을 다룬다.
- src/advanced-questions.js를 추가하고 src/problem-engine-v3.js, src/theory-verifier.js, src/app.js, test_beta21.mjs, test_alpha096_app.mjs, index.html, sw.js를 수정했다.
- 신규 유형 8가지를 각각 4,000건 포함해 총 120,000건을 다시 검사했다. Node 테스트 파일 18개와 JS 문법 검사를 통과했다.
- 기존 화면 테스트가 5단계에서도 기존 4분음표 합계 문제를 기대했다. 새 6/8 유형이 실제 화면에 나타나는지 테스트하고 다시 실행했다.
- 기존 저장 키를 유지한다. Node 앱 이벤트 테스트에서 풀이와 기록을 확인했다. 실제 브라우저와 기기는 검증하지 못했다.
- 다음 단계는 코드 스튜디오 Beta 2.2. 권장 설정은 Astra / Medium / Standard다.

## Beta 2.2 개발 중 — 장르 진행과 기본 반주

- 기존 5개 스타일에 Neo Soul, Funk, Blues, Bossa Nova를 추가했다. 기존 코드 진행을 반주로 재생하는 흐름을 유지했다.
- 9개 장르에서 키, 장·단조, 1~16마디, 한 구간 또는 A–B 진행을 설정해 현재 프로젝트의 코드 진행을 생성할 수 있다. BPM은 기존 프로젝트 값을 사용한다.
- 수정 파일은 src/studio-engine.js, src/backing-track.js, src/app.js, index.html, sw.js, DEVELOPMENT_LOG.md다.
- 생성 경로 1,728건을 자동 검사했다. 9개 장르 × 12개 키 × 2개 모드 × 4개 마디 수 × 2개 변주에서 반주 구성과 범위를 검증했다.
- 참고 자료는 Backing Tracks Jam의 Neo Soul/R&B 반주(https://www.youtube.com/watch?v=TbtHKC1fUEA), Quist의 재즈 펑크 반주(https://www.youtube.com/watch?v=ysIeGJwG03s), Strudel 프로젝트의 AGPL-3.0 안내(https://strudel.cc/technical-manual/project-start/)다. 새 외부 코드나 음원은 추가하지 않았다. 기존 피아노 샘플 고지는 assets/piano/LICENSE.txt에 있다.
- 남은 작업은 네 악기 편곡과 믹서, 기능화성 분석, 보이스 리딩, 추가 필인과 휴머나이징, 반주 MIDI·WAV 내보내기, 실제 브라우저 검증이다. 이 체크포인트에서는 앱의 공개 버전을 2.1로 유지한다.
- 권장 모델과 설정은 GPT-6.2 Astra / Medium / Standard다.
- 회귀 테스트의 장르 개수 기대값을 5개에서 9개로 갱신했다(test_alpha094.mjs). 수정 후 전체 18개 테스트와 JS 문법 검사를 통과했다.

## Beta 2.2 — 코드 스튜디오 기능 추가

- 네 악기 버스와 음량·뮤트·솔로, 반복 구간, 조성 내 기능 및 변화화음 표시, 옥타브 이동을 이용한 건반 보이싱 연결, 타이밍 변주와 4마디 필인을 구현했다.
- MIDI는 템포 제어와 파트별 네 트랙이다. WAV는 PCM 16비트 모노로 오프라인 렌더링한다. 라이브 건반은 기존 샘플을 사용하며 WAV는 합성 건반을 사용한다.
- 수정 파일은 src/app.js, src/studio-engine.js, src/backing-track.js, src/audio.js, sw.js, index.html, test_alpha094.mjs다. src/backing-export.js와 test_beta22.mjs를 추가했다.
- 1,728개 편곡 조합, 네 파트 이벤트, 믹서 수치, MIDI 청크 구조 및 WAV PCM 직렬화를 확인했다. Web Audio 스케줄 등록과 정리의 모의 테스트가 통과했다. 청감 검수, 실제 WAV 렌더, Logic Pro 가져오기는 미검증이다.
- 다음 작업은 기타 연구실. 권장: Astra Medium → Sol High.

## Beta 2.3 — 기타 연구실

- 새 코드 종류 두 개와 스케일 표시 다섯 개를 추가했다. 6현·실제 베이스 음·필수음·허용음·프렛 너비를 검사한다. 피킹 모델의 필터와 음높이 보정을 수정했고 초견에 앞 음과 가까운 운지 선택을 적용했다.
- 수정: src/chord-library.js, src/guitar-sound.js, src/guitar-lab.js, src/music.js. 기존 업·다운·아르페지오와 크로매틱 진입점 유지.
- 최대 프렛을 벗어나던 기준 운지를 고쳤다. 3,486개 코드폼과 780개 초견 이벤트를 검사했다. 실물 기타에서의 운지 및 음색 확인은 미검증이다.
- 다음 작업은 청음·리듬. 권장: Sol High.

## Beta 2.4 — 청음·리듬

- 기존 음정·화음·선율에 코드 진행 청음, 3단계 탭 리듬, 6/8 및 싱코페이션, 최근 오답 우선 복습을 연결했다.
- 수정: src/app.js, src/problem-engine.js, sw.js. 추가: src/rhythm-training.js.
- 코드 진행 생성 1,000건과 정확·지연 입력 판정 6,000건을 검사했다. 실제 터치 타이밍과 오디오 지연은 미검증이다.
- 다음 작업은 통합 연습. 권장: Sol High → Sol Medium.

## Beta 2.5 — 통합 연습

- 기존 퀴즈·청음 기록을 읽어 취약 분야와 10·20·30분 루틴을 제안한다. 연습 기록에서 해당 화면으로 바로 이동할 수 있다.
- 수정: src/app.js, sw.js. 추가: src/practice-plan.js.
- 오답 기록의 우선순위와 추천 시간 합계를 확인했다. 기존 기록의 로컬 저장 키 사용과 테스트를 유지했다.
- 다음 작업은 작곡·편곡. 권장: Sol Medium → Sol High.

## Beta 2.6 — 작곡·편곡

- 멜로디 MIDI 읽기, 음 길이 보존 및 피아노 롤 표시, 기존 코드+멜로디와 파트별 반주 MIDI 내보내기를 연결했다. 코드 추천과 현재 진행의 분석을 같은 스튜디오에서 볼 수 있다.
- 수정: src/midi.js, src/studio-engine.js, src/app.js, sw.js. 추가: src/midi-import.js.
- 4분음표 그리드의 음 시작, 음높이, 4분의 1박 단위 길이 왕복과 손상 데이터 거부를 확인했다. Logic Pro 실제 실행은 미검증이다.
- 다음 작업은 UI·UX. 권장: Sol High → Sol Medium.

## Beta 2.7 — UI·UX

- 모바일 네 악기 믹서, 탭 입력 버튼 크기, 키보드 포커스·눌림 상태 및 줄바꿈, 동작 줄이기 대응을 개선했다. 내비게이션의 기존 화면을 유지하고 연습 추천에서 직접 이동하도록 연결했다.
- 수정: src/style.css, src/app.js, index.html. 더블탭 동작은 touch-action으로 처리했다.
- Node 앱 탐색 및 기존 화면 이벤트 테스트가 통과했다. iPad·iPhone 화면과 Safari 제스처는 미검증이다.
- 다음 작업은 PWA·데이터. 권장: Sol Medium → Sol High.

## Beta 2.8 — PWA와 백업

- 서비스 워커를 앱의 배포 범위와 설치 목록으로 제한하고, 오프라인 탐색에서 설치된 HTML을 반환한다. 캐시 수명과 오디오 버스 종료 흐름을 정리했다. 기존 백업 입력에 연습 시간 설정을 선택적으로 추가했다.
- 수정: sw.js, index.html, src/app.js.
- 모의 서비스 워커로 하위 경로 65개 리소스, 오프라인 탐색과 해당 앱의 구 캐시 삭제를 검사했다. 기존 멜로디 데이터 정규화와 기존 저장 형식 회귀를 검사했다. 실기기 오프라인 캐시와 메모리 프로파일은 미검증이다.
- 다음 작업은 통합 테스트. 권장: Sol High.

## Beta 2.9 — 통합 검사

- 통합 스크립트 test_beta3.mjs에서 기타·리듬·루틴·MIDI·PWA가 함께 동작하는지 검사했다. 기존 기능과 문제 엔진, 코드 스튜디오 회귀 검사도 재실행했다.
- 확인한 실패: 최대 프렛 초과, 변경된 테스트 기대값, 설치된 Chromium 실행 경로의 바이너리 누락. 첫 두 건은 수정 후 재검증했다. 실제 브라우저 검증은 남아 있다.
- 다음 작업은 3.0 최종 확인. 권장: Sol High → Astra High.

## Beta 3.0 RC — 최종 확인 전 후보

- 전체 프로젝트 ZIP, 실제 테스트 결과, 변경 내역, 라이선스와 GitHub Pages 배포 안내를 준비했다.
- 로컬 도구에서 세션 모델·추론·속도 전환이나 Plus 잔여 사용량 조회를 실행하지 않았다. 권장: Astra High / Standard.
- 실제 브라우저와 청감 검수가 남아 있어 이 버전은 출시 후보(RC)로 표시한다. TEST_REPORT.md의 미검증 항목을 참조한다.

## Beta 3.0 RC2 — 지침서 재검토

- Beta 2.1: 높은 난이도에서 과거 오답 유형을 복습하면 다른 유형으로 바뀌던 경로를 수정했다. 기존 유형 5종을 5단계 설정에서 다시 출제해 확인했다.
- Beta 2.2: 홀수 마디 A–B의 B 구간을 첫 코드부터 시작하도록 수정했다. 조성에서 사용할 수 있는 음이름을 우선해 E장조에서 G♭m7 대신 F♯m7을 생성한다. 코드 분석에 지원하지 않는 다음 코드가 전달돼도 중단하지 않는다. 타이머가 오래 멈춘 뒤 반주가 오래된 이벤트를 몰아서 재생하지 않게 수정했다.
- Beta 2.6: 같은 MIDI 음의 겹친 길이는 다음 같은 음의 시작에서 끊어 두 번째 음을 보존한다. 짧은 음 길이에서 임의로 틱을 빼지 않는다. 형식 0의 트랙 수와 깨진 입력을 확인한다.
- 수정: src/problem-engine-v3.js, src/studio-engine.js, src/midi-import.js, src/backing-track.js, index.html, sw.js, test_beta21.mjs, test_beta22.mjs, test_beta3.mjs.
- 저장 형식 변경 없음. 전체 테스트 20개와 소스 문법 검사 재실행. 새 오답 복습, 진행·표기, MIDI 겹침 회귀 사례 포함.
- 남은 사항: 실제 브라우저·오디오 및 모바일·Logic Pro 검증, 그리고 TEST_REPORT.md에 나열한 로드맵 구현 격차. 버전은 출시 후보로 유지한다.
- 권장 검토 모델은 Astra High / Standard다. 모델 전환 및 사용량 조회는 실행하지 않았다.

## Beta 3.0 RC3 — YouTube 백킹 트랙

- 코드 스튜디오에 YouTube 공식 임베드 플레이어, 링크 입력, 시작 초 지정, 외부 열기 및 닫기를 추가했다. 페이지 제목의 버전을 RC3으로 갱신했다.
- 변경 파일: src/app.js, src/youtube-backing.js, src/style.css, index.html, sw.js, test_alpha092_app.mjs, test_beta3.mjs.
- Node 테스트 20개 통과. URL 허용 범위, 시작 시점 전달, 화면에서 플레이어 열기·닫기, 서비스 워커 모의 로딩을 검사했다.
- 실제 스트리밍과 iOS 재생은 미검증이다. 네트워크와 영상 소유자의 삽입 허용이 필요하다. 코드 편집처럼 화면 전체가 다시 그려지면 플레이어가 다시 로드될 수 있다.
