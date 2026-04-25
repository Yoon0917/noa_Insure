import { fetchInterfaces, retryInterface, simulateError } from "./api.js";
import {
  updateDashboardStats,
  renderTable,
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

  // 대시보드 외 메뉴는 준비 중 안내
  if (menuId !== "dashboard") {
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
