// 순수 함수 지향 (부수 효과 최소화)

/**
 * 민감 정보 보안 마스킹 (이름, 계좌번호 등)
 * @param {string} payloadJsonStr - 원본 JSON 문자열
 * @returns {string} - 마스킹된 JSON 문자열
 */
export const maskSensitiveData = (payloadJsonStr) => {
  try {
    let masked = payloadJsonStr.replace(
      /"name"\s*:\s*"([^"]+)"/g,
      (match, p1) => {
        // 이름 마스킹 (예: 홍길동 -> 홍*동)
        const maskedName =
          p1.length > 2
            ? p1[0] + "*".repeat(p1.length - 2) + p1[p1.length - 1]
            : p1[0] + "*";
        return `"name": "${maskedName}"`;
      },
    );
    masked = masked.replace(/"account"\s*:\s*"([^"]+)"/g, (match, p1) => {
      // 계좌번호 마스킹 (예: 110-123-456 -> 110-***-456)
      if (p1.length < 6) return match;
      return `"account": "${p1.slice(0, 3)}****${p1.slice(-3)}"`;
    });
    return masked;
  } catch (e) {
    return payloadJsonStr; // 파싱 실패 시 원본 반환 (에러 방어)
  }
};

export const generateTraceId = () => {
  return "TRC-" + Math.random().toString(36).substr(2, 9).toUpperCase();
};

export const getCurrentTime = () => {
  return new Date().toLocaleTimeString("ko-KR", { hour12: false });
};
