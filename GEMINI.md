# テーブル定義変換ツール (Table Definition Conversion Tool)

TSVまたはCSV形式で記述されたテーブル定義書から、各種プログラミング言語のモデルやDDL（データ定義言語）を自動生成するウェブツールです。

## 主な機能

- **多様な入力形式**: TSV/CSVファイルまたはテキストエリアからの直接入力に対応。
- **複数フォーマットへの変換**: 以下の形式への一括変換が可能です。
  - DDL (PostgreSQL)
  - TypeScript 型定義
  - Java (EBean) モデル
  - Java リポジトリクラス
  - Java サービスクラス
- **一括ダウンロード**: 生成されたすべてのファイルをZIP形式で一括ダウンロードできます。

## 使用方法

1.  **入力**:
    - 「ファイル入力」タブを選択し、テーブル定義が記述されたTSV/CSVファイルをアップロードします。
    - または、「テキストエリア入力」タブを選択し、内容を直接貼り付けます。
2.  **変換オプション**:
    - 生成したいフォーマット（DDL, TypeScriptなど）のチェックボックスを選択します。
3.  **実行**:
    - 「変換実行」ボタンをクリックします。
4.  **結果の確認とダウンロード**:
    - 生成されたコードが各タブに表示されます。
    - 個別の「ダウンロード」ボタン、または「すべてダウンロード (ZIP)」ボタンでファイルを保存します。

## 入力フォーマット

入力するTSV/CSVは、以下のヘッダーを持つ必要があります。1行で1つのカラムを定義します。

| ヘッダー          | 説明                               | 例                  |
| ----------------- | ---------------------------------- | ------------------- |
| `TableName`       | テーブルの物理名                   | `users`             |
| `TableName_JP`    | テーブルの論理名                   | `ユーザー`          |
| `ColName`         | カラムの物理名                     | `user_id`           |
| `ColName_JP`      | カラムの論理名                     | `ユーザーID`        |
| `PK/FK`           | `PK` (主キー) or `AK` (代替キー)   | `PK`                |
| `Type`            | データ型 (PostgreSQL準拠)          | `varchar`           |
| `Length`          | 型の長さ                           | `255`               |
| `Constraint`      | 制約 (`NN`: NOT NULL, `U`: UNIQUE) | `NN`                |
| `Default`         | デフォルト値                       | `''`                |
| `Description`     | 説明                               |                     |
| `Idx1`, `Idx2`... | インデックス (値はインデックス内の順序) | `1`                 |

### サンプルデータ (TSV)

```tsv
TableName	TableName_JP	ColName	ColName_JP	PK/FK	Type	Length	Constraint	Default	Description	Idx1	Idx2	Idx3
users	ユーザー	id	ID	PK	bigserial		NN			1		
users	ユーザー	user_name	ユーザー名	AK	varchar	255	NN, U		ユーザーのディスプレイネーム		1	2
users	ユーザー	email	メールアドレス		varchar	255	NN, U				2	3
users	ユーザー	note	説明		varchar							
users	ユーザー	demartment_code	部署コード		char	3	NN				3	1
users	ユーザー	is_deleted	削除フラグ		boolean		NN	false				
users	ユーザー	created_at	作成日時		timestamp		NN	now()				
department	部署	id	ID	PK	bigserial		NN			1		
department	部署	code	部署コード	AK	char	3	NN				1	
department	部署	description	説明		varchar							
department	部署	name	部署名		varchar	256	NN					
department	部署	created_at	作成日時		timestamp		NN	now()				
```

## ディレクトリ構成

- index.html : テーブル定義変換ツール本体。UI となる HTML と変換ロジックを全て含むシングルページアプリ。
- js/ : 外部ライブラリを入れるディレクトリ
- samples/input.tsv : 変換元のサンプルファイル
- samples/output : 変換後のサンプルファイル

## 使用技術

- [Pico.css](https://picocss.com/): スタイリング
- [Papa Parse](https://www.papaparse.com/): CSV/TSVパーサー
- [JSZip](https://stuk.github.io/jszip/): ZIPファイル生成
- Play Framework
- EBean
- Java

## 使用しない技術

- Spring
