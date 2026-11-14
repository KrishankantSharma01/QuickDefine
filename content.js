// ─── QuickDefine — Instant Dictionary Extension ───
// Content script: detects word selection and shows a definition popup.

(function () {
  "use strict";

  // Prevent double-injection
  if (window.__quickDefineLoaded) return;
  window.__quickDefineLoaded = true;

  // ─── State ───
  let popup = null;
  let currentAbort = null; // AbortController for in-flight fetches

  // ─── Create popup element (once) ───
  function getPopup() {
    if (popup) return popup;

    popup = document.createElement("div");
    popup.id = "qd-popup";
    popup.setAttribute("role", "tooltip");
    popup.innerHTML = `
      <div id="qd-header">
        <span id="qd-word"></span>
        <span id="qd-phonetic"></span>
        <button id="qd-audio-btn" title="Play pronunciation" style="display:none;">🔊</button>
        <button id="qd-close" title="Close">&times;</button>
      </div>
      <div id="qd-body">
        <div id="qd-loading">
          <div class="qd-spinner"></div>
          <span>Looking up definition…</span>
        </div>
        <div id="qd-content" style="display:none;"></div>
        <div id="qd-error" style="display:none;"></div>
      </div>
      <div id="qd-footer">QuickDefine</div>
    `;
    document.documentElement.appendChild(popup);

    // Close button
    popup.querySelector("#qd-close").addEventListener("click", hidePopup);

    // Audio button
    popup.querySelector("#qd-audio-btn").addEventListener("click", () => {
      const src = popup.querySelector("#qd-audio-btn").dataset.src;
      if (src) new Audio(src).play();
    });

    return popup;
  }

  // ─── Position the popup near the selection ───
  function positionPopup(rect) {
    const p = getPopup();
    const MARGIN = 10;
    const maxW = 380;

    // Reset so we can measure
    p.style.left = "0px";
    p.style.top = "0px";
    p.style.display = "block";
    p.style.opacity = "0";

    requestAnimationFrame(() => {
      const pH = p.offsetHeight;
      const pW = Math.min(p.offsetWidth, maxW);

      let top = rect.bottom + window.scrollY + MARGIN;
      let left = rect.left + window.scrollX + rect.width / 2 - pW / 2;

      // Flip above if below viewport
      if (top + pH > window.scrollY + window.innerHeight) {
        top = rect.top + window.scrollY - pH - MARGIN;
      }
      // Clamp horizontal
      left = Math.max(window.scrollX + MARGIN, Math.min(left, window.scrollX + window.innerWidth - pW - MARGIN));

      p.style.left = left + "px";
      p.style.top = top + "px";
      p.style.opacity = "1";
    });
  }

  // ─── Show / Hide ───
  function showPopup(rect) {
    const p = getPopup();
    p.querySelector("#qd-loading").style.display = "flex";
    p.querySelector("#qd-content").style.display = "none";
    p.querySelector("#qd-error").style.display = "none";
    p.querySelector("#qd-audio-btn").style.display = "none";
    p.querySelector("#qd-word").textContent = "";
    p.querySelector("#qd-phonetic").textContent = "";
    p.classList.add("qd-visible");
    positionPopup(rect);
  }

  function hidePopup() {
    if (!popup) return;
    popup.classList.remove("qd-visible");
    popup.style.display = "none";
    if (currentAbort) {
      currentAbort.abort();
      currentAbort = null;
    }
  }

  // ─── Render definition data ───
  function renderDefinition(data) {
    const p = getPopup();
    const entry = data[0];
    const word = entry.word || "";
    const phonetic = entry.phonetic || (entry.phonetics && entry.phonetics.find(ph => ph.text))?.text || "";
    const audioUrl = (entry.phonetics && entry.phonetics.find(ph => ph.audio))?.audio || "";

    p.querySelector("#qd-word").textContent = word;
    p.querySelector("#qd-phonetic").textContent = phonetic ? `  ${phonetic}` : "";

    if (audioUrl) {
      const btn = p.querySelector("#qd-audio-btn");
      btn.style.display = "inline-flex";
      btn.dataset.src = audioUrl;
    }

    let html = "";
    entry.meanings.forEach((meaning) => {
      html += `<div class="qd-pos">${meaning.partOfSpeech}</div>`;
      meaning.definitions.slice(0, 3).forEach((def, i) => {
        html += `<div class="qd-def"><span class="qd-num">${i + 1}.</span> ${escapeHtml(def.definition)}</div>`;
        if (def.example) {
          html += `<div class="qd-example">"${escapeHtml(def.example)}"</div>`;
        }
      });
      if (meaning.synonyms && meaning.synonyms.length) {
        html += `<div class="qd-synonyms"><strong>Synonyms:</strong> ${meaning.synonyms.slice(0, 5).map(escapeHtml).join(", ")}</div>`;
      }
      if (meaning.antonyms && meaning.antonyms.length) {
        html += `<div class="qd-antonyms"><strong>Antonyms:</strong> ${meaning.antonyms.slice(0, 5).map(escapeHtml).join(", ")}</div>`;
      }
    });

    p.querySelector("#qd-loading").style.display = "none";
    const content = p.querySelector("#qd-content");
    content.innerHTML = html;
    content.style.display = "block";
  }

  function renderError(msg) {
    const p = getPopup();
    p.querySelector("#qd-loading").style.display = "none";
    const err = p.querySelector("#qd-error");
    err.textContent = msg;
    err.style.display = "block";
  }

  function escapeHtml(str) {
    const d = document.createElement("span");
    d.textContent = str;
    return d.innerHTML;
  }

  // ─── Fetch definition ───
  async function fetchDefinition(word) {
    if (currentAbort) currentAbort.abort();
    currentAbort = new AbortController();

    try {
      const resp = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
        { signal: currentAbort.signal }
      );
      if (!resp.ok) {
        if (resp.status === 404) {
          renderError(`No definition found for "${word}".`);
        } else {
          renderError("Something went wrong. Please try again.");
        }
        return;
      }
      const data = await resp.json();
      renderDefinition(data);
    } catch (err) {
      if (err.name === "AbortError") return; // silently ignore aborts
      renderError("Network error. Check your connection.");
    }
  }

  // ─── Selection handler ───
  function onMouseUp(e) {
    // Ignore clicks inside our own popup
    if (popup && popup.contains(e.target)) return;

    // Small delay so the selection finalises
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : "";

      // Must be a single word (letters/hyphens/apostrophes, 1-45 chars)
      if (!text || !/^[a-zA-Z\u00C0-\u024F'-]{1,45}$/.test(text)) {
        return;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      showPopup(rect);
      getPopup().querySelector("#qd-word").textContent = text;
      fetchDefinition(text.toLowerCase());
    }, 10);
  }

  // Dismiss popup when clicking elsewhere
  function onMouseDown(e) {
    if (popup && !popup.contains(e.target)) {
      hidePopup();
    }
  }

  // Dismiss on Escape
  function onKeyDown(e) {
    if (e.key === "Escape") hidePopup();
  }

  // ─── Attach listeners ───
  document.addEventListener("mouseup", onMouseUp, true);
  document.addEventListener("mousedown", onMouseDown, true);
  document.addEventListener("keydown", onKeyDown, true);
})();
