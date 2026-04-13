// i18n.js — UI string translations (ja/en).

export const TRANSLATIONS = {
  ja: {
    title:       '漢数字変換',
    subtitle:    '数字 ↔ 漢数字（小字・大字・全角）変換ツール',
    langLabel:   '言語',
    themeLabel:  'テーマ',
    modeNum:     '数字 → 漢数字',
    modeKan:     '漢数字 → 数字',
    inputNum:    '数字を入力',
    inputKan:    '漢数字を入力',
    sysLabel:    '変換方式',
    syShouji:    '小字（一二三）',
    syDaiji:     '大字（壱弐参）',
    syFullwidth: '全角数字（１２３）',
    output:      '変換結果',
    yenTitle:    '円・金額表示',
    yenEveryday: '通常（¥形式）',
    yenLegal:    '法的書類（大字）',
    examplesTitle: '例',
    placeholder_num: '例: 1234',
    placeholder_kan: '例: 千二百三十四',
    errorInvalid: '入力が認識できません',
    copy:        'コピー',
    copied:      'コピーしました',
  },
  en: {
    title:       'Kansuji Converter',
    subtitle:    'Convert between numbers and Japanese kanji numerals',
    langLabel:   'Language',
    themeLabel:  'Theme',
    modeNum:     'Number → Kansuji',
    modeKan:     'Kansuji → Number',
    inputNum:    'Enter number',
    inputKan:    'Enter kansuji',
    sysLabel:    'System',
    syShouji:    'Shouji (一二三)',
    syDaiji:     'Daiji / Legal (壱弐参)',
    syFullwidth: 'Fullwidth (１２３)',
    output:      'Result',
    yenTitle:    'Yen / Currency Format',
    yenEveryday: 'Everyday (¥ format)',
    yenLegal:    'Legal document (daiji)',
    examplesTitle: 'Examples',
    placeholder_num: 'e.g. 1234',
    placeholder_kan: 'e.g. 千二百三十四',
    errorInvalid: 'Cannot parse input',
    copy:        'Copy',
    copied:      'Copied!',
  },
};

export function getLang() {
  const saved = localStorage.getItem('kansuji-lang');
  if (saved) return saved;
  return navigator.language?.startsWith('ja') ? 'ja' : 'en';
}

export function setLang(lang) {
  localStorage.setItem('kansuji-lang', lang);
}
