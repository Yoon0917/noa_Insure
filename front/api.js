import { generateTraceId, getCurrentTime } from "./utils.js";

// 백엔드가 아직 연결되지 않았으므로 임시 Mock 데이터를 활용하여 개발 진행
let mockData = [
  {
    id: 1,
    traceId: generateTraceId(),
    institution: "금융감독원",
    protocol: "REST",
    status: "SUCCESS",
    time: getCurrentTime(),
    payload:
      '{"event": "report", "name": "홍길동", "account": "110-123-456789", "amount": 10000}',
    statusCode: 200,
  },
  {
    id: 2,
    traceId: generateTraceId(),
    institution: "A 은행 제휴사",
    protocol: "SFTP",
    status: "ERROR",
    time: getCurrentTime(),
    payload:
      '{"event": "transfer", "name": "김철수", "account": "020-987-654321", "error": "Connection timeout during file transfer."}',
    statusCode: 504,
  },
  {
    id: 3,
    traceId: generateTraceId(),
    institution: "B 보험사 (MQ)",
    protocol: "MQ",
    status: "DELAY",
    time: getCurrentTime(),
    payload: '{"event": "policy_update", "status": "pending_in_queue"}',
    statusCode: 202,
  },
  {
    id: 4,
    traceId: generateTraceId(),
    institution: "C 페이먼트 (인증)",
    protocol: "REST",
    status: "ERROR",
    time: getCurrentTime(),
    payload: '{"error": "Unauthorized Access Token", "code": "AUTH_401"}',
    statusCode: 401,
  },
];

/** 초기 인터페이스 관제 데이터 조회 */
export const fetchInterfaces = async () => {
  try {
    // 실제 업비트 API 통신 테스트
    const response = await fetch(
      "https://api.upbit.com/v1/ticker?markets=KRW-BTC",
    );
    const data = await response.json();

    const upbitItem = {
      id: "upbit-btc",
      traceId: generateTraceId(),
      institution: "업비트 (KRW-BTC)",
      protocol: "REST API",
      status: response.ok ? "SUCCESS" : "ERROR",
      time: getCurrentTime(),
      payload: JSON.stringify(data[0]),
      statusCode: response.status,
    };

    // 기존 mockData에서 이전 업비트 항목을 제외하고 최상단에 갱신 (새로고침 시 중복 방지)
    mockData = [upbitItem, ...mockData.filter((d) => d.id !== "upbit-btc")];
  } catch (error) {
    console.error("API 통신 실패:", error);
  }

  return [...mockData];
};

/** 에러 발생 건에 대한 즉각 재처리 (수동 Retry) */
export const retryInterface = async (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const item = mockData.find((d) => d.id === id);
      if (item) {
        // 모의 재처리 성공으로 상태 변경
        item.status = "SUCCESS";
        item.statusCode = 200;
        item.time = getCurrentTime();
        item.payload = item.payload.replace('"error"', '"resolved"');
        resolve({ success: true, item });
      } else {
        reject(new Error("대상을 찾을 수 없습니다."));
      }
    }, 800); // 처리 시간 지연 효과
  });
};

/** 영구 실패 건 수동 처리 포기 (Discard) */
export const discardInterface = async (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const item = mockData.find((d) => d.id == id);
      if (item) {
        item.status = "DISCARDED"; // 상태를 버려짐으로 변경하여 관제에서 제외
        resolve({ success: true, item });
      } else {
        reject(new Error("대상을 찾을 수 없습니다."));
      }
    }, 300);
  });
};

/** 관제 시스템 테스트용 강제 장애 발생 (시뮬레이터) */
export const simulateError = async (customData) => {
  return new Promise((resolve) => {
    const newItem = {
      id: Date.now(),
      traceId: generateTraceId(),
      institution: customData?.institution || "내부 코어 원장",
      protocol: customData?.protocol || "SOAP",
      status: "ERROR",
      time: getCurrentTime(),
      payload:
        customData?.payload ||
        '{"error": "Internal DB Transaction Timeout", "code": "SYS_001"}',
      statusCode: customData?.statusCode || 500,
    };
    mockData.unshift(newItem); // 리스트의 최상단에 신규 에러건 추가
    resolve(newItem);
  });
};
