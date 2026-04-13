// main.js — DOM wiring and event handling.

import { toKansuji, fromKansuji, formatYen } from './kansuji.js';
import { TRANSLATIONS, getLang, setLang } from './i18n.js';

// ─── State ────────────────────────────────────────────────────────────────────

let currentLang   = getLang();
let currentSystem = localStorage.getItem('kansuji-system') || 'shouji';
let currentMode   = localStorage.getItem('kansuji-mode')   || 'numToKan'; // 'numToKan' | 'kanToNum'
let currentTheme  = localStorage.getItem('kansuji-theme')  || 'dark';

// ─── Query helpers ────────────────────────────────────────────────────────────

const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ─── Apply translations ───────────────────────────────────────────────────────

function t(key) {
  return TRANSLATIONS[currentLang][key] ?? key;
}

function applyTranslations() {
  document.documentElement.lang = currentLang;
  $$('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
  $$('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  $$('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  // System radio labels
  $$('[data-sys-label]').forEach(el => {
    el.textContent = t(el.dataset.sysLabel);
  });
  // Mode toggle labels
  $$('[data-mode-label]').forEach(el => {
    el.textContent = t(el.dataset.modeLabel);
  });
}

// ─── Theme ────────────────────────────────────────────────────────────────────

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

// ─── Conversion ──────────────────────────────────────────────────────────────

function convert() {
  const input = $('#main-input').value.trim();
  const outputEl = $('#main-output');
  const yenEverydayEl = $('#yen-everyday');
  const yenLegalEl    = $('#yen-legal');

  if (!input) {
    outputEl.textContent = '';
    yenEverydayEl.textContent = '';
    yenLegalEl.textContent    = '';
    return;
  }

  if (currentMode === 'numToKan') {
    // Number → Kansuji
    const num = Number(input.replace(/[,，_]/g, ''));
    if (!Number.isFinite(num) || !Number.isInteger(num) || num < 0) {
      outputEl.textContent = t('errorInvalid');
      outputEl.classList.add('error');
      return;
    }
    outputEl.classList.remove('error');
    outputEl.textContent = toKansuji(num, currentSystem);

    // Yen section
    try {
      yenEverydayEl.textContent = formatYen(num, false);
      yenLegalEl.textContent    = formatYen(num, true);
    } catch {
      yenEverydayEl.textContent = '';
      yenLegalEl.textContent    = '';
    }
  } else {
    // Kansuji → Number
    const result = fromKansuji(input);
    if (Number.isNaN(result)) {
      outputEl.textContent = t('errorInvalid');
      outputEl.classList.add('error');
      return;
    }
    outputEl.classList.remove('error');
    outputEl.textContent = result.toLocaleString('ja-JP');

    yenEverydayEl.textContent = '';
    yenLegalEl.textContent    = '';
  }
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

function setupCopy(btnId, sourceId) {
  const btn = $(`#${btnId}`);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const text = $(`#${sourceId}`)?.textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = t('copied');
      setTimeout(() => { btn.textContent = t('copy'); }, 1500);
    });
  });
}

// ─── Examples ─────────────────────────────────────────────────────────────────

const EXAMPLES = [
  { num: 0,                 label: '0' },
  { num: 1,                 label: '1' },
  { num: 10,                label: '10' },
  { num: 1234,              label: '1,234' },
  { num: 10000,             label: '10,000' },
  { num: 1000000,           label: '1,000,000' },
  { num: 100000000,         label: '1億' },
  { num: 1234567890,        label: '12億…' },
  { num: 1000000000000,     label: '1兆' },
  { num: 10000000000000000, label: '1京' },
];

function renderExamples() {
  const container = $('#examples-grid');
  if (!container) return;
  container.innerHTML = '';
  EXAMPLES.forEach(({ num, label }) => {
    const card = document.createElement('button');
    card.className = 'example-card';
    card.type = 'button';

    const labelEl = document.createElement('span');
    labelEl.className = 'example-label';
    labelEl.textContent = label;

    const kanEl = document.createElement('span');
    kanEl.className = 'example-kan';
    kanEl.textContent = toKansuji(num, currentSystem === 'fullwidth' ? 'shouji' : currentSystem);

    card.append(labelEl, kanEl);
    card.addEventListener('click', () => {
      // Switch to numToKan mode and fill input
      if (currentMode !== 'numToKan') {
        currentMode = 'numToKan';
        localStorage.setItem('kansuji-mode', currentMode);
        applyMode();
      }
      $('#main-input').value = String(num);
      convert();
    });
    container.appendChild(card);
  });
}

function applyMode() {
  const isNum = currentMode === 'numToKan';
  $$('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === currentMode);
  });
  const inputEl = $('#main-input');
  const inputLabel = $('#input-label');
  inputEl.value = '';
  if (isNum) {
    inputEl.inputMode = 'numeric';
    inputEl.placeholder = t('placeholder_num');
    inputLabel.textContent = t('inputNum');
  } else {
    inputEl.inputMode = 'text';
    inputEl.placeholder = t('placeholder_kan');
    inputLabel.textContent = t('inputKan');
  }
  // Show/hide system selector (not relevant for kanToNum)
  $('#system-section').style.display = isNum ? '' : 'none';
  // Show/hide yen section
  $('#yen-section').style.display = isNum ? '' : 'none';

  $('#main-output').textContent = '';
  $('#main-output').classList.remove('error');
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  applyTheme(currentTheme);

  // Language selector
  const langSelect = $('#lang-select');
  langSelect.value = currentLang;
  langSelect.addEventListener('change', () => {
    currentLang = langSelect.value;
    setLang(currentLang);
    applyTranslations();
    applyMode();
    renderExamples();
  });

  // Theme toggle
  const themeToggle = $('#theme-toggle');
  themeToggle.checked = currentTheme === 'light';
  themeToggle.addEventListener('change', () => {
    currentTheme = themeToggle.checked ? 'light' : 'dark';
    localStorage.setItem('kansuji-theme', currentTheme);
    applyTheme(currentTheme);
  });

  // Mode buttons
  $$('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentMode = btn.dataset.mode;
      localStorage.setItem('kansuji-mode', currentMode);
      applyMode();
    });
  });

  // System radio buttons
  $$('input[name="system"]').forEach(radio => {
    radio.checked = radio.value === currentSystem;
    radio.addEventListener('change', () => {
      currentSystem = radio.value;
      localStorage.setItem('kansuji-system', currentSystem);
      renderExamples();
      convert();
    });
  });

  // Input
  $('#main-input').addEventListener('input', convert);
  $('#main-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') convert();
  });

  // Copy buttons
  setupCopy('copy-output', 'main-output');

  applyTranslations();
  applyMode();
  renderExamples();
}

document.addEventListener('DOMContentLoaded', init);
