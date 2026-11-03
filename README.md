# 어디서 만날래? (Where We Meet)

서로 다른 곳에서 출발하는 2~5명이 **이동 부담을 공평하게 나눌 수 있는 만남 장소**를 추천하는 지도 기반 웹 서비스입니다.

> 2026년 2학기 웹프로그래밍 기말 프로젝트 · 자세한 기획은 [`프로젝트_제안서.pdf`](./프로젝트_제안서.pdf) 참고

## 핵심 흐름

```
위치 입력(2~5명) → 장소 종류 선택 → 중간 지점 계산 → 주변 장소 검색 → 참가자별 이동시간 비교 → 공평한 장소 추천
```

좌표상 가운데가 실제로 공평한 곳은 아니기 때문에, 좌표 평균으로 후보 지역을 찾은 뒤 **길찾기 API의 실제 이동시간 편차**로 후보 순위를 정합니다.

## 주요 기능

| 구분 | 기능 |
| --- | --- |
| 지도 | 카카오 지도 표시, 마커, 업체 정보 패널 |
| 위치 | 참가자 추가/삭제(최대 5명), 주소·장소명 → 좌표 변환 |
| 추천 | 중간 지점 계산, 주변 장소 검색, 이동시간 비교, 공평도 점수·순위 |
| 회원 | 회원가입, 로그인/로그아웃, 회원·비회원 기능 구분 |
| 기록 | 만남 기록 저장·조회, 관심 장소 저장 |
| 파일 | 프로필·만남 사진 업로드/다운로드, 결과 보고서(PDF) |
| 공통 | 입력값 검증, 권한 검사, 예외 처리, 로그 |

## 기술 스택

- **Backend**: Java 17, Spring Boot 4.1.1, Spring Web MVC, Thymeleaf
- **Build**: Gradle 9.7.1 (Gradle Wrapper 포함)
- **External API**: 카카오 지도 JavaScript API, 카카오 주소·장소 검색 API, 카카오모빌리티 길찾기 API
- **IDE**: STS 5.3.0 또는 VS Code (둘 다 사용 가능)

## 프로젝트 구조 (예정)

스프링부트 3계층 구조(프레젠테이션 / 서비스 / 퍼시스턴스) + 도메인으로 구성합니다.

```
src/main/java/com/springboot
├── WhereWeMeetApplication.java
├── presentation   # Controller, REST API, DTO, 예외 처리
├── service        # LocationService, MeetingService, PlaceService, RouteService, FairnessService, MemberService, FileService
├── persistence    # Repository
├── domain         # Member, Meeting, Participant, Place, SavedPlace, File
└── config         # 보안 등 설정

src/main/resources
├── templates      # Thymeleaf 화면
├── static         # CSS, JS, 이미지
└── application.properties
```

## 실행 방법

### 1. 클론

```bash
git clone https://github.com/2343053-bit/Where_We_Meet.git
```

### 2. API 키 설정

`src/main/resources/application-secret.properties` 파일을 직접 만들고, 팀 단톡방에 공유된 키를 넣습니다. 이 파일은 GitHub에 올리지 않습니다.

```properties
kakao.rest-api-key=발급받은_REST_API_키
kakao.js-key=발급받은_JavaScript_키
```

### 3. 실행

- **STS**: File → Import → Gradle → Existing Gradle Project → Boot Dashboard에서 실행
- **VS Code**: Extension Pack for Java, Spring Boot Extension Pack 설치 → 폴더 열기 → Spring Boot Dashboard에서 실행
- **터미널**: `./gradlew bootRun` (Windows는 `gradlew.bat bootRun`)

실행 후 http://localhost:8080 접속

## 협업 규칙

- `master`에 직접 push하지 않고, `feature/기능명` 브랜치에서 작업 후 PR로 합칩니다.
- 커밋 메시지는 `타입: 설명` 형식 (`feat`, `fix`, `refactor`, `style`, `docs`, `chore`)
- `build.gradle`, `application.properties`, 보안 설정, 공통 레이아웃은 팀장만 수정합니다.
- API 키와 `.db` 파일은 커밋하지 않습니다.

## 개발 현황

- [x] Spring Boot 프로젝트 생성
- [x] 프로젝트 제안서 작성
- [ ] 3계층 패키지 구조 및 의존성(JPA, Security, Validation, DB) 추가
- [ ] 지도 화면 및 위치 입력
- [ ] 중간 지점 계산 및 장소 검색
- [ ] 길찾기 API 연동 및 공평도 계산
- [ ] 회원가입·로그인
- [ ] 파일 업로드·다운로드
- [ ] 추가 프로그램 (공평도 분석 시뮬레이터 또는 장소 데이터 수집·정제)

## 팀원

| 이름 | 역할 |
| --- | --- |
| 허동훈 | 팀장 |
| 김현진 | 팀원 |
| 이재원 | 팀원 |
