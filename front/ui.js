import { maskSensitiveData } from "./utils.js";

// 대시보드 통계 카드 업데이트
export const updateDashboardStats = (data) => {
  const total = data.length;
  const success = data.filter((d) => d.status === "SUCCESS").length;
  const error = data.filter((d) => d.status === "ERROR").length;
  const delay = data.filter((d) => d.status === "DELAY").length;

  document.getElementById("stat-total").innerText = total;
  document.getElementById("stat-success").innerText = success;
  document.getElementById("stat-error").innerText = error;
  document.getElementById("stat-delay").innerText = delay;

  // 시각화 차트 퍼센티지 갱신
  if (total > 0) {
    const successPct = (success / total) * 100;
    const errorPct = (error / total) * 100;
    const delayPct = (delay / total) * 100;

    document.getElementById("bar-success").style.width = `${successPct}%`;
    document.getElementById("bar-error").style.width = `${errorPct}%`;
    document.getElementById("bar-delay").style.width = `${delayPct}%`;

    document.getElementById("label-success").innerText =
      `${successPct.toFixed(1)}%`;
    document.getElementById("label-error").innerText =
      `${errorPct.toFixed(1)}%`;
    document.getElementById("label-delay").innerText =
      `${delayPct.toFixed(1)}%`;
  } else {
    // 데이터가 0일 경우 초기화
    ["success", "error", "delay"].forEach((type) => {
      document.getElementById(`bar-${type}`).style.width = "0%";
      document.getElementById(`label-${type}`).innerText = "0%";
    });
  }
};

// 인터페이스 데이터 그리드 렌더링
export const renderTable = (data, callbacks) => {
  const { onRetry, onViewLog } = callbacks;
  const tbody = document.getElementById("table-body");
  tbody.innerHTML = ""; // 초기화

  data.forEach((item) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
            <td><span class="trace-id" data-id="${item.id}">${item.traceId}</span></td>
            <td>${item.institution}</td>
            <td><span class="badge ${item.status.toLowerCase()}">${item.status}</span></td>
            <td><span class="badge protocol">${item.protocol}</span></td>
            <td>${item.time}</td>
            <td>
                ${
                  item.status === "ERROR"
                    ? `<button class="btn retry-btn" data-id="${item.id}">재처리</button>`
                    : '<span style="color:#9ca3af;">-</span>'
                }
            </td>
        `;

    // 이벤트 리스너: 상세 로그(Trace ID) 클릭
    const traceEl = tr.querySelector(".trace-id");
    traceEl.addEventListener("click", () => onViewLog(item));

    // 이벤트 리스너: 재처리 버튼 클릭 (로딩 상태 방어 코드 적용)
    const retryBtn = tr.querySelector(".retry-btn");
    if (retryBtn) {
      retryBtn.addEventListener("click", (e) => {
        const btn = e.target;
        btn.disabled = true;
        btn.innerText = "처리 중...";
        onRetry(item.id, btn);
      });
    }

    tbody.appendChild(tr);
  });
};

// 모달 열기 및 데이터 마스킹 후 바인딩
export const openModal = (item) => {
  document.getElementById("modal-trace-id").innerText = item.traceId;
  document.getElementById("modal-status-badge").className =
    `badge ${item.status.toLowerCase()}`;
  document.getElementById("modal-status-badge").innerText = item.status;
  document.getElementById("modal-status-code").innerText = item.statusCode;

  const maskedPayload = maskSensitiveData(item.payload);
  document.getElementById("modal-payload").innerText = JSON.stringify(
    JSON.parse(maskedPayload),
    null,
    2,
  );

  document.getElementById("log-modal").classList.remove("hidden");
};

export const closeModal = () =>
  document.getElementById("log-modal").classList.add("hidden");

// 시뮬레이션 모달 제어
export const openSimulateModal = () =>
  document.getElementById("simulate-modal").classList.remove("hidden");
export const closeSimulateModal = () =>
  document.getElementById("simulate-modal").classList.add("hidden");

// 토스트 팝업 (성공, 에러 피드백 UX)
export const showToast = (message, type = "info") => {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};
