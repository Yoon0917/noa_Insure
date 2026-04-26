import { generateTraceId, getCurrentTime } from "./utils.js";

// 현재 브라우저의 접속 도메인을 확인하여 동적으로 API 서버 주소 할당
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// 로컬 환경일 경우 8080 포트 사용, 배포 환경일 경우 현재 브라우저 도메인(origin) 사용
export const SERVER_URL = isLocal
  ? "http://localhost:8080"
  : "noainsure - production.up.railway.app";

const API_BASE_URL = `${SERVER_URL}/api/interfaces`;

/** 초기 인터페이스 관제 데이터 조회 */
export const fetchInterfaces = async () => {
  try {
    // 1. 로컬 백엔드 서버에서 데이터 조회
    const res = await fetch(API_BASE_URL);
    if (!res.ok) throw new Error("백엔드 서버 통신 에러");
    let data = await res.json();

    // 실제 업비트 API 통신 테스트
    try {
      const upbitRes = await fetch(
        "https://api.upbit.com/v1/ticker?markets=KRW-BTC",
      );
      if (upbitRes.ok) {
        const upbitData = await upbitRes.json();
        const upbitItem = {
          id: "upbit-btc",
          traceId: generateTraceId(),
          institution: "업비트 (KRW-BTC)",
          protocol: "REST API",
          status: "SUCCESS",
          time: getCurrentTime(),
          payload: JSON.stringify(upbitData[0]),
          statusCode: upbitRes.status,
        };
        data = [upbitItem, ...data];
      }
    } catch (e) {
      console.warn("업비트 통신 실패", e);
    }

    return data;
  } catch (error) {
    console.error("API 통신 실패:", error);
    throw error;
  }
};

/** 에러 발생 건에 대한 즉각 재처리 (수동 Retry) */
export const retryInterface = async (id) => {
  if (id === "upbit-btc") return { success: true }; // 업비트 테스트 건은 로컬 DB에 없으므로 예외 처리

  const response = await fetch(`${API_BASE_URL}/${id}/retry`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("재처리 실패");
  return await response.json();
};

/** 영구 실패 건 수동 처리 포기 (Discard) */
export const discardInterface = async (id) => {
  if (id === "upbit-btc") return { success: true };

  const response = await fetch(`${API_BASE_URL}/${id}/discard`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("처리 포기 실패");
  return await response.json();
};

/** 관제 시스템 테스트용 시뮬레이터 (정상/장애) */
export const simulateInterface = async (customData) => {
  const newItem = {
    traceId: generateTraceId(),
    institution: customData?.institution || "내부 코어 원장",
    protocol: customData?.protocol || "SOAP",
    status: customData?.status || "SUCCESS",
    time: getCurrentTime(),
    payload: customData?.payload || '{"status": "success", "code": "SYS_200"}',
    statusCode: customData?.statusCode || 200,
  };

  const response = await fetch(`${API_BASE_URL}/simulate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newItem),
  });

  if (!response.ok) throw new Error("시뮬레이션 데이터 생성 실패");
  return await response.json();
};

/** 제휴사 목록 조회 */
export const fetchPartners = async () => {
  const res = await fetch(`${SERVER_URL}/api/partners`);
  if (!res.ok) throw new Error("서버 응답 오류: " + res.status);
  return await res.json();
};

/** 제휴사 추가 */
export const addPartner = async (partner) => {
  const res = await fetch(`${SERVER_URL}/api/partners`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partner),
  });
  return await res.json();
};

/** 제휴사 수정 */
export const updatePartner = async (id, partner) => {
  const res = await fetch(`${SERVER_URL}/api/partners/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partner),
  });
  return await res.json();
};

/** 제휴사 삭제 */
export const deletePartner = async (id) => {
  const res = await fetch(`${SERVER_URL}/api/partners/${id}`, {
    method: "DELETE",
  });
  return await res.json();
};

/** 인터페이스 정책 목록 조회 */
export const fetchInterfaceConfigs = async () => {
  const res = await fetch(`${SERVER_URL}/api/interface-configs`);
  if (!res.ok) throw new Error("서버 응답 오류: " + res.status);
  return await res.json();
};

/** 인터페이스 정책 추가 */
export const addInterfaceConfig = async (config) => {
  const res = await fetch(`${SERVER_URL}/api/interface-configs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  return await res.json();
};

/** 인터페이스 정책 수정 */
export const updateInterfaceConfig = async (id, config) => {
  const res = await fetch(`${SERVER_URL}/api/interface-configs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  return await res.json();
};

/** 인터페이스 정책 삭제 */
export const deleteInterfaceConfig = async (id) => {
  const res = await fetch(`${SERVER_URL}/api/interface-configs/${id}`, {
    method: "DELETE",
  });
  return await res.json();
};

/** 감사 로그(작업 이력) 목록 조회 */
export const fetchAuditLogs = async () => {
  const res = await fetch(`${SERVER_URL}/api/audit-logs`);
  if (!res.ok) throw new Error("서버 응답 오류: " + res.status);
  return await res.json();
};
