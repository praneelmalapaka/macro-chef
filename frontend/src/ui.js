/* ═══════════════════ TOAST ═══════════════════ */

export function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

/* ═══════════════════ MODALS ═══════════════════ */

export function openModal(overlayId, panelId) {
  document.getElementById(overlayId)?.classList.add("open");
  document.getElementById(panelId)?.classList.add("open");
}

export function closeModal(overlayId, panelId) {
  document.getElementById(overlayId)?.classList.remove("open");
  document.getElementById(panelId)?.classList.remove("open");
}

/* ═══════════════════ TABS ═══════════════════ */

export function switchTabs({
  tabSelector,
  activeClass = "active",
  sections = {},
  activeKey,
}) {
  document.querySelectorAll(tabSelector).forEach((tab) => {
    tab.classList.remove(activeClass);
  });

  if (sections[activeKey]?.tabEl) {
    sections[activeKey].tabEl.classList.add(activeClass);
  }

  Object.entries(sections).forEach(([key, config]) => {
    const el = document.getElementById(config.id);
    if (!el) return;

    el.style.display = key === activeKey ? "block" : "none";
  });
}

/* ═══════════════════ HELPERS ═══════════════════ */

export function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

export function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
}

export function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

export function toggleClass(selector, className, condition) {
  document.querySelectorAll(selector).forEach((el) => {
    el.classList.toggle(className, condition);
  });
}