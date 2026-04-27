export function showView(v) {
  document.querySelectorAll(".page-view").forEach((p) => {
    p.classList.remove("active");
  });

  document.querySelectorAll(".nav-link").forEach((n) => {
    n.classList.remove("active");
  });

  document.getElementById("view-" + v).classList.add("active");

  const navEl = document.getElementById("nav-" + v);
  if (navEl) navEl.classList.add("active");

  window.scrollTo({ top: 0, behavior: "smooth" });
}