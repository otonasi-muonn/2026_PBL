## Backend

> [!NOTE]
>
> - サーバーサイドの設計に関しては，[DESIGN.md](docs/DESIGN.md) を参照してください．
> - 設計に対する質問・意見に関しては，気にせずにIssueを送ってください．

## APIキーの取得と環境変数の設定方法

### APIキーの取得

自身のGoogleアカウントで，[Google AI Studio](https://aistudio.google.com) にアクセスし，APIキーを作成してください．
作成したAPIキーを自分で管理してください．(誰にも見せないようにしてください)

### `.dev.vars` での環境変数の設定

`backend/.dev.vars` を作成し，`.dev.vars.example` の記載例に従ってください．以下の例は，APIキーを `XXXX` としたときのものです．

```txt
LLM_API_KEY=XXXX
USE_MOCK=false
```

この状態で，`bun dev` を実行すると環境変数が読み込まれます．
