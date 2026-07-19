# Data directory

## Current local-MVP fixture status

There is no original or externally sourced dataset in this directory yet. The runtime fixture loader currently reads two small, explicitly synthetic development JSON files from `src/adapters/fixture/`:

- `sake-fixtures.json`: two fictional development sake profiles (`development-sake-snow-01` and `development-sake-water-02`) with synthetic generation traits and land-memory recommendations.
- `land-memory-fixtures.json`: three fictional development land-memory profiles.

They contain no product images, official product descriptions, or copied external records. Their provenance, confirmation date, processing, and redistribution status are recorded in [`docs/data/data-sources.md`](../docs/data/data-sources.md). Do not treat these fixtures as public-facing sake or geographic data.

このディレクトリは、将来のローカル開発用データを管理するための場所です。現時点ではデータセットを同梱しません。

- `source/`: ライセンスと再配布条件を確認済みの原本データ用。追加時は `docs/data/data-sources.md` を更新する。
- `fixtures/`: テスト・デモ・ローカル検証用の最小データ。原本と区別し、スキーマ検証可能にする。

酒蔵公式の商品説明・ロゴ・画像は、許諾または明示的ライセンスなしに置かないでください。外部 API や原本がなくても、fixture・mock・ルールベースのフォールバックで主要体験を検証できるようにします。
