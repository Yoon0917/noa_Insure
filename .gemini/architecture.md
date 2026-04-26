# Architecture & Structure Rules

## 1. 함수 원자화 (Atomization of Functions)

- 하나의 함수는 오직 **하나의 명확한 역할**만 수행해야 합니다.
- 코드가 길어지거나 여러 논리적 흐름이 섞여 있다면, 즉시 더 작은 단위의 함수로 분리하세요.
- 순수 함수(Pure Function) 지향: 부수 효과(Side-effect)를 최소화하고, 동일한 입력에 대해 항상 동일한 출력을 반환하도록 작성하세요.

## 2. 폴더 깊이 최소화 (Minimize Folder Depth - Anti-gravity)

- 불필요하게 깊은 디렉터리 계층 구조를 생성하지 마세요. (안티그래비티 원칙)
- 파일 시스템을 최대한 **평탄하게(Flat)** 유지하여, 파일을 찾고 관리하기 쉽게 만드세요.
- 모듈 및 컴포넌트는 기능별(Feature-based)로 그룹화하되, 중첩을 피하세요.

## 3. 프론트엔드와 백엔드의 깔끔한 분리 및 경로 강제

- 프론트엔드(`front`)와 백엔드(`back`)의 의존성은 철저히 분리합니다.
- 공통으로 사용되는 타입(Types), 인터페이스(Interfaces), API 명세 등은 양쪽에서 중복 정의하지 않고 공유할 수 있는 구조를 지향합니다.
- 불필요한 보일러플레이트 설정 파일은 제거하고, 최소한의 설정만 유지합니다.
- **[코드 생성 필수 규칙]: 코드를 작성하거나 수정할 때, 해당 코드가 프론트엔드인지 백엔드인지 명확히 구분하고, 반드시 `front/파일명` 또는 `back/back/파일명` 형태로 최상단에 경로를 명시하세요.**

## [프로젝트 적용 사례]

- **평탄한 폴더 구조 (Anti-gravity) 및 환경 분리**:
  - **프론트엔드 (`front/`)**: 하위 폴더 없이 수평 배치
    - `index.html`, `style.css`: UI 마크업 및 스타일
    - `app.js`: 데이터 흐름 제어, 상태 관리 및 이벤트 바인딩 전담
    - `api.js`: 백엔드 통신 전담
    - `ui.js`: DOM 조작 및 화면 렌더링 전담
    - `utils.js`: 정규식 마스킹 등 부수효과가 없는 순수 함수 전담
  - **백엔드 (`back/`)**: Spring Boot 패키지 구조 내에서 기능별(Feature-based)로 묶어 폴더 깊이 최소화
    - `build.gradle` / `application.yml`: 최소한의 의존성 및 환경 설정
    - `back\src\main\java\com\noainsure\[Domain]Controller.java`: 프론트엔드 API 요청(엔드포인트) 처리 및 라우팅 전담
    - `back\src\main\java\com\noainsure\[Domain]Service.java`: 핵심 비즈니스 로직 전담 (원자화된 메서드로 분리)
    - `back\src\main\java\com\noainsure\[Domain]Repository.java`: 데이터베이스 연결 및 쿼리 전담
    - `back\src\main\java\com\noainsure\[Domain]Entity.java` (또는 Dto.java): 데이터 모델 및 프론트엔드 통신용 객체 명세 정의
