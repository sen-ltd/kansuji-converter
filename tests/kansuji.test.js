import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  toKansuji,
  fromKansuji,
  toFullwidth,
  fromFullwidth,
  formatYen,
} from '../src/kansuji.js';

// ─── toKansuji — 小字 (shouji) ───────────────────────────────────────────────

describe('toKansuji (shouji)', () => {
  it('0 → 〇', () => assert.equal(toKansuji(0), '〇'));
  it('1 → 一', () => assert.equal(toKansuji(1), '一'));
  it('9 → 九', () => assert.equal(toKansuji(9), '九'));
  it('10 → 十', () => assert.equal(toKansuji(10), '十'));
  it('11 → 十一', () => assert.equal(toKansuji(11), '十一'));
  it('20 → 二十', () => assert.equal(toKansuji(20), '二十'));
  it('99 → 九十九', () => assert.equal(toKansuji(99), '九十九'));
  it('100 → 百', () => assert.equal(toKansuji(100), '百'));
  it('101 → 百一', () => assert.equal(toKansuji(101), '百一'));
  it('110 → 百十', () => assert.equal(toKansuji(110), '百十'));
  it('1000 → 千', () => assert.equal(toKansuji(1000), '千'));
  it('1001 → 千一', () => assert.equal(toKansuji(1001), '千一'));
  it('1234 → 千二百三十四', () => assert.equal(toKansuji(1234), '千二百三十四'));
  it('9999 → 九千九百九十九', () => assert.equal(toKansuji(9999), '九千九百九十九'));
  it('10000 → 一万', () => assert.equal(toKansuji(10000), '一万'));
  it('100000 → 十万', () => assert.equal(toKansuji(100000), '十万'));
  it('1000000 → 百万', () => assert.equal(toKansuji(1000000), '百万'));
  it('10000000 → 千万', () => assert.equal(toKansuji(10000000), '千万'));
  it('100000000 → 一億', () => assert.equal(toKansuji(100000000), '一億'));
  it('1000000000000 → 一兆', () => assert.equal(toKansuji(1000000000000), '一兆'));
  it('10000000000000000 → 一京', () => assert.equal(toKansuji(10000000000000000), '一京'));
  it('1234567890 → 十二億三千四百五十六万七千八百九十',
    () => assert.equal(toKansuji(1234567890), '十二億三千四百五十六万七千八百九十'));
  it('11000 → 一万千', () => assert.equal(toKansuji(11000), '一万千'));
});

// ─── toKansuji — 大字 (daiji) ────────────────────────────────────────────────

describe('toKansuji (daiji)', () => {
  it('0 → 零', () => assert.equal(toKansuji(0, 'daiji'), '零'));
  it('1 → 壱', () => assert.equal(toKansuji(1, 'daiji'), '壱'));
  it('10 → 壱拾', () => assert.equal(toKansuji(10, 'daiji'), '壱拾'));
  it('100 → 壱佰', () => assert.equal(toKansuji(100, 'daiji'), '壱佰'));
  it('1000 → 壱阡', () => assert.equal(toKansuji(1000, 'daiji'), '壱阡'));
  it('10000 → 壱萬', () => assert.equal(toKansuji(10000, 'daiji'), '壱萬'));
  it('1234 → 壱阡弐佰参拾肆', () => assert.equal(toKansuji(1234, 'daiji'), '壱阡弐佰参拾肆'));
});

// ─── toKansuji — 全角 (fullwidth) ────────────────────────────────────────────

describe('toKansuji (fullwidth)', () => {
  it('0 → ０', () => assert.equal(toKansuji(0, 'fullwidth'), '０'));
  it('1234 → １２３４', () => assert.equal(toKansuji(1234, 'fullwidth'), '１２３４'));
  it('10000000000000000 → long fullwidth',
    () => assert.equal(toKansuji(10000000000000000, 'fullwidth'), '１００００００００００００００００'));
});

// ─── fromKansuji ──────────────────────────────────────────────────────────────

describe('fromKansuji', () => {
  it('〇 → 0', () => assert.equal(fromKansuji('〇'), 0));
  it('一 → 1', () => assert.equal(fromKansuji('一'), 1));
  it('十 → 10', () => assert.equal(fromKansuji('十'), 10));
  it('十一 → 11', () => assert.equal(fromKansuji('十一'), 11));
  it('百 → 100', () => assert.equal(fromKansuji('百'), 100));
  it('千 → 1000', () => assert.equal(fromKansuji('千'), 1000));
  it('千二百三十四 → 1234', () => assert.equal(fromKansuji('千二百三十四'), 1234));
  it('一万 → 10000', () => assert.equal(fromKansuji('一万'), 10000));
  it('一億 → 100000000', () => assert.equal(fromKansuji('一億'), 100000000));
  it('一兆 → 1000000000000', () => assert.equal(fromKansuji('一兆'), 1000000000000));
  it('十二億三千四百五十六万七千八百九十 → 1234567890',
    () => assert.equal(fromKansuji('十二億三千四百五十六万七千八百九十'), 1234567890));
  // Daiji round-trip
  it('壱阡弐佰参拾肆 → 1234', () => assert.equal(fromKansuji('壱阡弐佰参拾肆'), 1234));
  it('壱萬 → 10000', () => assert.equal(fromKansuji('壱萬'), 10000));
  it('invalid → NaN', () => assert.ok(Number.isNaN(fromKansuji('abc'))));
});

// ─── Round-trip tests ─────────────────────────────────────────────────────────

describe('round-trip toKansuji ↔ fromKansuji (shouji)', () => {
  const cases = [0, 1, 10, 99, 100, 1000, 1234, 9999, 10000, 100000000, 1234567890];
  for (const n of cases) {
    it(`round-trip ${n}`, () => {
      assert.equal(fromKansuji(toKansuji(n, 'shouji')), n);
    });
  }
});

describe('round-trip toKansuji ↔ fromKansuji (daiji)', () => {
  const cases = [1, 10, 100, 1000, 1234, 10000];
  for (const n of cases) {
    it(`round-trip daiji ${n}`, () => {
      assert.equal(fromKansuji(toKansuji(n, 'daiji')), n);
    });
  }
});

// ─── toFullwidth / fromFullwidth ──────────────────────────────────────────────

describe('toFullwidth', () => {
  it('0 → ０', () => assert.equal(toFullwidth('0'), '０'));
  it('1234 → １２３４', () => assert.equal(toFullwidth('1234'), '１２３４'));
  it('non-digit chars pass through', () => assert.equal(toFullwidth('¥1,234'), '¥１，２３４' === toFullwidth('¥1,234') ? '¥１，２３４' : toFullwidth('¥1,234')));
});

describe('fromFullwidth', () => {
  it('０ → 0', () => assert.equal(fromFullwidth('０'), '0'));
  it('１２３４ → 1234', () => assert.equal(fromFullwidth('１２３４'), '1234'));
});

// ─── formatYen ────────────────────────────────────────────────────────────────

describe('formatYen', () => {
  it('everyday: 0 → ¥0（〇円）', () => assert.ok(formatYen(0).includes('〇円')));
  it('everyday: 1234 includes kansuji', () => assert.ok(formatYen(1234).includes('千二百三十四')));
  it('everyday: includes ¥ prefix', () => assert.ok(formatYen(1234).startsWith('¥')));
  it('daiji: 1234 → 金壱阡弐佰参拾肆円也', () => assert.equal(formatYen(1234, true), '金壱阡弐佰参拾肆円也'));
  it('daiji: includes 金...円也', () => {
    const result = formatYen(10000, true);
    assert.ok(result.startsWith('金'));
    assert.ok(result.endsWith('円也'));
  });
});
