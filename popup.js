// ─── Popup script for QuickDefine ───

const input = document.getElementById("word-input");
const btn = document.getElementById("search-btn");
const result = document.getElementById("result");

btn.addEventListener("click", () => lookup(input.value.trim()));
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") lookup(input.value.trim());
});

async function lookup(word) {
  if (!word || !/^[a-zA-Z\u00C0-\u024F'-]{1,45}$/.test(word)) {
    result.innerHTML = `<p class="error">Please enter a valid English word.</p>`;
    return;
  }

  result.innerHTML = `<p class="loading">Looking up "${word}"…</p>`;

  try {
    const resp = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );

    if (!resp.ok) {
      result.innerHTML =
        resp.status === 404
          ? `<p class="error">No definition found for "${word}".</p>`
          : `<p class="error">Something went wrong. Try again.</p>`;
      return;
    }

    const data = await resp.json();
    renderResult(data);
  } catch {
    result.innerHTML = `<p class="error">Network error. Check your connection.</p>`;
  }
}

function renderResult(data) {
  const entry = data[0];
  const phonetic =
    entry.phonetic ||
    (entry.phonetics && entry.phonetics.find((p) => p.text))?.text ||
    "";

  let html = `<div class="word-title">${esc(entry.word)}</div>`;
  if (phonetic) html += `<div class="phonetic">${esc(phonetic)}</div>`;

  entry.meanings.forEach((m) => {
    html += `<div class="pos">${esc(m.partOfSpeech)}</div>`;
    m.definitions.slice(0, 3).forEach((d, i) => {
      html += `<div class="def"><span class="def-num">${i + 1}.</span> ${esc(d.definition)}</div>`;
      if (d.example) {
        html += `<div class="example">"${esc(d.example)}"</div>`;
      }
    });
  });

  result.innerHTML = html;
}

function esc(s) {
  const d = document.createElement("span");
  d.textContent = s;
  return d.innerHTML;
}
