import { PartnerComponent, currentPartners } from "./view-partner.js";
import { PolicyComponent, currentInterfaceConfigs } from "./view-policy.js";
import {
  fetchInterfaces,
  retryInterface,
  discardInterface,
  simulateInterface,
  fetchAuditLogs,
} from "./api.js";
import {
  updateDashboardStats,
  renderTable,
  renderDlqTable,
  openModal,
  closeModal,
  showToast,
  openSimulateModal,
  closeSimulateModal,
  renderAuditLogTable,
} from "./ui.js";

// 전체 상태를 관리하는 변수
let currentData = [];
let currentAuditLogs = [];

// 무한 스크롤(Infinite Scroll) 상태 관리 변수
let filteredDashboardData = [];
let displayedDashboardCount = 0;
let filteredDlqData = [];
let displayedDlqCount = 0;
const CHUNK_SIZE = 20;
let scrollObserver = null;
let lastAlertedErrorCount = 0;

const loadData = async (silent = false) => {
  try {
    currentData = await fetchInterfaces();
    updateUI(silent);
    return true;
  } catch (error) {
    if (!silent) {
      console.error("데이터 조회에 실패했습니다.", error);
      showToast("서버 통신 에러: 메인 데이터를 불러올 수 없습니다.", "error");
    }
    return false;
  }
};

const loadAuditLogs = async () => {
  try {
    currentAuditLogs = await fetchAuditLogs();
    renderAuditLogTable(currentAuditLogs);
  } catch (error) {
    console.error("작업 이력 로드 실패:", error);
  }
};

// 무한 스크롤용 Intersection Observer 설정 (마지막 행 감지)
const observeLastRow = (tbodyId, callback) => {
  if (scrollObserver) scrollObserver.disconnect();

  const tbody = document.getElementById(tbodyId);
  if (!tbody || !tbody.lastElementChild) return;

  scrollObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        callback();
      }
    },
    { rootMargin: "100px" },
  );

  scrollObserver.observe(tbody.lastElementChild);
};

const renderDashboardChunk = () => {
  const chunk = filteredDashboardData.slice(
    displayedDashboardCount,
    displayedDashboardCount + CHUNK_SIZE,
  );
  renderTable(
    chunk,
    {
      onRetry: handleRetry,
      onViewLog: openModal,
    },
    displayedDashboardCount > 0,
  );

  displayedDashboardCount += chunk.length;
  observeLastRow("table-body", () => {
    if (displayedDashboardCount < filteredDashboardData.length)
      renderDashboardChunk();
  });
};

const updateUI = (preserveState = false) => {
  updateDashboardStats(currentData);
  filteredDashboardData = currentData.filter((d) => d.status !== "DISCARDED");

  // 1. 검색 및 필터(Search & Filter) 적용
  const searchVal =
    document.getElementById("dash-search-input")?.value.toLowerCase() || "";
  const statusVal =
    document.getElementById("dash-status-filter")?.value || "ALL";

  if (searchVal) {
    filteredDashboardData = filteredDashboardData.filter(
      (d) =>
        d.traceId.toLowerCase().includes(searchVal) ||
        d.institution.toLowerCase().includes(searchVal),
    );
  }
  if (statusVal !== "ALL") {
    filteredDashboardData = filteredDashboardData.filter(
      (d) => d.status === statusVal,
    );
  }

  // 2. 위험 감지 및 자동 알림(Alerting) 검사 로직
  const currentErrorCount = currentData.filter(
    (d) => d.status === "ERROR" && d.status !== "DISCARDED",
  ).length;
  if (currentErrorCount >= 3 && currentErrorCount > lastAlertedErrorCount) {
    showToast(
      `⚠️ [위험 감지] 미처리된 장애가 ${currentErrorCount}건 있습니다. 신속한 조치가 필요합니다!`,
      "error",
    );
    lastAlertedErrorCount = currentErrorCount; // 과도한 반복 알림 방지
  } else if (currentErrorCount === 0) {
    lastAlertedErrorCount = 0; // 에러가 모두 해소되면 알림 카운트 리셋
  }

  // 자동 갱신(Polling) 시 스크롤 위치 유지를 위해 기존에 렌더링된 갯수만큼 유지
  let targetCount = CHUNK_SIZE;
  if (preserveState && displayedDashboardCount > 0) {
    targetCount = displayedDashboardCount;
  }

  displayedDashboardCount = 0;

  const chunk = filteredDashboardData.slice(0, targetCount);
  renderTable(chunk, { onRetry: handleRetry, onViewLog: openModal }, false);
  displayedDashboardCount = chunk.length;

  observeLastRow("table-body", () => {
    if (displayedDashboardCount < filteredDashboardData.length)
      renderDashboardChunk();
  });

  // 현재 뷰가 DLQ 모드라면 대기열 테이블 갱신 (단, 사용자의 체크박스 증발 방지를 위해 자동 갱신 시에는 무시)
  if (!document.getElementById("view-dlq").classList.contains("hidden")) {
    if (!preserveState) renderDlqView();
  }
};

// 재처리 로직 (에러 모서리 케이스 대응)
const handleRetry = async (id, btnElement) => {
  try {
    await retryInterface(id);
    showToast("재처리가 완료되어 정상 송신되었습니다.", "success");
    await loadData(); // 성공 시 리스트 갱신
  } catch (error) {
    showToast("재처리에 실패했습니다.", "error");
    btnElement.disabled = false;
    btnElement.innerText = "재처리";
  }
};

// 사용자 정의 장애 시뮬레이션 폼 제출 로직
const handleCustomSimulateSubmit = async (e) => {
  e.preventDefault();

  const customData = {
    institution: document.getElementById("sim-institution").value,
    protocol: document.getElementById("sim-protocol").value,
    status: document.getElementById("sim-status-type").value,
    statusCode: parseInt(document.getElementById("sim-status-code").value, 10),
    payload: document.getElementById("sim-payload").value,
  };

  closeSimulateModal();
  await simulateInterface(customData);
  await loadData();
};

// 자동 임의 시뮬레이션 (2초 간격 총 5회)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const handleRandomSimulate = async () => {
  if (currentInterfaceConfigs.length === 0 && currentPartners.length === 0) {
    return showToast(
      "등록된 제휴사나 인터페이스 정책이 없습니다. 먼저 등록해주세요.",
      "error",
    );
  }

  const btn = document.getElementById("btn-random-simulate");
  btn.disabled = true;
  btn.innerText = "시뮬레이션 진행 중...";
  showToast("임의 시뮬레이션을 시작합니다. (총 5회, 2초 간격)", "info");

  for (let i = 0; i < 5; i++) {
    // 등록된 인터페이스 정책 중 랜덤 선택 (없으면 파트너에서 선택)
    let targetName = "내부 시스템";
    let targetProtocol = "REST API";

    if (currentInterfaceConfigs.length > 0) {
      const randomConfig =
        currentInterfaceConfigs[
          Math.floor(Math.random() * currentInterfaceConfigs.length)
        ];
      targetName = randomConfig.partnerName;
      targetProtocol = randomConfig.protocol || "REST API";
    } else {
      const randomPartner =
        currentPartners[Math.floor(Math.random() * currentPartners.length)];
      targetName = randomPartner.name;
    }

    // 상태 랜덤 지정 (SUCCESS 60%, ERROR 20%, DELAY 20% 확률)
    const statusPool = ["SUCCESS", "SUCCESS", "SUCCESS", "ERROR", "DELAY"];
    const randomStatus =
      statusPool[Math.floor(Math.random() * statusPool.length)];

    let statusCode = 200;
    let payloadStr = "";

    if (randomStatus === "SUCCESS") {
      statusCode = Math.random() > 0.5 ? 200 : 201;
      payloadStr = `{\n  "status": "success",\n  "message": "Auto-generated success",\n  "code": "SYS_${statusCode}"\n}`;
    } else if (randomStatus === "DELAY") {
      statusCode = Math.random() > 0.5 ? 408 : 504;
      payloadStr = `{\n  "error": "Auto-generated timeout",\n  "code": "NET_${statusCode}"\n}`;
    } else {
      const errorCodes = [400, 401, 403, 404, 500, 502, 503];
      statusCode = errorCodes[Math.floor(Math.random() * errorCodes.length)];
      payloadStr = `{\n  "error": "Auto-generated error",\n  "code": "ERR_${statusCode}"\n}`;
    }

    await simulateInterface({
      institution: targetName,
      protocol: targetProtocol,
      status: randomStatus,
      statusCode: statusCode,
      payload: payloadStr,
    });

    await loadData(); // 데이터 새로고침 및 UI 업데이트

    if (i < 4) await delay(2000); // 2초 대기 (마지막 제외)
  }

  showToast("임의 시뮬레이션이 완료되었습니다.", "success");
  btn.disabled = false;
  btn.innerText = "임의 시뮬레이션 발생";
};

// --- DLQ(대기열) 전용 기능 로직 ---

const renderDlqView = () => {
  const filterVal = document.getElementById("dlq-filter-status").value;
  // 에러 혹은 지연 상태인 항목만 추출 (처리 포기된 항목 제외)
  filteredDlqData = currentData.filter(
    (d) =>
      (d.status === "ERROR" || d.status === "DELAY") &&
      d.status !== "DISCARDED",
  );

  if (filterVal !== "ALL") {
    filteredDlqData = filteredDlqData.filter((d) => d.statusCode == filterVal);
  }

  displayedDlqCount = 0;
  document.getElementById("dlq-select-all").checked = false; // 선택 초기화
  renderDlqChunk();
};

const renderDlqChunk = () => {
  const chunk = filteredDlqData.slice(
    displayedDlqCount,
    displayedDlqCount + CHUNK_SIZE,
  );
  renderDlqTable(chunk, { onViewLog: openModal }, displayedDlqCount > 0);
  displayedDlqCount += chunk.length;

  // 무한 스크롤 후에도 전체 선택 상태 유지 동기화
  if (document.getElementById("dlq-select-all").checked) {
    document.querySelectorAll(".dlq-item-cb:not(:checked)").forEach((cb) => {
      cb.checked = true;
    });
  }

  observeLastRow("dlq-table-body", () => {
    if (displayedDlqCount < filteredDlqData.length) renderDlqChunk();
  });
};

const handleBulkRetry = async () => {
  const selected = Array.from(
    document.querySelectorAll(".dlq-item-cb:checked"),
  ).map((cb) => cb.value);
  if (selected.length === 0)
    return showToast("선택된 항목이 없습니다.", "error");

  showToast(`${selected.length}건 일괄 재처리 시작...`, "info");

  // 선택된 항목들에 대해 순차적 혹은 병렬 재처리 요청 (현재 Promise.all 활용)
  try {
    await Promise.all(selected.map((id) => retryInterface(id)));
    showToast("일괄 재처리가 완료되었습니다.", "success");
  } catch (error) {
    showToast("일부 항목의 재처리에 실패했습니다.", "error");
  }

  await loadData();
};

const handleBulkDiscard = async () => {
  const selected = Array.from(
    document.querySelectorAll(".dlq-item-cb:checked"),
  ).map((cb) => cb.value);
  if (selected.length === 0) return;

  try {
    await Promise.all(selected.map((id) => discardInterface(id)));
  } catch (error) {
    console.error("처리 포기 적용에 실패했습니다.", error);
  }

  await loadData();
};

// 반응형 사이드바 제어 로직
const toggleSidebar = () => {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebar-backdrop").classList.toggle("show");
};

const closeSidebar = () => {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-backdrop").classList.remove("show");
};

// 좌측 네비게이션(LNB) 메뉴 클릭 핸들러
const handleNavClick = (e) => {
  e.preventDefault();
  const target = e.currentTarget;
  const menuId = target.getAttribute("data-menu");

  // Active 상태 갱신
  document
    .querySelectorAll(".nav-item")
    .forEach((item) => item.classList.remove("active"));
  target.parentElement.classList.add("active");

  // 페이지 타이틀 변경
  const menuText = target.querySelector(".menu-text").innerText;
  document.getElementById("page-title").innerText = menuText;

  // SPA 라우팅 로직
  if (menuId === "dashboard") {
    document.getElementById("view-dashboard").classList.remove("hidden");
    document.getElementById("view-dlq").classList.add("hidden");
    const viewPartners = document.getElementById("view-partners");
    if (viewPartners) viewPartners.classList.add("hidden");
    const viewInterface = document.getElementById("view-interface-manage");
    if (viewInterface) viewInterface.classList.add("hidden");
    const viewAudit = document.getElementById("view-audit");
    if (viewAudit) viewAudit.classList.add("hidden");

    // 대시보드 뷰 활성화 시 옵저버 재부착
    observeLastRow("table-body", () => {
      if (displayedDashboardCount < filteredDashboardData.length)
        renderDashboardChunk();
    });
  } else if (menuId === "dlq") {
    document.getElementById("view-dashboard").classList.add("hidden");
    document.getElementById("view-dlq").classList.remove("hidden");
    const viewPartners = document.getElementById("view-partners");
    if (viewPartners) viewPartners.classList.add("hidden");
    const viewInterface = document.getElementById("view-interface-manage");
    if (viewInterface) viewInterface.classList.add("hidden");
    const viewAudit = document.getElementById("view-audit");
    if (viewAudit) viewAudit.classList.add("hidden");
    renderDlqView(); // 진입 시 렌더링
  } else if (menuId === "partners") {
    document.getElementById("view-dashboard").classList.add("hidden");
    document.getElementById("view-dlq").classList.add("hidden");
    const viewInterface = document.getElementById("view-interface-manage");
    if (viewInterface) viewInterface.classList.add("hidden");
    const viewAudit = document.getElementById("view-audit");
    if (viewAudit) viewAudit.classList.add("hidden");

    const viewPartners = document.getElementById("view-partners");
    if (viewPartners) {
      viewPartners.classList.remove("hidden");
    }
  } else if (menuId === "interface-manage") {
    document.getElementById("view-dashboard").classList.add("hidden");
    document.getElementById("view-dlq").classList.add("hidden");
    const viewPartners = document.getElementById("view-partners");
    if (viewPartners) viewPartners.classList.add("hidden");
    const viewAudit = document.getElementById("view-audit");
    if (viewAudit) viewAudit.classList.add("hidden");

    const viewInterface = document.getElementById("view-interface-manage");
    if (viewInterface) {
      viewInterface.classList.remove("hidden");
    }
  } else if (menuId === "audit") {
    document.getElementById("view-dashboard").classList.add("hidden");
    document.getElementById("view-dlq").classList.add("hidden");
    const viewPartners = document.getElementById("view-partners");
    if (viewPartners) viewPartners.classList.add("hidden");
    const viewInterface = document.getElementById("view-interface-manage");
    if (viewInterface) viewInterface.classList.add("hidden");

    const viewAudit = document.getElementById("view-audit");
    if (viewAudit) {
      viewAudit.classList.remove("hidden");
      loadAuditLogs();
    }
  } else {
    console.log(`'${menuText}' 메뉴는 현재 준비 중입니다.`);
  }

  // 모바일 환경일 경우 메뉴 클릭 시 자동으로 사이드바 닫기
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
};

// 엑셀(CSV) 다운로드 기능
const handleExportCSV = () => {
  if (currentData.length === 0)
    return showToast("다운로드할 데이터가 없습니다.", "error");
  let csvContent = "Trace ID,대상 기관,상태,프로토콜,발생 시간,Status Code\n";
  currentData.forEach((row) => {
    csvContent += `${row.traceId},${row.institution},${row.status},${row.protocol},${row.time},${row.statusCode}\n`;
  });
  // 한글 깨짐 방지 BOM 추가
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `noa_insure_transaction_log_${new Date().getTime()}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 초기화 및 이벤트 리스너 등록 (Workflow Rules)
const init = () => {
  document.getElementById("btn-refresh").addEventListener("click", async () => {
    const btn = document.getElementById("btn-refresh");
    btn.innerText = "동기화 중...";
    const r1 = await loadData(false);
    const r2 = await PartnerComponent.load();
    const r3 = await PolicyComponent.load();
    btn.innerText = "데이터 새로고침";
    if (r1 && r2 && r3) {
      showToast("모든 데이터를 최신 상태로 동기화했습니다.", "success");
    }
  });
  document
    .getElementById("btn-export-csv")
    .addEventListener("click", handleExportCSV);
  document
    .getElementById("btn-simulate")
    .addEventListener("click", openSimulateModal);
  document
    .getElementById("btn-random-simulate")
    .addEventListener("click", handleRandomSimulate);
  document
    .getElementById("btn-close-modal")
    .addEventListener("click", closeModal);
  document
    .getElementById("btn-close-simulate-modal")
    .addEventListener("click", closeSimulateModal);

  document
    .getElementById("simulate-form")
    .addEventListener("submit", handleCustomSimulateSubmit);

  // 발생 유형 변경 시 HTTP Status Code 목록 및 에러 메시지 창 활성/비활성 제어
  document.getElementById("sim-status-type").addEventListener("change", (e) => {
    const type = e.target.value;
    const codeSelect = document.getElementById("sim-status-code");
    const payloadInput = document.getElementById("sim-payload");

    if (type === "DELAY") {
      payloadInput.disabled = true;
      payloadInput.style.backgroundColor = "#f1f5f9"; // 비활성화 시각적 피드백
      codeSelect.innerHTML = `
        <option value="408">408 Request Timeout</option>
        <option value="504" selected>504 Gateway Timeout</option>
      `;
    } else if (type === "SUCCESS") {
      payloadInput.disabled = false;
      payloadInput.style.backgroundColor = "#fff";
      codeSelect.innerHTML = `
        <option value="200" selected>200 OK</option>
        <option value="201">201 Created</option>
      `;
    } else {
      payloadInput.disabled = false;
      payloadInput.style.backgroundColor = "#fff";
      codeSelect.innerHTML = `
        <option value="400">400 Bad Request</option>
        <option value="401">401 Unauthorized</option>
        <option value="403">403 Forbidden</option>
        <option value="404">404 Not Found</option>
        <option value="500" selected>500 Internal Server Error</option>
        <option value="502">502 Bad Gateway</option>
        <option value="503">503 Service Unavailable</option>
      `;
    }
    // 코드 목록이 바뀌었으므로 강제로 이벤트를 발생시켜 에러 메시지 템플릿 업데이트
    codeSelect.dispatchEvent(new Event("change"));
  });

  // 상태 코드 변경 시 에러 메시지 템플릿(JSON) 자동 갱신
  document.getElementById("sim-status-code").addEventListener("change", (e) => {
    const code = e.target.value;
    let message = "Unknown Error";
    let sysCode = "SYS_000";
    let payloadStr = "";

    if (code === "200" || code === "201") {
      message = "Success - 요청 처리 완료";
      sysCode = "SYS_200";
      payloadStr = `{\n  "status": "success",\n  "message": "${message}",\n  "code": "${sysCode}"\n}`;
    } else {
      switch (code) {
        case "400":
          message = "Bad Request - 잘못된 파라미터 요청";
          sysCode = "ERR_400";
          break;
        case "401":
          message = "Unauthorized - 인증 키 누락 또는 만료";
          sysCode = "AUTH_401";
          break;
        case "403":
          message = "Forbidden - 접근 권한 없음";
          sysCode = "AUTH_403";
          break;
        case "404":
          message = "Not Found - 요청한 엔드포인트를 찾을 수 없음";
          sysCode = "ERR_404";
          break;
        case "408":
          message = "Request Timeout - 제휴사 응답 시간 초과";
          sysCode = "NET_408";
          break;
        case "500":
          message = "Internal Server Error - 제휴사 내부 DB 트랜잭션 에러";
          sysCode = "SYS_500";
          break;
        case "502":
          message = "Bad Gateway - 게이트웨이 또는 프록시 서버 에러";
          sysCode = "NET_502";
          break;
        case "503":
          message = "Service Unavailable - 제휴사 서버 과부하 또는 점검 중";
          sysCode = "SYS_503";
          break;
        case "504":
          message = "Gateway Timeout - 업스트림 서버 타임아웃";
          sysCode = "NET_504";
          break;
      }
      payloadStr = `{\n  "error": "${message}",\n  "code": "${sysCode}"\n}`;
    }
    document.getElementById("sim-payload").value = payloadStr;
  });

  // DLQ 관련 이벤트 바인딩
  document
    .getElementById("dlq-filter-status")
    .addEventListener("change", renderDlqView);
  document
    .getElementById("btn-bulk-retry")
    .addEventListener("click", handleBulkRetry);
  document
    .getElementById("btn-bulk-discard")
    .addEventListener("click", handleBulkDiscard);

  // 전체 선택 체크박스 로직
  document.getElementById("dlq-select-all").addEventListener("change", (e) => {
    const isChecked = e.target.checked;
    document.querySelectorAll(".dlq-item-cb").forEach((cb) => {
      cb.checked = isChecked;
    });
  });

  // 대시보드 검색 이벤트 바인딩
  document
    .getElementById("dash-search-input")
    ?.addEventListener("input", () => updateUI(false));
  document
    .getElementById("dash-status-filter")
    ?.addEventListener("change", () => updateUI(false));

  // 네비게이션 이벤트 바인딩
  document.querySelectorAll(".nav-item a").forEach((link) => {
    link.addEventListener("click", handleNavClick);
  });

  // 모바일 사이드바 토글 이벤트 바인딩
  document
    .getElementById("btn-sidebar-toggle")
    .addEventListener("click", toggleSidebar);
  document
    .getElementById("sidebar-backdrop")
    .addEventListener("click", closeSidebar);

  // 모달 바깥 영역 클릭 시 닫기
  window.addEventListener("click", (e) => {
    if (e.target.id === "log-modal") {
      closeModal();
    }
    if (e.target.id === "simulate-modal") {
      closeSimulateModal();
    }
    if (e.target.id === "edit-partner-modal") {
      closeEditPartnerModal();
    }
    if (e.target.id === "edit-policy-modal") {
      closeEditPolicyModal();
    }
    if (e.target.id === "add-policy-modal") {
      closeAddPolicyModal();
    }
  });

  // 크로스 컴포넌트 이벤트: 제휴사 갱신 시 시뮬레이터 드롭다운 업데이트
  document.addEventListener("partnersUpdated", (e) => {
    const partners = e.detail;
    const options =
      partners.length > 0
        ? partners
            .map((p) => `<option value="${p.name}">${p.name}</option>`)
            .join("")
        : `<option value="">등록된 제휴사가 없습니다.</option>`;
    const simSelect = document.getElementById("sim-institution");
    if (simSelect) simSelect.innerHTML = options;
  });

  // 앱 진입 시 최초 데이터 로드
  PartnerComponent.init();
  PolicyComponent.init();
  loadData();
  PartnerComponent.load();
  PolicyComponent.load();

  // 5초마다 백그라운드에서 조용히 메인 데이터 자동 동기화 (Polling)
  setInterval(() => {
    loadData(true);
  }, 5000);
};

document.addEventListener("DOMContentLoaded", init);
