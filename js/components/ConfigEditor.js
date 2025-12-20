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

    // CommonColumns用のJSON編集用
    const commonColumnsJson = Vue.ref('');
    const commonColumnsError = Vue.ref(null);

    // 初期化時に CommonColumns を JSON 文字列にする
    Vue.watchEffect(() => {
      if (AppState.config && AppState.config.commonColumns) {
        // 編集中でなければ同期
        if (document.activeElement && document.activeElement.id === 'common-columns-editor') return;
        commonColumnsJson.value = JSON.stringify(AppState.config.commonColumns, null, 2);
      }
    });

    // CommonColumns JSONの変更を監視してパース
    const updateCommonColumns = (event) => {
      commonColumnsJson.value = event.target.value;
      try {
        const parsed = JSON.parse(commonColumnsJson.value);
        AppState.config.commonColumns = parsed;
        commonColumnsError.value = null;
      } catch (e) {
        commonColumnsError.value = 'JSONの形式が正しくありません: ' + e.message;
      }
    };

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
      commonColumnsJson,
      commonColumnsError,
      updateCommonColumns,
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
        <!-- 左カラム: 一般設定 -->
        <div>
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

        <!-- 右カラム: 出力設定 -->
        <div>
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

      <!-- 下段: 共通カラム設定 (JSON) -->
      <article>
        <header><strong>共通カラム設定 (Common Columns)</strong></header>
        <p><small>論理削除フラグなどの共通カラム定義をJSON形式で編集します。</small></p>
        <textarea 
          id="common-columns-editor"
          :value="commonColumnsJson"
          @input="updateCommonColumns"
          rows="10" 
          style="font-family: monospace; font-size: 0.9rem;"
          :aria-invalid="commonColumnsError ? 'true' : null"
        ></textarea>
        <small v-if="commonColumnsError" style="color: var(--pico-form-element-invalid-border-color);">
          {{ commonColumnsError }}
        </small>
      </article>

    </section>
  `
};
