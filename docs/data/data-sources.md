# データソース台帳

この台帳は、実装で利用する原本データと fixture を区別し、出典・ライセンス・加工・再配布条件を追跡するための正本です。データを追加または更新する PR で必ず更新します。

| データセット名 | 区分 | 出典 | 取得日 | ライセンス | 使用属性 | 加工内容 | 再配布可否 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 未登録 | - | - | - | - | - | - | - |

## Current development fixtures

The local MVP currently ships only the following synthetic development fixtures. They are intentionally not verified real-product or real-place records, and they must not be presented as public catalog data.

| Dataset or page | Type | Provider | URL | Confirmed | License | Attributes used | Processing | Verbatim source text | Redistribution | Synthetic / unknowns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/adapters/fixture/sake-fixtures.json` | Development fixture | Memory Brewery development team | Not applicable | 2026-07-19 | Not applicable: synthetic fixture | `development-sake-snow-01` and `development-sake-water-02`; stable IDs, explicitly fictional brewery/product names, category, optional numeric fields, normalized generation traits, and synthetic land recommendations | Hand-authored comparison values for deterministic recipe tests | None | Allowed within this repository as development fixture | Both records and their generative parameters are synthetic. No real brewery, product, official description, image, or inferred production values are included. |
| `src/adapters/fixture/land-memory-fixtures.json` | Development fixture | Memory Brewery development team | Not applicable | 2026-07-18 | Not applicable: synthetic fixture | Stable ID, development display name, tags, season, generation traits | Hand-authored generative descriptions; `sourceFacts` is empty | None | Allowed within this repository as development fixture | Synthetic. The fixtures are inspired by broad Ishikawa themes only and make no claim to be factual geographic records. |

These JSON files are code-adjacent fixtures because the fixture loader imports and validates them at runtime. `data/source/` and `data/fixtures/` remain the locations for future original data and larger non-code fixture sets. Before adding real data, replace the applicable synthetic record with its source URL, provider, confirmation date, license, attributes, transformation, redistribution decision, and any remaining unknowns.

## ルール

- 原本データは `data/source/`（将来追加時）に置き、取得物・取得条件・ライセンスをこの台帳に記録する。
- テスト・ローカル体験用の最小データは `data/fixtures/`（将来追加時）に置き、原本と明示的に区別する。
- fixture は個人情報、秘密情報、利用条件上再配布できない原文・画像を含めない。
- 酒蔵公式の商品説明、ロゴ、画像は、利用許諾または明確なライセンスを確認するまで無断でリポジトリへ再配布しない。必要な検証には抽象化した属性または自作 fixture を使う。
- 外部入力と fixture は、採用したスキーマ検証で読み込み時に検証する。
