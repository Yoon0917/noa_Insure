import { maskSensitiveData } from "./utils.js";

// 대시보드 통계 카드 업데이트
export const updateDashboardStats = (data) => {
  // 처리 포기(DISCARDED)된 건은 활성 관제 대상에서 제외합니다.
  const validData = data.filter((d) => d.status !== "DISCARDED");
  const total = validData.length;
  const success = validData.filter((d) => d.status === "SUCCESS").length;
  const error = validData.filter((d) => d.status === "ERROR").length;
  const delay = validData.filter((d) => d.status === "DELAY").length;

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
export const renderTable = (data, callbacks, append = false) => {
  const { onRetry, onViewLog } = callbacks;
  const tbody = document.getElementById("table-body");
  if (!append) tbody.innerHTML = ""; // 초기화

  data.forEach((item) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
다            <td><span class="trace-id" data-id="${item.id}">${item.traceId}</span></td>
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

// 장애/미처리 대기열 전용 그리드 렌더링
export const renderDlqTable = (data, callbacks, append = false) => {
  const { onViewLog } = callbacks;
  const tbody = document.getElementById("dlq-table-body");
  if (!append) tbody.innerHTML = "";

  if (data.length === 0 && !append) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">대기열에 해당하는 장애 항목이 없습니다.</td></tr>`;
    return;
  }

  data.forEach((item) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td style="text-align: center;">
          <input type="checkbox" class="dlq-item-cb" value="${item.id}">
        </td>
        <td><span class="trace-id" data-id="${item.id}">${item.traceId}</span></td>
        <td>${item.institution}</td>
        <td><span class="badge ${item.status.toLowerCase()}">${item.status}</span></td>
        <td><span class="badge" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;">${item.statusCode}</span></td>
        <td>${item.time}</td>
    `;

    const traceEl = tr.querySelector(".trace-id");
    traceEl.addEventListener("click", () => onViewLog(item));

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

// 운영 작업 이력 테이블 렌더링
export const renderAuditLogTable = (data) => {
  const tbody = document.getElementById("audit-table-body");
  if (!tbody) return;
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 2rem;">기록된 운영 작업 이력이 없습니다.</td></tr>`;
    return;
  }
  tbody.innerHTML = data
    .map(
      (item) => `
    <tr>
      <td>${item.timestamp}</td>
      <td><span class="badge" style="background: #e2e8f0; color: #0f172a">${item.actionType}</span></td>
      <td><strong>${item.targetId || "-"}</strong></td>
      <td>${item.description}</td>
    </tr>
  `,
    )
    .join("");
};
