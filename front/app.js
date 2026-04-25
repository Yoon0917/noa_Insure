import {
  fetchInterfaces,
  retryInterface,
  discardInterface,
  simulateError,
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
} from "./ui.js";

// 전체 상태를 관리하는 변수
let currentData = [];

const loadData = async () => {
  try {
    currentData = await fetchInterfaces();
    updateUI();
    showToast("데이터를 성공적으로 불러왔습니다.", "success");
  } catch (error) {
    showToast("데이터 조회에 실패했습니다.", "error");
  }
};

const updateUI = () => {
  updateDashboardStats(currentData);
  renderTable(currentData, {
    onRetry: handleRetry,
    onViewLog: openModal,
  });
  // 현재 뷰가 DLQ 모드라면 대기열 테이블도 함께 갱신
  if (!document.getElementById("view-dlq").classList.contains("hidden")) {
    renderDlqView();
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
    statusCode: parseInt(document.getElementById("sim-status-code").value, 10),
    payload: document.getElementById("sim-payload").value,
  };

  closeSimulateModal();
  showToast("사용자 정의 장애를 유발합니다...", "info");

  await simulateError(customData);
  await loadData();
  showToast("새로운 에러(장애)가 발생했습니다!", "error");
};

// --- DLQ(대기열) 전용 기능 로직 ---

const renderDlqView = () => {
  const filterVal = document.getElementById("dlq-filter-status").value;
  // 에러 혹은 지연 상태인 항목만 추출 (처리 포기된 항목 제외)
  let dlqData = currentData.filter(
    (d) =>
      (d.status === "ERROR" || d.status === "DELAY") &&
      d.status !== "DISCARDED",
  );

  if (filterVal !== "ALL") {
    dlqData = dlqData.filter((d) => d.statusCode == filterVal);
  }

  renderDlqTable(dlqData, { onViewLog: openModal });
  document.getElementById("dlq-select-all").checked = false; // 선택 초기화
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
  if (selected.length === 0)
    return showToast("선택된 항목이 없습니다.", "error");

  showToast(`${selected.length}건 처리 포기 진행 중...`, "info");

  try {
    await Promise.all(selected.map((id) => discardInterface(id)));
    showToast("선택한 항목이 관제 대상에서 영구 제외되었습니다.", "success");
  } catch (error) {
    showToast("처리 포기 적용에 실패했습니다.", "error");
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
  } else if (menuId === "dlq") {
    document.getElementById("view-dashboard").classList.add("hidden");
    document.getElementById("view-dlq").classList.remove("hidden");
    renderDlqView(); // 진입 시 렌더링
  } else {
    showToast(`'${menuText}' 메뉴는 현재 준비 중입니다.`, "info");
  }

  // 모바일 환경일 경우 메뉴 클릭 시 자동으로 사이드바 닫기
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
};

// 초기화 및 이벤트 리스너 등록 (Workflow Rules)
const init = () => {
  document.getElementById("btn-refresh").addEventListener("click", loadData);
  document
    .getElementById("btn-simulate")
    .addEventListener("click", openSimulateModal);
  document
    .getElementById("btn-close-modal")
    .addEventListener("click", closeModal);
  document
    .getElementById("btn-close-simulate-modal")
    .addEventListener("click", closeSimulateModal);

  document
    .getElementById("simulate-form")
    .addEventListener("submit", handleCustomSimulateSubmit);

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
  });

  // 앱 진입 시 최초 데이터 로드
  loadData();
};

document.addEventListener("DOMContentLoaded", init);
