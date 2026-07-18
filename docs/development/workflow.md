# 開発ワークフロー

1. Issue に目的、スコープ外、受け入れ基準、ローカル検証を記録する。
2. `main` を起点に `type/issue-N-short-name` ブランチを作る。
3. `AGENTS.md`、対象 Issue、プロダクト仕様、該当するプロトタイプを読んでから変更する。
4. 挙動変更なら先に product spec、デザイン変更なら先にプロトタイプまたは `DESIGN.md` を更新する。
5. ローカルで品質ゲートと Issue 固有の検証を行い、結果を記録する。
6. focused な Conventional Commit を作り、フックを回避せずに push する。
7. `main` 宛ての PR を作成する。PR テンプレートの対象 Issue、`Closes #N`、変更内容、受け入れ基準、検証結果を埋める。
8. CI 結果を確認し、範囲内の失敗のみ修正する。Codex はレビュー済みでも自動マージしない。

初期基盤など、対応する Issue が存在しない所有者依頼は `chore/bootstrap-<short-name>` ブランチで開始できる。完了後のすべての継続開発は Issue を作成する。
