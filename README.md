# Memory Brewery

記憶を三段仕込みで作品へ変換する、参加型のアート体験です。

## Source of truth

- Product behavior: [`docs/product/memory_brewery_product_spec_v0.1.md`](docs/product/memory_brewery_product_spec_v0.1.md)
- Visual and interaction design: [`prototypes/high-fidelity-v0.1/`](prototypes/high-fidelity-v0.1/)

高忠実度プロトタイプは承認済みのデザイン・操作リファレンスです。実装は、色、タイポグラフィ、余白、画面構成、三段仕込みの順序、主要アニメーションを独自に変更してはなりません。挙動の変更は先にプロダクト仕様、デザインの変更は先にプロトタイプまたは `DESIGN.md` を更新します。

## 開発

開発運用は [AGENTS.md](AGENTS.md) と [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。アプリの技術スタック、クラウド、デプロイ方式は未決定です。

現行プロトタイプは静的ファイルとしてローカルで確認できます。`prototypes/high-fidelity-v0.1/README.md` の手順に従い、参加者画面と会場画面を別タブまたは別ブラウザで開いてください。React版では同一ブラウザ・同一originの参加者タブと`/venue.html`間だけで、明示的に会場へ作品を重ねられます。詳細と制約は[会場ローカル同期](docs/venue/local-venue-synchronization.md)を参照してください。

## 品質ゲート

フックの有効化（Node.js と Git が必要）:

```sh
node scripts/setup-git-hooks.mjs
```

現時点で実行可能な基盤検証は次のとおりです。

```sh
node scripts/quality/verify-foundation.mjs
node scripts/quality/pre-commit.mjs
node scripts/quality/pre-push.mjs
```

formatter / lint / typecheck / unit test / build の実コマンドは `scripts/quality/commands.json` に登録済みです。詳細は [検証方針](docs/development/validation-policy.md) を参照してください。

## Local application foundation

Vite、React、TypeScript、品質コマンド、参加者・会場の最小入口を導入済みです。Node.js `>=20.19.0` と npm を前提にし、再現可能な導入には `npm install` ではなく `npm ci` を使用します。実行手順、Playwright Chromium の導入、TypeScript設定の判断は [ローカルアプリケーション基盤](docs/development/local-application-foundation.md) を参照してください。この段階ではプロダクト機能やプロトタイプのReact移植は行っていません。
