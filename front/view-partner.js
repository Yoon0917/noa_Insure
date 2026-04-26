import {
  fetchPartners,
  addPartner,
  updatePartner,
  deletePartner,
} from "./api.js";
import { showToast } from "./ui.js";

export let currentPartners = [];

export const PartnerComponent = {
  renderHTML: () => `
    <section class="interface-list">
      <h2>신규 제휴사 등록</h2>
      <form id="add-partner-form" style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem; align-items: center;">
        <input type="text" id="partner-name" placeholder="제휴사명 (예: KB국민은행)" required style="flex: 1 1 200px; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px;" />
        <input type="text" id="partner-contact-person" placeholder="담당자명 (예: 홍길동)" style="flex: 1 1 150px; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px;" />
        <input type="text" id="partner-contact-phone" placeholder="연락처 (예: 010-1234-5678)" style="flex: 1 1 150px; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px;" />
        <input type="text" id="partner-desc" placeholder="제휴사 설명 (선택사항)" style="flex: 2 1 200px; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px;" />
        <button type="submit" class="btn primary" style="padding: 0.75rem 1.5rem">등록</button>
      </form>

      <h2>등록된 제휴사 목록</h2>
      <div class="table-responsive" style="overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch;">
        <table id="partner-table" style="min-width: 600px; width: 100%">
          <thead>
            <tr>
              <th>제휴사명</th><th>담당자</th><th>연락처</th><th>상세 설명</th><th style="width: 100px; text-align: center">관리</th>
            </tr>
          </thead>
          <tbody id="partner-table-body"></tbody>
        </table>
      </div>
    </section>

    <div id="edit-partner-modal" class="modal hidden">
      <div class="modal-content">
        <div class="modal-header">
          <h2>제휴사 정보 수정</h2>
          <button id="btn-close-edit-partner-modal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body" style="max-height: 75vh; overflow-y: auto">
          <form id="edit-partner-form">
            <input type="hidden" id="edit-partner-id" />
            <div class="form-group"><label>제휴사명</label><input type="text" id="edit-partner-name" required style="width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px;" /></div>
            <div class="form-group"><label>담당자명</label><input type="text" id="edit-partner-contact-person" style="width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px;" /></div>
            <div class="form-group"><label>연락처</label><input type="text" id="edit-partner-contact-phone" style="width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px;" /></div>
            <div class="form-group"><label>제휴사 설명</label><input type="text" id="edit-partner-desc" style="width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px;" /></div>
            <button type="submit" class="btn primary w-100">수정 완료</button>
          </form>
        </div>
      </div>
    </div>
  `,
  init: () => {
    document.getElementById("view-partners").innerHTML =
      PartnerComponent.renderHTML();
    document
      .getElementById("add-partner-form")
      .addEventListener("submit", PartnerComponent.handleAdd);
    document
      .getElementById("edit-partner-form")
      .addEventListener("submit", PartnerComponent.handleEdit);
    document
      .getElementById("btn-close-edit-partner-modal")
      .addEventListener("click", PartnerComponent.closeModal);
    window.addEventListener("click", (e) => {
      if (e.target.id === "edit-partner-modal") PartnerComponent.closeModal();
    });
  },
  load: async () => {
    try {
      currentPartners = await fetchPartners();
      PartnerComponent.renderTable();
      document.dispatchEvent(
        new CustomEvent("partnersUpdated", { detail: currentPartners }),
      ); // 타 컴포넌트에 데이터 갱신 알림
      return true;
    } catch (error) {
      showToast("서버 통신 에러: 제휴사 목록을 불러올 수 없습니다.", "error");
      return false;
    }
  },
  renderTable: () => {
    const tbody = document.getElementById("partner-table-body");
    if (!tbody) return;
    if (currentPartners.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 2rem;">등록된 제휴사가 없습니다.</td></tr>`;
      return;
    }
    tbody.innerHTML = currentPartners
      .map(
        (p) => `
      <tr>
        <td><strong>${p.name}</strong></td><td>${p.contactPerson || "-"}</td><td>${p.contactPhone || "-"}</td><td><span style="color: #64748b;">${p.description || "-"}</span></td>
        <td style="text-align: center;">
          <button class="btn secondary edit-partner-btn" data-id="${p.id}" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; margin-right: 0.25rem;">수정</button>
          <button class="btn danger delete-partner-btn" data-id="${p.id}" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">삭제</button>
        </td>
      </tr>
    `,
      )
      .join("");
    document
      .querySelectorAll(".edit-partner-btn")
      .forEach((btn) =>
        btn.addEventListener("click", (e) =>
          PartnerComponent.openModal(e.currentTarget.getAttribute("data-id")),
        ),
      );
    document
      .querySelectorAll(".delete-partner-btn")
      .forEach((btn) =>
        btn.addEventListener("click", (e) =>
          PartnerComponent.handleDelete(
            e.currentTarget.getAttribute("data-id"),
          ),
        ),
      );
  },
  openModal: (id) => {
    const partner = currentPartners.find((p) => p.id == id);
    if (!partner) return;
    document.getElementById("edit-partner-id").value = partner.id;
    document.getElementById("edit-partner-name").value = partner.name;
    document.getElementById("edit-partner-contact-person").value =
      partner.contactPerson || "";
    document.getElementById("edit-partner-contact-phone").value =
      partner.contactPhone || "";
    document.getElementById("edit-partner-desc").value =
      partner.description || "";
    document.getElementById("edit-partner-modal").classList.remove("hidden");
  },
  closeModal: () =>
    document.getElementById("edit-partner-modal").classList.add("hidden"),
  handleAdd: async (e) => {
    e.preventDefault();
    try {
      await addPartner({
        name: document.getElementById("partner-name").value,
        contactPerson: document.getElementById("partner-contact-person").value,
        contactPhone: document.getElementById("partner-contact-phone").value,
        description: document.getElementById("partner-desc").value,
      });
      document.getElementById("add-partner-form").reset();
      await PartnerComponent.load();
      showToast("제휴사가 등록되었습니다.", "success");
    } catch (error) {
      showToast("제휴사 등록 실패", "error");
    }
  },
  handleEdit: async (e) => {
    e.preventDefault();
    try {
      await updatePartner(document.getElementById("edit-partner-id").value, {
        name: document.getElementById("edit-partner-name").value,
        contactPerson: document.getElementById("edit-partner-contact-person")
          .value,
        contactPhone: document.getElementById("edit-partner-contact-phone")
          .value,
        description: document.getElementById("edit-partner-desc").value,
      });
      PartnerComponent.closeModal();
      await PartnerComponent.load();
      showToast("제휴사가 수정되었습니다.", "success");
    } catch (error) {
      showToast("제휴사 수정 실패", "error");
    }
  },
  handleDelete: async (id) => {
    if (!confirm("정말 이 제휴사를 삭제하시겠습니까?")) return;
    try {
      await deletePartner(id);
      await PartnerComponent.load();
      showToast("제휴사가 삭제되었습니다.", "success");
    } catch (error) {
      showToast("제휴사 삭제 실패", "error");
    }
  },
};
