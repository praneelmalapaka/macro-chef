import { state } from "./state.js";
import { FEED, SUGGESTED } from "./data.js";

export function renderFeed() {
  const feedPosts = document.getElementById("feedPosts");
  const suggestedChefs = document.getElementById("suggestedChefs");

  if (feedPosts) {
    feedPosts.innerHTML = FEED.map((p, i) => {
      const followKey = `f${i}`;

      return `
        <div class="feed-post">
          <div class="feed-post-header">
            <div class="feed-av" style="background:${p.col}18;color:${p.col}">
              ${p.user}
            </div>

            <div style="flex:1">
              <div class="feed-post-name">${p.name}</div>
              <div class="feed-post-meta">
                made <span style="color:var(--gold)">${p.recipe}</span> · ${p.time}
              </div>
            </div>

            <button
              class="btn-follow ${state.followState[followKey] ? "following" : ""}"
              onclick="toggleFollow('${followKey}', this)"
            >
              ${state.followState[followKey] ? "Following" : "Follow"}
            </button>
          </div>

          <div class="feed-post-img" style="background:${p.bg}">
            ${p.emoji}
          </div>

          <div class="feed-post-actions">
            <div class="star-rating" id="fstars${i}">
              ${[1, 2, 3, 4, 5]
                .map(
                  (s) =>
                    `<span class="star ${
                      s <= p.rating ? "lit" : ""
                    }" onclick="rateFeedPost(${i},${s})">★</span>`
                )
                .join("")}
            </div>

            <button
              class="action-btn"
              onclick="this.textContent=this.textContent==='🤍'?'❤️':'🤍'"
            >
              🤍
            </button>
            <button class="action-btn">💬</button>
            <button class="action-btn">🔗</button>
          </div>

          <div class="feed-post-body">
            <div class="feed-recipe-tag">// ${p.recipe}</div>
            <div class="feed-caption">${p.caption}</div>
          </div>
        </div>
      `;
    }).join("");
  }

  if (suggestedChefs) {
    suggestedChefs.innerHTML = SUGGESTED.map((u) => {
      return `
        <div class="follow-item">
          <div class="follow-av" style="background:${u.col}18;color:${u.col}">
            ${u.user}
          </div>

          <div>
            <div class="follow-name">@${u.name}</div>
            <div class="follow-sub">
              ${u.recipes} recipes · ${u.followers}
            </div>
          </div>

          <button
            class="btn-follow ${state.followState[u.name] ? "following" : ""}"
            onclick="toggleFollow('${u.name}', this)"
          >
            ${state.followState[u.name] ? "✓" : "Follow"}
          </button>
        </div>
      `;
    }).join("");
  }
}

export function toggleFollow(k, btn, showToast) {
  state.followState[k] = !state.followState[k];

  btn.textContent = state.followState[k] ? "Following" : "Follow";
  btn.className =
    "btn-follow" + (state.followState[k] ? " following" : "");

  if (state.followState[k] && showToast) {
    showToast("Now following!");
  }
}

export function rateFeedPost(i, r, showToast) {
  document.querySelectorAll(`#fstars${i} .star`).forEach((s, idx) => {
    s.className = "star" + (idx < r ? " lit" : "");
  });

  if (showToast) {
    showToast("Rating saved " + "★".repeat(r));
  }
}