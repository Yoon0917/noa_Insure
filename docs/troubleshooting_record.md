# 트러블슈팅 및 버그 수정 기록 (Troubleshooting Log)

## 2026-04-25: Spring Boot 빌드 플러그인 버전 충돌 해결

### 🚨 문제 발생

백엔드(Spring Boot) 프로젝트 초기화 후 Gradle 빌드 과정에서 `io.spring.dependency-management` 플러그인 버전에 따른 의존성 관리 충돌/오류가 발생하여 서버가 구동되지 않음.

### 🔍 원인 분석 및 조치

Spring Boot 최신 버전(`3.2.4`)과 완벽히 호환되는 안정화된 Dependency Management 플러그인 버전으로 맞추기 위해 `build.gradle` 설정을 상향 업데이트함.

**[변경 전]**
`id 'io.spring.dependency-management' version '1.1.4'`

**[변경 후]**
`id 'io.spring.dependency-management' version '1.1.6'`

### ✅ 결과 및 의의

버전 변경 후 Gradle Refresh 및 빌드가 완벽히 성공하였으며, 로컬 서버(`localhost:8080`)가 정상적으로 띄워짐을 확인.
추후 프로젝트 환경 세팅 시 플러그인 버전 관리가 중요함을 보여주는 사례로 기록함.

## 2026-04-26: Gradle 9.x 호환성을 위한 Spring Boot 버전 업그레이드

### 🚨 문제 발생

배포 환경(Railway 등)에서 Gradle 9.x 버전의 Wrapper를 사용하게 되면서, 기존 Spring Boot 3.2.4 버전의 빌드 플러그인과 호환성 문제가 발생하여 배포(Build)가 실패함.

### 🔍 원인 분석 및 조치

Gradle 최신 메이저 버전(9.x)은 이전 Spring Boot 플러그인에서 사용하던 내부 API를 지원하지 않거나 Deprecated 처리함. 이를 해결하기 위해 `build.gradle`의 Spring Boot 플러그인 버전을 Gradle 9.x와 호환되는 최신 버전(3.4.x 이상)으로 업그레이드 조치함.

- Spring Boot 버전: `3.2.4` -> `3.4.1`
- Dependency Management 버전: `1.1.6` -> `1.1.7`

### ✅ 결과 및 의의

버전 업그레이드 후 최신 Gradle Wrapper 환경에서도 빌드가 정상적으로 수행되며 배포에 성공함. 빌드 도구와 백엔드 프레임워크 간의 버전 동기화의 중요성을 다시 확인함.
