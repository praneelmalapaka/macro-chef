import { state } from "./state.js";
import { COUNTRIES, LOCALISER } from "./data.js";

export function renderCountryGrid() {
  const countryGrid = document.getElementById("countryGrid");
  if (!countryGrid) return;

  countryGrid.innerHTML = COUNTRIES.map(
    (c) => `
      <div class="country-card ${
        c.code === state.currentCountry ? "active" : ""
      }" onclick="selectCountry('${c.code}', this)">
        <div class="country-flag">${c.flag}</div>
        <div class="country-name">${c.name}</div>
      </div>
    `
  ).join("");
}

export function selectCountry(code, el) {
  state.currentCountry = code;

  document.querySelectorAll(".country-card").forEach((c) => {
    c.classList.remove("active");
  });

  if (el) el.classList.add("active");

  const country = COUNTRIES.find((x) => x.code === code);
  const label = document.getElementById("locCountryLabel");

  if (label) {
    label.textContent = country ? country.name : code;
  }

  renderSwapRows();
}

export function renderSwapRows() {
  const swapRows = document.getElementById("swapRows");
  if (!swapRows) return;

  const data = LOCALISER[state.currentCountry] || LOCALISER.AU;

  swapRows.innerHTML = data
    .map(
      (d) => `
      <div class="swap-row">
        <div class="swap-td">
          <div class="swap-ingredient">${d.ing}</div>
        </div>

        <div class="swap-td">
          <div class="brand-us">${d.us}</div>
        </div>

        <div class="swap-td">
          <div class="brand-local">${d.local}</div>
        </div>

        <div class="swap-td">
          <span class="match-chip ${
            d.match === "exact"
              ? "match-exact"
              : d.match === "good"
              ? "match-good"
              : "match-ok"
          }">
            ${d.match === "exact" ? "✓ Exact" : "≈ Close"}
          </span>
        </div>

        <div class="swap-td">
          <span class="diff-text" style="color:${
            d.diff === "0%" ? "var(--forest)" : "var(--gold)"
          }">
            ${d.diff === "0%" ? "±0" : d.diff}
          </span>
        </div>
      </div>
    `
    )
    .join("");
}