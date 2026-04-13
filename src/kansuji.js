// kansuji.js — Kanji numeral conversion logic.
//
// Systems:
//   'shouji'   — 小字 (everyday): 一二三四五六七八九十百千万億兆京
//   'daiji'    — 大字 (legal/formal): 壱弐参肆伍陸漆捌玖拾佰阡萬億兆京
//   'fullwidth' — 全角数字: １２３４５

const SHOUJI_DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const DAIJI_DIGITS  = ['零', '壱', '弐', '参', '肆', '伍', '陸', '漆', '捌', '玖'];
const FULLWIDTH     = ['０', '１', '２', '３', '４', '５', '６', '７', '８', '９'];

const DIGIT_UNITS_SHOU = ['', '十', '百', '千'];
const DIGIT_UNITS_DAI  = ['', '拾', '佰', '阡'];

// Groups of 4 digits (万, 億, 兆, 京).
const LARGE_UNITS_SHOU = ['', '万', '億', '兆', '京'];
const LARGE_UNITS_DAI  = ['', '萬', '億', '兆', '京'];

// Max supported value: 9999京9999兆9999億9999万9999 = 9.999...e16 < 10^17
// Defined as BigInt to avoid floating-point issues.
const MAX_VALUE = 99999999999999999n; // ~10^17, well above 10^16 (京)

/**
 * Convert a non-negative integer <= MAX_VALUE to kansuji string.
 * @param {number|bigint} num
 * @param {'shouji'|'daiji'|'fullwidth'} system
 * @returns {string}
 */
export function toKansuji(num, system = 'shouji') {
  if (typeof num !== 'bigint') {
    if (!Number.isInteger(num) || num < 0) throw new RangeError('num must be a non-negative integer');
    num = BigInt(num);
  }
  if (num < 0n || num > MAX_VALUE) throw new RangeError(`num out of range (0 – ${MAX_VALUE})`);

  if (system === 'fullwidth') return toFullwidth(String(num));

  const digits = system === 'daiji' ? DAIJI_DIGITS : SHOUJI_DIGITS;
  const unitGroup = system === 'daiji' ? DIGIT_UNITS_DAI : DIGIT_UNITS_SHOU;
  const largeUnit = system === 'daiji' ? LARGE_UNITS_DAI : LARGE_UNITS_SHOU;

  // Special case zero
  if (num === 0n) return digits[0];

  // Split into groups of 4 from the right.
  const groups = [];
  let n = num;
  while (n > 0n) {
    groups.push(Number(n % 10000n));
    n /= 10000n;
  }

  let result = '';
  for (let gi = groups.length - 1; gi >= 0; gi--) {
    const g = groups[gi];
    if (g === 0) continue;

    const groupStr = convertGroup(g, digits, unitGroup);
    result += groupStr + largeUnit[gi];
  }

  return result;
}

/**
 * Convert a 4-digit group (0–9999) to kansuji segment.
 * Leading 一 is omitted only for 千 position in shouji convention.
 * e.g. 1000 → 千, not 一千 (but 大字 keeps 壱阡)
 * For groups at 万+ level, leading 1 for 千 IS written: 一万千 = 11000.
 * We follow the conventional rule:
 *   - In the primary (ones) group: omit 一 before 千/百/十 if digit is 1
 *     BUT only in shouji.
 *   Actually the standard rule is simpler: omit 一 before 千, 百, 十 only
 *   in shouji, for the ONES GROUP only (g position 0). For higher groups it's
 *   also omitted: 一万 not 壱万, but 壱萬 keeps it.
 *
 *   Standard convention:
 *     - 小字: omit leading 一 before 千/百/十 (so 千二百三十四, not 一千二百三十四)
 *     - 大字: always write digit, even when 1 (壱阡弐佰参拾肆)
 */
function convertGroup(g, digits, unitGroup) {
  const isDaiji = digits === DAIJI_DIGITS;
  let result = '';
  // Units: 千, 百, 十, 一  (positions 3, 2, 1, 0)
  for (let pos = 3; pos >= 0; pos--) {
    const d = Math.floor(g / (10 ** pos)) % 10;
    if (d === 0) continue;
    const unit = unitGroup[pos];
    if (pos === 0) {
      // Ones position: just the digit character, no unit suffix
      result += digits[d];
    } else {
      // For shouji: omit '一' before 千/百/十 (d===1, unit!='')
      if (!isDaiji && d === 1 && unit !== '') {
        result += unit;
      } else {
        result += digits[d] + unit;
      }
    }
  }
  return result;
}

// ─── fromKansuji ──────────────────────────────────────────────────────────────

// Build reverse maps at module load time.
const SHOUJI_CHAR_MAP = buildCharMap(SHOUJI_DIGITS, DIGIT_UNITS_SHOU, LARGE_UNITS_SHOU);
const DAIJI_CHAR_MAP  = buildCharMap(DAIJI_DIGITS,  DIGIT_UNITS_DAI,  LARGE_UNITS_DAI);

function buildCharMap(digits, unitGroup, largeUnit) {
  const digitMap = {};
  digits.forEach((ch, i) => { digitMap[ch] = i; });
  const groupUnitMap = {};
  unitGroup.slice(1).forEach((ch, i) => { groupUnitMap[ch] = i + 1; }); // 十=1,百=2,千=3
  const largeMap = {};
  largeUnit.slice(1).forEach((ch, i) => { largeMap[ch] = i + 1; });     // 万=1,億=2,...
  return { digitMap, groupUnitMap, largeMap };
}

/**
 * Convert a kansuji string to a JavaScript number.
 * Supports both 小字 and 大字. Returns NaN if input is invalid.
 * @param {string} str
 * @returns {number}
 */
export function fromKansuji(str) {
  if (!str || typeof str !== 'string') return NaN;
  str = str.trim();

  // Detect system by checking for daiji-only chars.
  const isDaiji = /[壱弐参肆伍陸漆捌玖拾佰阡萬]/.test(str);
  const { digitMap, groupUnitMap, largeMap } = isDaiji ? DAIJI_CHAR_MAP : SHOUJI_CHAR_MAP;

  // Special case: single zero char
  if (str === '〇' || str === '零') return 0;

  // Parse: split by large units (万/億/兆/京 or 萬/億/兆/京).
  // Strategy: walk the string, accumulate current group value,
  // then multiply by large unit when encountered.
  let total = 0n;
  let groupVal = 0;
  let pos = 0;

  while (pos < str.length) {
    const ch = str[pos];

    if (largeMap[ch] !== undefined) {
      // Flush current group into total using the large multiplier.
      const multiplier = 10000n ** BigInt(largeMap[ch]);
      total += BigInt(groupVal || 1) * multiplier;
      // If groupVal was 0 here it means we had something like 億 alone meaning 1億.
      // But actually groupVal=0 means no preceding chars, handle below.
      // Re-check: if previous chars accumulated nothing (groupVal===0), we treat as 1.
      // Actually this is already handled: we reset groupVal after flush.
      groupVal = 0;
      pos++;
      continue;
    }

    if (digitMap[ch] !== undefined) {
      const dval = digitMap[ch];
      // Lookahead for group unit (十/百/千 etc.)
      const next = str[pos + 1];
      if (next && groupUnitMap[next] !== undefined) {
        const unitPow = 10 ** groupUnitMap[next];
        groupVal += (dval === 0 ? 1 : dval) * unitPow;
        pos += 2;
      } else {
        // Ones digit
        groupVal += dval;
        pos++;
      }
      continue;
    }

    if (groupUnitMap[ch] !== undefined) {
      // Unit without preceding digit → implicit 1 (e.g. 千 = 1000)
      groupVal += 10 ** groupUnitMap[ch];
      pos++;
      continue;
    }

    // Unknown character
    return NaN;
  }

  total += BigInt(groupVal);

  // Check fits in safe integer
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) {
    // Return as number anyway (may lose precision for very large values)
    return Number(total);
  }
  return Number(total);
}

// ─── Fullwidth helpers ────────────────────────────────────────────────────────

/**
 * Convert ASCII digit string to fullwidth digit string.
 * @param {string} str
 * @returns {string}
 */
export function toFullwidth(str) {
  return String(str).replace(/[0-9]/g, ch => FULLWIDTH[Number(ch)]);
}

/**
 * Convert fullwidth digit string to ASCII digit string.
 * @param {string} str
 * @returns {string}
 */
export function fromFullwidth(str) {
  return String(str).replace(/[０-９]/g, ch => String(FULLWIDTH.indexOf(ch)));
}

// ─── Yen formatting ───────────────────────────────────────────────────────────

/**
 * Format a number as Japanese Yen.
 * @param {number} num - Non-negative integer
 * @param {boolean} useDaiji - Use legal daiji (大字) system
 * @returns {string}
 */
export function formatYen(num, useDaiji = false) {
  if (!Number.isInteger(num) || num < 0) throw new RangeError('num must be a non-negative integer');
  if (useDaiji) {
    // Legal format: e.g. 金壱萬弐仟参佰四拾伍円也
    const kanji = toKansuji(num, 'daiji');
    return `金${kanji}円也`;
  } else {
    // Everyday format: ¥ prefix with comma-separated groups
    const kansuji = toKansuji(num, 'shouji');
    const formatted = Number(num).toLocaleString('ja-JP');
    return `¥${formatted}（${kansuji}円）`;
  }
}
