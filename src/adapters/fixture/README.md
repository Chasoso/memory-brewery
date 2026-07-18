# Development fixtures

このフォルダのJSONは外部APIなしでローカルMVPを検証するための **synthetic development fixtures** です。実在する酒蔵、商品、公式説明、画像、オープンデータの原文は含みません。

loaderはZodで内容を検証し、空集合、ID重複、参加者入力が参照する土地IDの不一致を拒否します。出典・再配布方針の詳細は `docs/data/data-sources.md` を参照してください。
