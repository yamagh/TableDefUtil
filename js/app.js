// Main App Entry
const { createApp, ref, reactive, computed } = Vue;

const App = {
  components: {
    InputSection,
    ProcessingOptions,
    OptionsSection,
    ResultSection,
    SqlBuilder,
    TablePreviewSection,
    ConfigEditor
  },
  setup() {
    // モード: preview, scaffolding, sql
    const currentMode = ref('preview');

    // テーマ: light, dark, auto
    const initialTheme = localStorage.getItem('theme') || (AppState.config && AppState.config.theme) || 'auto';
    const theme = ref(initialTheme);

    // テーマを更新
    const updateTheme = (newTheme) => {
      theme.value = newTheme;
      localStorage.setItem('theme', newTheme);
      const html = document.documentElement;
      if (newTheme === 'auto') {
        html.removeAttribute('data-theme');
      } else {
        html.setAttribute('data-theme', newTheme);
      }
    };

    // テーマを初期化
    updateTheme(theme.value);

    // テーマを切り替える
    const toggleTheme = () => {
      const next = theme.value === 'light' ? 'dark' : 'light';
      updateTheme(next);
    };

    // フォントサイズ
    const initialFontSize = localStorage.getItem('fontSize') || (AppState.config && AppState.config.fontSize) || '100%';
    const fontSize = ref(initialFontSize);

    const updateFontSize = (newSize) => {
      fontSize.value = newSize;
      localStorage.setItem('fontSize', newSize);
      document.documentElement.style.fontSize = newSize;
    };

    // 初期化
    document.documentElement.style.fontSize = fontSize.value;

    // 変換結果
    const conversionResults = ref(null);
    // 変換形式
    const convertedFormats = ref([]);
    // RLS オプション
    const convertedRlsOptions = ref(null);
    // データが存在するかどうか
    const hasData = computed(() => AppState.parsedTables.length > 0);

    // データロードハンドラ
    const handleDataLoaded = (rawData) => {
      // すでにオブジェクトの場合はそのまま利用
      if (typeof rawData === 'object' && rawData !== null) {
        AppState.parsedTables = rawData;
        AppState.resetSqlState();
        conversionResults.value = null;
        convertedFormats.value = [];
        convertedRlsOptions.value = null;
        return;
      }

      // JSONとしてパースを試みる
      const trimmed = rawData.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const jsonData = JSON.parse(rawData);
          // 配列であり、かつ中身が期待する形式（空配列 または tableNameを持つオブジェクト）か簡易チェック
          if (Array.isArray(jsonData) && (jsonData.length === 0 || (jsonData[0] && jsonData[0].tableName))) {
            AppState.parsedTables = jsonData;
            AppState.resetSqlState();
            conversionResults.value = null;
            convertedFormats.value = [];
            convertedRlsOptions.value = null;
            // alert('JSONファイルを読み込みました。');
            return;
          }
        } catch (e) {
          console.warn('JSON parsing failed, falling back to CSV/TSV', e);
        }
      }

      Papa.parse(rawData, {
        header: true,
        skipEmptyLines: true,
        delimiter: '\t',
        complete: (results) => {
          if (results.errors.length > 0) {
            console.error(results.errors);
            alert('パースエラー: ' + JSON.stringify(results.errors));
            return;
          }
          const tables = transformToIntermediate(results.data);
          AppState.parsedTables = tables;

          // SQL Builderの状態をリセット
          AppState.resetSqlState();

          // 変換結果をクリア
          conversionResults.value = null;
          convertedFormats.value = [];
          convertedRlsOptions.value = null;
        }
      });
    };

    // 変換ハンドラ
    const handleConvert = ({ formats, rls }) => {
      if (AppState.parsedTables.length === 0) {
        alert('データを入力してください。');
        return;
      }

      const results = {};
      formats.forEach(format => {
        switch (format) {
          case 'ddl': results[format] = generateDDL(AppState.parsedTables); break;
          case 'ddl-play': results[format] = generatePlayEvolution(AppState.parsedTables); break;
          case 'typescript': results[format] = generateTypeScript(AppState.parsedTables); break;
          case 'zod-schema': results[format] = generateZodSchema(AppState.parsedTables); break;
          case 'zod-type': results[format] = generateZodType(AppState.parsedTables); break;
          case 'java-model': results[format] = generateJavaModel(AppState.parsedTables, rls); break;
          case 'java-repo': results[format] = generateJavaRepo(AppState.parsedTables, rls); break;
          case 'java-service': results[format] = generateJavaService(AppState.parsedTables, rls); break;
          case 'java-controller': results[format] = generateJavaController(AppState.parsedTables, rls); break;
        }
      });

      conversionResults.value = results;
      convertedFormats.value = formats;
      convertedRlsOptions.value = rls;
    };

    // 全てのファイルをダウンロードするハンドラ
    const handleDownloadAll = () => {
      if (!convertedFormats.value || convertedFormats.value.length === 0) {
        alert("先に「変換実行」を押してください。");
        return;
      }

      Zipper.generateZip(AppState.parsedTables, convertedFormats.value, convertedRlsOptions.value).then(content => {
        const now = (d => { d.setHours(d.getHours() + 9); return d.toISOString().slice(0, 19).replace('T', '-').replace(/:/g, '') })(new Date())
        downloadFile(content, `table-definitions-${now}.zip`);
      });
    };

    // デフォルトデータの読み込み
    Vue.onMounted(async () => {
      if (AppState.parsedTables.length === 0) {
        // window.DefaultDataがあればそれを使う (files.js で定義されることを想定、あるいは default.js)
        if (window.DefaultData) {
          console.log('Loading default data from window.DefaultData...');
          handleDataLoaded(window.DefaultData);
          return;
        }

        console.log('Loading default data from input/default.json...');
        try {
          const response = await fetch('input/default.json');
          if (response.ok) {
            const jsonText = await response.text();
            handleDataLoaded(jsonText);
          } else {
            console.warn('Failed to load input/default.json');
          }
        } catch (e) {
          console.warn('Error fetching input/default.json', e);
        }
      }
    });

    return {
      currentMode,
      theme,
      toggleTheme,
      handleDataLoaded,
      handleConvert,
      handleDownloadAll,
      conversionResults,
      convertedFormats,
      hasData,
      fontSize,
      updateFontSize
    };
  },
  template: `
    <div>
      <header class="container-fluid" style="padding-top: 3rem; padding-bottom: 6rem; display: flex; justify-content: space-between; align-items: center;">
        <h1>テーブル定義変換ツール</h1>
        <div style="display: flex; gap: 1rem; align-items: center;">

          <select v-model="fontSize" @change="updateFontSize($event.target.value)" style="margin-bottom: 0; padding: 0.25rem; font-size: 0.8rem; width: auto; border-color: var(--pico-muted-border-color);">
            <option value="80%">極小 (80%)</option>
            <option value="90%">小 (90%)</option>
            <option value="100%">標準 (100%)</option>
            <option value="110%">大 (110%)</option>
            <option value="125%">特大 (125%)</option>
          </select>
          <button style="border: none;" class="outline secondary" @click="toggleTheme">
            <i v-if="theme === 'light'" class="bi bi-moon-fill"></i>
            <i v-else class="bi bi-sun-fill"></i>
          </button>
        </div>
      </header>
      <main class="container-fluid">
        <div v-if="hasData">
          <ProcessingOptions @update:mode="currentMode = $event" />
        </div>
        <div v-show="!hasData || currentMode === 'input'">
          <InputSection @data-loaded="handleDataLoaded" />
        </div>
          
        <div v-show="hasData && currentMode === 'scaffolding'">
          <OptionsSection @convert="handleConvert" />
          <ResultSection :results="conversionResults" :formats="convertedFormats" @download-all="handleDownloadAll"/>
        </div>

        <div v-show="hasData && currentMode === 'sql'">
          <SqlBuilder />
        </div>

        <div v-show="hasData && currentMode === 'preview'">
          <TablePreviewSection />
        </div>

        <div v-show="hasData && currentMode === 'config'">
          <ConfigEditor />
        </div>
      </main>
    </div>
  `
};
// 設定をロードする
const loadConfig = async () => {
  // window.AppConfig があればそれを使う
  if (typeof window.AppConfig === 'object') {
    console.log('Using window.AppConfig');
    AppState.config = window.AppConfig;
    if (AppState.config.sql && AppState.config.sql.includeCountMethod !== undefined) {
      AppState.sql.includeCountMethod = AppState.config.sql.includeCountMethod;
    }
    return;
  }

  console.warn('window.AppConfig is not defined. Using default settings.');
};

// アプリケーションの起動
loadConfig().then(() => {
  createApp(App).mount('#app');
});
