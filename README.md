# 漢数字変換 — Kansuji Converter

[![Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://sen.ltd/portfolio/kansuji-converter/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

数字と漢数字を相互変換するブラウザツール。小字・大字・全角数字の 3 方式、京（10^16）までの単位に対応。

A browser-based converter between Arabic numerals and Japanese kanji numerals (kansuji). Supports three systems — everyday (小字), legal (大字/daiji), and fullwidth — up to 京 (10^16).

## Features / 機能

| Feature | Detail |
|---------|--------|
| 数字 → 漢数字 | 1234 → 千二百三十四 |
| 漢数字 → 数字 | 千二百三十四 → 1,234 |
| 小字 (shouji) | 一二三四五六七八九十百千万億兆京 |
| 大字 (daiji)  | 壱弐参肆伍陸漆捌玖拾佰阡萬億兆京 |
| 全角数字 | １２３４５６７８９０ |
| 円・金額表示 | ¥1,234（千二百三十四円）/ 金壱阡弐佰参拾肆円也 |
| 最大値 | 一京（10^16） |
| UI | 日本語 / English, ダーク / ライトテーマ |

## Demo / デモ

**https://sen.ltd/portfolio/kansuji-converter/**

## Usage / 使い方

No build step — open `index.html` directly or serve locally:

```sh
npm run serve   # python3 -m http.server 8080
```

Then visit http://localhost:8080.

## Tests / テスト

```sh
npm test
```

74 tests covering `toKansuji`, `fromKansuji`, `toFullwidth`, `fromFullwidth`, `formatYen`, and round-trips.

## API

```js
import { toKansuji, fromKansuji, formatYen } from './src/kansuji.js';

toKansuji(1234)            // → '千二百三十四'
toKansuji(1234, 'daiji')   // → '壱阡弐佰参拾肆'
toKansuji(1234, 'fullwidth') // → '１２３４'

fromKansuji('千二百三十四')   // → 1234
fromKansuji('壱阡弐佰参拾肆') // → 1234

formatYen(1234)            // → '¥1,234（千二百三十四円）'
formatYen(1234, true)      // → '金壱阡弐佰参拾肆円也'
```

## License

MIT © 2026 [SEN LLC (SEN 合同会社)](https://sen.ltd)
