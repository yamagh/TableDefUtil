const ConfigEditor = {
  setup() {
    // プレビューで表示可能な全カラムリスト
    const availablePreviewColumns = [
      { id: 'tableName', label: 'テーブル物理名 (TableName)' },
      { id: 'tableNameJP', label: 'テーブル論理名 (TableName_JP)' },
      { id: 'colName', label: 'カラム物理名 (ColName)' },
      { id: 'colNameJP', label: 'カラム論理名 (ColName_JP)' },
      { id: 'pkfk', label: 'PK/FK' },
      { id: 'type', label: '型 (Type)' },
      { id: 'length', label: '長さ (Length)' },
      { id: 'constraint', label: '制約 (Constraint)' },
      { id: 'default', label: 'デフォルト値 (Default)' },
      { id: 'description', label: '説明 (Description)' },
      { id: 'idx1', label: 'Idx1' },
      { id: 'idx2', label: 'Idx2' },
      { id: 'idx3', label: 'Idx3' },
      { id: 'idx4', label: 'Idx4' },
      { id: 'idx5', label: 'Idx5' }
    ];

    // エクスポート可能な全フォーマット
    const availableExportFormats = [
      { id: 'ddl', label: 'DDL (SQL)' },
      { id: 'ddl-play', label: 'DDL (Play Framework Evolution)' },
      { id: 'typescript', label: 'TypeScript (Type Definition)' },
      { id: 'zod-schema', label: 'Zod Schema' },
      { id: 'zod-type', label: 'Zod Type' },
      { id: 'java-model', label: 'Java (EBean Model)' },
      { id: 'java-repo', label: 'Java (EBean Repository)' },
      { id: 'java-service', label: 'Java (Service)' },
      { id: 'java-controller', label: 'Java (Controller)' }
    ];

    // --- Global Settings (テーマ & フォントサイズ) ---
    const globalSettings = Vue.reactive({
      theme: AppState.config.theme || 'auto',
      fontSize: AppState.config.fontSize || '100%'
    });

    // 設定変更をAppStateに反映
    Vue.watch(() => globalSettings.theme, (val) => {
      AppState.config.theme = val;
    });
    Vue.watch(() => globalSettings.fontSize, (val) => {
      AppState.config.fontSize = val;
    });


    // --- Common Columns Config (GUI Logic) ---
    const commonCols = Vue.computed(() => {
        if (!AppState.config.commonColumns) {
            AppState.config.commonColumns = {
                id: 'id',
                created_at: 'created_at', created_by: 'created_by',
                updated_at: 'updated_at', updated_by: 'updated_by',
                is_deleted: { name: 'is_deleted', type: 'boolean', valTrue: true, valFalse: false }
            };
        }
        return AppState.config.commonColumns;
    });

    // 設定コードの生成
    const generateConfigCode = () => {
      if (!AppState.config) return '';
      // デープコピーして整形（必要なら）
      const configObj = JSON.parse(JSON.stringify(AppState.config));
      return `window.AppConfig = ${JSON.stringify(configObj, null, 2)};`;
    };

    const copyToClipboard = async () => {
      try {
        const code = generateConfigCode();
        await navigator.clipboard.writeText(code);
        Toast.success('設定コードをクリップボードにコピーしました');
      } catch (err) {
        console.error('Failed to copy: ', err);
        Toast.error('コピーに失敗しました');
      }
    };

    return {
      AppState,
      availablePreviewColumns,
      availableExportFormats,
      globalSettings,
      commonCols,
      copyToClipboard,
      generateConfigCode
    };
  },
  template: `
    <section>
      <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h2><i class="bi bi-gear"></i> 設定エディタ</h2>
          <p>
            下のフォームで設定を変更すると、即座にアプリケーションに反映されます。<br>
            変更を永続化するには、「設定をコピー」して <code>config/config.js</code> を更新してください。
          </p>
        </div>
        <button @click="copyToClipboard">
          <i class="bi bi-clipboard"></i> 設定をコピー (config.js用)
        </button>
      </header>
      
      <div v-if="!AppState.config" aria-busy="true">Loading config...</div>
      
      <div v-else class="grid">
        <!-- 左カラム -->
        <div>
          <!-- 一般設定 -->
          <article>
            <header><strong>一般設定</strong></header>
            <label>
              テーマ (初期値)
              <select v-model="globalSettings.theme">
                <option value="auto">自動 (システム設定)</option>
                <option value="light">ライト</option>
                <option value="dark">ダーク</option>
              </select>
            </label>
            <label>
              フォントサイズ (初期値)
              <select v-model="globalSettings.fontSize">
                <option value="80%">80%</option>
                <option value="90%">90%</option>
                <option value="100%">100%</option>
                <option value="110%">110%</option>
                <option value="125%">125%</option>
              </select>
            </label>
          </article>

          <!-- 表示設定 -->
          <article>
            <header><strong>定義プレビュー初期表示列</strong></header>
            <div style="max-height: 300px; overflow-y: auto;">
              <label v-for="col in availablePreviewColumns" :key="col.id" style="display: block; margin-bottom: 0.5rem;">
                <input type="checkbox" :value="col.id" v-model="AppState.config.preview.defaultVisibleColumns">
                {{ col.label }}
              </label>
            </div>
          </article>

          <!-- SQL設定 -->
          <article>
            <header><strong>SQL生成設定</strong></header>
            <label>
              <input type="checkbox" v-model="AppState.config.sql.includeCountMethod">
              Countメソッド (count(*)) を生成する
            </label>
          </article>
        </div>

        <!-- 右カラム -->
        <div>
          <!-- 共通カラム設定 -->
          <article>
            <header><strong>共通カラム設定 (Common Columns)</strong></header>
            <p><small>全テーブル共通で付与されるカラム（BaseModel等）の定義です。</small></p>
            
            <details>
                <summary>基本カラム名</summary>
                <div class="grid">
                  <label>
                    ID (PK)
                    <input type="text" v-model="commonCols.id">
                  </label>
                  <label>
                    作成日時
                    <input type="text" v-model="commonCols.created_at">
                  </label>
                  <label>
                    作成者
                    <input type="text" v-model="commonCols.created_by">
                  </label>
                </div>
                <div class="grid">
                  <label>
                    更新日時
                    <input type="text" v-model="commonCols.updated_at">
                  </label>
                  <label>
                    更新者
                    <input type="text" v-model="commonCols.updated_by">
                  </label>
                </div>
            </details>

            <details>
                <summary>論理削除 (Logical Delete)</summary>
                <div class="grid">
                  <label>
                    カラム名
                    <input type="text" v-model="commonCols.is_deleted.name">
                  </label>
                  <label>
                    型
                    <select v-model="commonCols.is_deleted.type">
                      <option value="boolean">Boolean</option>
                      <option value="string">String</option>
                    </select>
                  </label>
                </div>
                
                <div v-if="commonCols.is_deleted.type === 'string'" class="grid">
                   <label>
                     削除済の値 (Trueとして扱う値)
                     <input type="text" v-model="commonCols.is_deleted.valTrue">
                   </label>
                   <label>
                     有効な値 (Falseとして扱う値)
                     <input type="text" v-model="commonCols.is_deleted.valFalse">
                   </label>
                </div>
                 <p v-if="commonCols.is_deleted.type === 'string'"><small>※ String型の場合、指定された文字以外の値は考慮されません。</small></p>
            </details>
          </article>

          <!-- アプリケーション雛形 -->
          <article>
            <header><strong>雛形生成 デフォルトフォーマット</strong></header>
            <div style="max-height: 300px; overflow-y: auto;">
              <label v-for="fmt in availableExportFormats" :key="fmt.id" style="display: block; margin-bottom: 0.5rem;">
                <input type="checkbox" :value="fmt.id" v-model="AppState.config.export.defaultFormats">
                {{ fmt.label }}
              </label>
            </div>
          </article>

          <!-- RLS設定 -->
          <article>
            <header>
              <label style="margin-bottom: 0;">
                <input type="checkbox" v-model="AppState.config.export.rls.enabled">
                <strong>Row Level Security (RLS)</strong>
              </label>
            </header>
            <div v-if="AppState.config.export.rls.enabled">
              <label>
                テナントIDカラム名
                <input type="text" v-model="AppState.config.export.rls.tenantIdColumn">
              </label>
              <label>
                管理者フラグカラム名
                <input type="text" v-model="AppState.config.export.rls.adminFlagColumn">
              </label>
            </div>
          </article>
        </div>
      </div>

    </section>
  `
};
