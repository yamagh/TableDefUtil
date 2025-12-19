# テーブル定義変換ツール (Table Definition Conversion Tool)

TSV, CSV, または JSON 形式で記述されたテーブル定義から、各種プログラミング言語のモデルやDDL（データ定義言語）、SQLを自動生成するウェブツールです。
Vue.js を使用したモダンなシングルページアプリケーション (SPA) として実装されています。

## 主な機能

- **多様な入力サポート**:
  - TSV/CSV/JSON ファイルのアップロード
  - テキストエリアへの直接入力
  - サーバー上のファイル読み込み (オフラインモード時のフォールバック案内付き)
- **3つの処理モード**:
  1.  **定義プレビュー & 編集**:
      - 読み込んだテーブル定義を表形式で確認。
      - GUI上でのテーブル・カラムの追加・変更・削除。
      - 編集した定義の TSV/JSON エクスポート。
      - インデックス (`Idx1`~`Idx5`) や共通カラムの表示設定。
  2.  **アプリケーション雛形生成 (Scaffolding)**:
      - 以下の形式への一括変換・ダウンロード (ZIP)。
        - DDL (PostgreSQL, Play Framework Evolution)
        - TypeScript (型定義)
        - Zod (スキーマ, 型)
        - Java (EBean Model, Repository, Service, Controller)
      - Row Level Security (RLS) 対応コードの生成オプション。
  3.  **SQLコード生成 (SQL Builder)**:
      - GUIでテーブルとカラムを選択してSQL (`SELECT`, `JOIN`, `WHERE`, `ORDER BY`) を構築。
      - 構築したクエリに対応する Java (EBean) / TypeScript コードの生成。
      - `count(*)` メソッドの生成オプション。
- **設定管理**:
  - `config/config.json` によるデフォルト設定（テーマ、表示カラム、生成オプションなど）の管理。
  - 共通カラム（作成日時、更新日時、論理削除など）のカスタマイズ。

## 使用方法

### 1. 入力 (Input)
画面上部の「入力」セクションでデータをロードします。
- **サーバファイル**: `input/` フォルダ内の定義済みファイルから選択します。
- **ファイル入力**: ローカルの TSV, CSV, JSON ファイルをアップロードします。
- **テキストエリア入力**: テキストデータを直接貼り付けます。

### 2. モード選択
「処理オプション」から行いたい操作を選択します。
- **定義プレビュー**: テーブル定義の閲覧と編集を行います。
- **アプリケーション雛形**: 各種コードの一括生成を行います。
- **SQLコード生成**: クエリビルダ機能を使用します。

### 3. 実行
- **プレビューモード**: 画面左側の「編集モード」スイッチを入れることで、テーブルやカラムの変更が可能です。「TSV保存」「JSON保存」で変更を保存できます。
- **雛形生成モード**: 生成したいフォーマット（DDL, Java Modelなど）にチェックを入れ、「変換実行」をクリックします。「すべてダウンロード (ZIP)」で取得できます。
- **SQL生成モード**: テーブルを選択し、必要なカラムや条件を追加していくことで、リアルタイムにSQLと対応コードが生成されます。

## 入力フォーマット (TSV/CSV)

入力するTSV/CSVは、以下のヘッダーを持つ必要があります。1行で1つのカラムを定義します。

| ヘッダー          | 説明                                   | 例                  |
| ----------------- | -------------------------------------- | ------------------- |
| `TableName`       | テーブルの物理名                       | `users`             |
| `TableName_JP`    | テーブルの論理名                       | `ユーザー`          |
| `ColName`         | カラムの物理名                         | `id`                |
| `ColName_JP`      | カラムの論理名                         | `ID`                |
| `PK/FK`           | `PK` (主キー) or `AK` (代替キー)       | `PK`                |
| `Type`            | データ型 (PostgreSQL準拠)              | `bigserial`         |
| `Length`          | 型の長さ                               |                     |
| `Constraint`      | 制約 (`NN`: NOT NULL, `U`: UNIQUE)     | `NN`                |
| `Default`         | デフォルト値                           |                     |
| `Description`     | 説明                                   |                     |
| `Idx1`...`Idx5`   | インデックス (1~5のグループ番号を指定) | `1`                 |

※ JSON形式の場合は、この構造を持つオブジェクトの配列となります。

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

- `index.html`: アプリケーションのエントリポイント。
- `js/`: アプリケーションのJavaScriptソースコード。
  - `app.js`: メインロジック。
  - `components/`: UIコンポーネント。
  - `converters/`: 各言語への変換ロジック。
- `config/`: 設定ファイル (`config.json`, `config.js`)。
- `input/`: サーバー入力用のデータファイル。
- `css/`: スタイルシート。
- `tests/`: テストコード。
- `samples/`: サンプルデータ。

## 使用技術

- [Vue.js 3](https://vuejs.org/): UIフレームワーク。
- [Pico.css](https://picocss.com/): CSSフレームワーク。
- [Papa Parse](https://www.papaparse.com/): CSV/TSVパーサー。
- [JSZip](https://stuk.github.io/jszip/): ZIPファイル生成。
- [Bootstrap Icons](https://icons.getbootstrap.com/): アイコン。

## 注意事項

- 本ツールは静的HTML+JSのため、Webサーバー上で動作させることが推奨されます(`python -m http.server` 等)。
