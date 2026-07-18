# v0.1.0 実装計画

## 前提

[ADR 0001](../adr/0001-local-mvp-architecture.md) の Vite + React + TypeScript strict を採用する。ここに記すのは次の実装Issueへ分解するための計画であり、本Issueでは `package.json`、アプリコード、プロトタイプ、デプロイ設定を変更しない。product spec と高忠実度プロトタイプが正本である。

## 推奨ディレクトリ構成

```text
src/
  participant/                 # 参加者画面のReact composition
  venue/                       # 会場画面のReact composition
  application/                 # use case: brew, play, publish
  domain/
    recipe/                    # 明示的なBrewingRecipe型と変換規則
    time/ random/              # Clock, SeededRandom, AnimationDriver interfaces
  ports/                       # repository, publisher, audio, visual interfaces
  adapters/
    fixture/                   # schema-validated fixture
    broadcast-channel/         # local multi-tab venue synchronization
    tone/ canvas/              # browser-only implementations
  test-support/                # fixed clock/RNG/animation and builders
  styles/                      # prototype tokens and component styles
public/
  fixtures/                    # non-redistributable source dataを含まない最小fixture
tests/
  e2e/                         # Playwright participant / venue flows
```

参加者と会場は別エントリを持つが、一つのViteプロジェクトに置く。`domain` はReact、Tone.js、Canvas、BroadcastChannelに依存しない。`adapters` はbrowser APIを境界内に閉じ込める。

## 実装Issue案と順序

| 順序 | Issue案 | 目的・依存 | 受け入れ基準 | 追加テスト |
| --- | --- | --- | --- | --- |
| 1 | `chore: initialize local TypeScript quality toolchain` | ADR 0001。Vite/React/TS strict、npm lockfile、Prettier、ESLint、Vitest、Playwrightと実コマンドを導入 | `format`/`lint`/`typecheck`/`test`/`build` がWindowsで実行でき、品質ゲートに登録される。アプリ機能は作らない | config smoke、`tsc --noEmit`、empty build |
| 2 | `feat: add validated fixtures and brewing domain model` | #1。酒・土地・参加入力・`BrewingRecipe` のschema/型、seeded mapper、Clock/RNG portを作る | fixtureだけで同一入力+seedから同一recipeを返し、不正fixtureを拒否する | schema、mapper、seed再現性、fixed clock |
| 3 | `feat: build participant three-stage flow` | #1 #2。プロトタイプを参照して初添・踊り・仲添・留添・recipe表示をReactへ移植 | 三段仕込みの順序、色/余白/タイポグラフィ/主要アニメーションが正本に合い、主要操作を90秒以内で完走できる | component/use-case、keyboard/mobile viewport、固定animation snapshot |
| 4 | `feat: add deterministic canvas and optional browser audio` | #2 #3。Canvas rendererとTone adapter/no-op audioを追加 | 同一recipe+seedで同一描画パラメータ。音声拒否/未対応でも画面・生成・完走に影響しない | renderer parameter、audio no-op、fixed driver screenshot |
| 5 | `feat: publish participant recipes to local venue tabs` | #2 #3。BroadcastChannel adapterと会場画面を実装 | 同一ブラウザの別タブで新規recipeが会場画面へ反映。リロード時の表示規則を明示 | publisher contract、two-page Playwright、複数recipe aggregation |
| 6 | `test: add end-to-end and visual regression coverage` | #3–#5。participant/venue E2Eと正本比較の手順を固定 | モバイル参加者、会場、音声なし、fixture fallback、固定seedの視覚差分がCIで再現可能 | Playwright flows、screenshots、manual checklist |
| 7 | `docs: complete v0.1.0 local MVP acceptance review` | #1–#6。仕様・プロトタイプとのトレーサビリティを確認 | FR-01–10 と AC-01–08 の対象/結果、未対応項目、データ出典が記録される | full quality gate、手動二画面確認 |
| 8 | `spike: evaluate AWS serverless publication` | #7後の独立Issue。実会場でクロス端末同期/公開が必要な場合のみ | polling対WebSocketの負荷・コスト、IaC/削除runbook/Budgetを評価。AWS実装は別Issue | adapter contract、費用再計算、公開前のintegration plan |

Issue #1 は常に単一PRで扱い、#2–#7は前の受け入れ基準が満たされてから開始する。#8はローカルMVPをブロックしない。

## v0.1.0 Definition of Done

- product spec のMVP範囲とAC-01〜08のうちローカルで検証可能な項目が、fixtureのみで実証されている。
- 参加者画面はスマートフォン幅、会場画面は会場表示幅で、承認済みプロトタイプの視覚・操作正本に一致する。
- 三段仕込み、recipe JSON、Canvas作品、Tone.js音響（利用可能時）、音声なしの完走、会場反映が動く。
- 同一入力・fixture・seed・clock・animation driverで、テスト結果と視覚出力が再現可能である。
- 外部入力とfixtureはschema検証され、酒蔵公式の無許諾説明文・画像を再配布しない。
- UI、domain、audio、visual、data/sync adapterが分離され、domainはbrowser framework/APIに依存しない。
- `format`、`lint`、strict `typecheck`、unit test、build、Playwright E2EがWindowsで実行でき、pre-commit/pre-push/CIへ登録される。
- 同一ブラウザの複数タブで参加者・会場のフローを手動確認し、結果と制約（異ブラウザ/異端末は公開対応まで対象外）を記録する。
- AWS、デプロイ、クラウドリソース、外部APIはv0.1.0に含まない。
