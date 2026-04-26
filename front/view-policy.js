import {
  fetchInterfaceConfigs,
  addInterfaceConfig,
  updateInterfaceConfig,
  deleteInterfaceConfig,
} from "./api.js";
import { showToast } from "./ui.js";

export let currentInterfaceConfigs = [];

export const PolicyComponent = {
  renderHTML: () => `
    <section class="interface-list">
      <h2>인터페이스 연동 및 정책 관리</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        <div class="card" style="margin: 0"><h3 style="font-size: 1.1rem; color: #0f172a;">🔗 라우팅</h3></div>
        <div class="card" style="margin: 0"><h3 style="font-size: 1.1rem; color: #0f172a;">⏱️ 자동 재처리/타임아웃</h3></div>
        <div class="card" style="margin: 0"><h3 style="font-size: 1.1rem; color: #0f172a;">🛡️ 서킷 브레이커</h3></div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 1.1rem; margin: 0; color: #0f172a">인터페이스 연동 목록</h3>
        <button id="btn-open-add-policy-modal" class="btn primary" style="padding: 0.5rem 1rem;">+ 신규 등록</button>
      </div>
      <div class="table-responsive" style="overflow-x: auto; width: 100%;">
        <table id="interface-config-table" style="min-width: 800px; width: 100%">
          <thead><tr><th>ID</th><th>내부 원장</th><th>연동 제휴사</th><th>프로토콜</th><th>API URL</th><th>타임아웃</th><th>재처리</th><th>상태</th><th style="width: 100px;">관리</th></tr></thead>
          <tbody id="interface-config-body"></tbody>
        </table>
      </div>
    </section>

    <!-- 신규 등록 모달 -->
    <div id="add-policy-modal" class="modal hidden">
      <div class="modal-content">
        <div class="modal-header"><h2>신규 인터페이스 등록</h2><button id="btn-close-add-policy-modal" class="close-btn">&times;</button></div>
        <div class="modal-body" style="max-height: 75vh; overflow-y: auto">
          <form id="add-policy-form">
            <div class="form-group"><label>인터페이스 ID (미입력시 자동)</label><input type="text" id="add-policy-id" class="form-input" /></div>
            <div class="form-group"><label>내부 원장</label><input type="text" id="add-policy-internal" required class="form-input" /></div>
            <div class="form-group"><label>연동 제휴사</label><select id="add-policy-partner" required class="form-input"></select></div>
            <div class="form-group"><label>프로토콜</label><select id="add-policy-protocol" class="form-input"><option value="REST API">REST API</option><option value="SOAP">SOAP</option><option value="MQ">MQ</option></select></div>
            <div class="form-group"><label>API URL</label><input type="url" id="add-policy-api-url" class="form-input" /></div>
            <div class="form-group"><label>타임아웃 (ms)</label><input type="number" id="add-policy-timeout" required value="5000" class="form-input" /></div>
            <div class="form-group"><label>최대 재처리 횟수</label><input type="number" id="add-policy-retry" required value="3" class="form-input" /></div>
            <button type="submit" class="btn primary w-100">등록 완료</button>
          </form>
        </div>
      </div>
    </div>

    <!-- 수정 모달 (내부 원장 및 제휴사 수정 완벽 반영) -->
    <div id="edit-policy-modal" class="modal hidden">
      <div class="modal-content">
        <div class="modal-header"><h2>인터페이스 정책 설정</h2><button id="btn-close-edit-policy-modal" class="close-btn">&times;</button></div>
        <div class="modal-body" style="max-height: 75vh; overflow-y: auto">
          <form id="edit-policy-form">
            <div class="form-group"><label>인터페이스 ID</label><input type="text" id="edit-policy-id" readonly class="form-input" style="background:#f1f5f9" /></div>
            <div class="form-group"><label>내부 원장</label><input type="text" id="edit-policy-internal" required class="form-input" /></div>
            <div class="form-group"><label>연동 제휴사</label><select id="edit-policy-partner" required class="form-input"></select></div>
            <div class="form-group"><label>프로토콜</label><select id="edit-policy-protocol" class="form-input"><option value="REST API">REST API</option><option value="SOAP">SOAP</option><option value="MQ">MQ</option></select></div>
            <div class="form-group"><label>API URL</label><input type="url" id="edit-policy-api-url" class="form-input" /></div>
            <div class="form-group"><label>타임아웃 (ms)</label><input type="number" id="edit-policy-timeout" required class="form-input" /></div>
            <div class="form-group"><label>최대 재처리 횟수</label><input type="number" id="edit-policy-retry" required class="form-input" /></div>
            <div class="form-group"><label>상태</label><select id="edit-policy-status" class="form-input"><option value="ACTIVE">활성</option><option value="INACTIVE">비활성</option></select></div>
            <button type="submit" class="btn primary w-100">정책 저장</button>
          </form>
        </div>
      </div>
    </div>
    <style>.form-input { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; }</style>
  `,
  init: () => {
    document.getElementById("view-interface-manage").innerHTML =
      PolicyComponent.renderHTML();
    document
      .getElementById("btn-open-add-policy-modal")
      .addEventListener("click", () => PolicyComponent.openModal("add"));
    document
      .getElementById("btn-close-add-policy-modal")
      .addEventListener("click", () => PolicyComponent.closeModal("add"));
    document
      .getElementById("btn-close-edit-policy-modal")
      .addEventListener("click", () => PolicyComponent.closeModal("edit"));
    document
      .getElementById("add-policy-form")
      .addEventListener("submit", PolicyComponent.handleAdd);
    document
      .getElementById("edit-policy-form")
      .addEventListener("submit", PolicyComponent.handleEdit);

    window.addEventListener("click", (e) => {
      if (e.target.id === "add-policy-modal") PolicyComponent.closeModal("add");
      if (e.target.id === "edit-policy-modal")
        PolicyComponent.closeModal("edit");
    });

    // Cross-component Event: 제휴사 목록이 갱신되면 드롭다운 자동 갱신
    document.addEventListener("partnersUpdated", (e) => {
      const partners = e.detail;
      const options =
        partners.length > 0
          ? partners
              .map((p) => `<option value="${p.name}">${p.name}</option>`)
              .join("")
          : `<option value="">제휴사 없음</option>`;
      const addSelect = document.getElementById("add-policy-partner");
      const editSelect = document.getElementById("edit-policy-partner");
      if (addSelect) addSelect.innerHTML = options;
      if (editSelect) editSelect.innerHTML = options;
    });
  },
  load: async () => {
    try {
      currentInterfaceConfigs = await fetchInterfaceConfigs();
      PolicyComponent.renderTable();
      return true;
    } catch (error) {
      showToast("서버 통신 에러: 정책 목록을 불러올 수 없습니다.", "error");
      return false;
    }
  },
  renderTable: () => {
    const tbody = document.getElementById("interface-config-body");
    if (!tbody) return;
    if (currentInterfaceConfigs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 2rem;">설정된 인터페이스 정책이 없습니다.</td></tr>`;
      return;
    }
    tbody.innerHTML = currentInterfaceConfigs
      .map(
        (item) => `
      <tr>
        <td><strong>${item.id}</strong></td><td>${item.internalSystem}</td><td><span class="badge" style="background:#e2e8f0;color:#0f172a">${item.partnerName}</span></td>
        <td><span class="badge protocol">${item.protocol || "REST"}</span></td><td>${item.apiUrl || "-"}</td><td>${item.timeout} ms</td><td>${item.maxRetry} 회</td>
        <td><span class="badge ${item.status === "ACTIVE" ? "success" : "error"}">${item.status}</span></td>
        <td style="text-align: center">
          <button class="btn secondary edit-policy-btn" data-id="${item.id}" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; margin-right: 0.25rem;">수정</button>
          <button class="btn danger delete-policy-btn" data-id="${item.id}" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">삭제</button>
        </td>
      </tr>
    `,
      )
      .join("");
    document
      .querySelectorAll(".edit-policy-btn")
      .forEach((btn) =>
        btn.addEventListener("click", (e) =>
          PolicyComponent.openModal(
            "edit",
            e.currentTarget.getAttribute("data-id"),
          ),
        ),
      );
    document
      .querySelectorAll(".delete-policy-btn")
      .forEach((btn) =>
        btn.addEventListener("click", (e) =>
          PolicyComponent.handleDelete(e.currentTarget.getAttribute("data-id")),
        ),
      );
  },
  openModal: (type, id = null) => {
    if (type === "add")
      document.getElementById("add-policy-modal").classList.remove("hidden");
    else if (type === "edit") {
      const config = currentInterfaceConfigs.find((c) => c.id === id);
      if (!config) return;
      document.getElementById("edit-policy-id").value = config.id;
      document.getElementById("edit-policy-internal").value =
        config.internalSystem || "";
      document.getElementById("edit-policy-partner").value =
        config.partnerName || "";
      document.getElementById("edit-policy-protocol").value =
        config.protocol || "REST API";
      document.getElementById("edit-policy-api-url").value =
        config.apiUrl || "";
      document.getElementById("edit-policy-timeout").value = config.timeout;
      document.getElementById("edit-policy-retry").value = config.maxRetry;
      document.getElementById("edit-policy-status").value = config.status;
      document.getElementById("edit-policy-modal").classList.remove("hidden");
    }
  },
  closeModal: (type) =>
    document.getElementById(`${type}-policy-modal`).classList.add("hidden"),
  handleAdd: async (e) => {
    e.preventDefault();
    try {
      await addInterfaceConfig({
        id: document.getElementById("add-policy-id").value,
        internalSystem: document.getElementById("add-policy-internal").value,
        partnerName: document.getElementById("add-policy-partner").value,
        protocol: document.getElementById("add-policy-protocol").value,
        apiUrl: document.getElementById("add-policy-api-url").value,
        timeout: parseInt(
          document.getElementById("add-policy-timeout").value,
          10,
        ),
        maxRetry: parseInt(
          document.getElementById("add-policy-retry").value,
          10,
        ),
        status: "ACTIVE",
      });
      PolicyComponent.closeModal("add");
      document.getElementById("add-policy-form").reset();
      await PolicyComponent.load();
      showToast("등록 완료", "success");
    } catch (error) {
      showToast("등록 실패", "error");
    }
  },
  handleEdit: async (e) => {
    e.preventDefault();
    try {
      await updateInterfaceConfig(
        document.getElementById("edit-policy-id").value,
        {
          internalSystem: document.getElementById("edit-policy-internal").value,
          partnerName: document.getElementById("edit-policy-partner").value,
          protocol: document.getElementById("edit-policy-protocol").value,
          apiUrl: document.getElementById("edit-policy-api-url").value,
          timeout: parseInt(
            document.getElementById("edit-policy-timeout").value,
            10,
          ),
          maxRetry: parseInt(
            document.getElementById("edit-policy-retry").value,
            10,
          ),
          status: document.getElementById("edit-policy-status").value,
        },
      );
      PolicyComponent.closeModal("edit");
      await PolicyComponent.load();
      showToast("수정 완료", "success");
    } catch (error) {
      showToast("수정 실패", "error");
    }
  },
  handleDelete: async (id) => {
    if (!confirm("정말 이 정책을 삭제하시겠습니까?")) return;
    try {
      await deleteInterfaceConfig(id);
      await PolicyComponent.load();
      showToast("삭제 완료", "success");
    } catch (error) {
      showToast("삭제 실패", "error");
    }
  },
};
