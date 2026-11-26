# GitHub Pages 배포

1. 압축을 풀고 music-lab 폴더 안의 내용 전체를 GitHub 저장소의 main 브랜치 루트에 올린다. 숨김 폴더인 .github도 포함한다.
2. 저장소의 Settings → Pages → Build and deployment → Source에서 GitHub Actions를 선택한다.
3. Actions의 Deploy Music Lab to GitHub Pages 워크플로를 실행하거나 main에 푸시한다. 실행 결과에 표시된 URL을 연다.
4. 재생, 반주 MIDI·WAV 다운로드, 서비스 워커 활성화 이후의 오프라인 접속을 배포 URL에서 확인한다.

Node나 번들러는 웹 배포에 필요하지 않다. 로컬에서 열려면 music-lab의 상위 폴더에서 `python3 -m http.server 8080`을 실행한 뒤 /music-lab/ 경로로 접속한다. 배포 절차 참고는 [GitHub Pages 공식 문서](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)다.

## 유튜브 검색 설정

Google Cloud Console에서 프로젝트의 YouTube Data API v3를 사용 설정하고 API 키를 만든다. 키의 API 제한을 YouTube Data API v3로, 웹사이트 제한을 실제 GitHub Pages 주소 패턴으로 정한다. 예를 들어 `https://계정.github.io/저장소/*`를 사용한다. 코드 스튜디오 → 유튜브 백킹 트랙에서 검색어와 API 키를 입력하고 검색 결과에서 영상을 선택한다. 키는 현재 페이지의 실행 메모리에서만 재사용되며 새로고침하면 재입력해야 한다.
