# Memory Brewery

記憶を三段仕込みで作品へ変換する、参加型のアート体験です。

## Source of truth

- Product behavior: [`docs/product/memory_brewery_product_spec_v0.1.md`](docs/product/memory_brewery_product_spec_v0.1.md)
- Visual and interaction design: [`prototypes/high-fidelity-v0.1/`](prototypes/high-fidelity-v0.1/)

高忠実度プロトタイプは承認済みのデザイン・操作リファレンスです。実装は、色、タイポグラフィ、余白、画面構成、三段仕込みの順序、主要アニメーションを独自に変更してはなりません。挙動の変更は先にプロダクト仕様、デザインの変更は先にプロトタイプまたは `DESIGN.md` を更新します。

## 開発

開発運用は [AGENTS.md](AGENTS.md) と [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。アプリの技術スタック、クラウド、デプロイ方式は未決定です。

現行プロトタイプは静的ファイルとしてローカルで確認できます。`prototypes/high-fidelity-v0.1/README.md` の手順に従い、参加者画面と会場画面を別タブまたは別ブラウザで開いてください。

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

スタック確定後に formatter / lint / typecheck / unit test / build の実コマンドを `scripts/quality/commands.json` に登録します。詳細は [検証方針](docs/development/validation-policy.md) を参照してください。
