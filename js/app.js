// Main App Entry
const { createApp, ref, reactive, computed } = Vue;

const App = {
  components: {
    InputSection,
    ProcessingOptions,
    OptionsSection,
    ResultSection,
    SqlBuilder,
    TablePreviewSection
  },
  setup() {
    // モード: preview, scaffolding, sql
    const currentMode = ref('preview');

    // テーマ: light, dark, auto
    const theme = ref(localStorage.getItem('theme') || 'auto');

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

    // 変換結果
    const conversionResults = ref(null);
    // 変換形式
    const convertedFormats = ref([]);
    // RLS オプション
    const convertedRlsOptions = ref(null);
    // データが存在するかどうか
    const hasData = computed(() => AppState.parsedTables.length > 0);

    // データロードハンドラ
    const handleDataLoaded = (tsvData) => {
      Papa.parse(tsvData, {
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

          // alert('テーブル定義を読み込みました。変換実行やSQL作成が可能です。');
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

    return {
      currentMode,
      theme,
      toggleTheme,
      handleDataLoaded,
      handleConvert,
      handleDownloadAll,
      conversionResults,
      convertedFormats,
      hasData
    };
  },
  template: `
    <div>
      <header class="container-fluid" style="padding-top: 3rem; padding-bottom: 6rem; display: flex; justify-content: space-between; align-items: center;">
        <h1>テーブル定義変換ツール</h1>
        <button style="border: none;" class="outline secondary" @click="toggleTheme">
          {{ theme === 'light' ? '🌙' : '☀️' }}
        </button>
      </header>
      <main class="container-fluid">
        <InputSection @data-loaded="handleDataLoaded" />
        
        <div v-if="hasData">
          <ProcessingOptions @update:mode="currentMode = $event" />
          
          <div v-show="currentMode === 'scaffolding'">
            <OptionsSection @convert="handleConvert" />
            <ResultSection :results="conversionResults" :formats="convertedFormats" @download-all="handleDownloadAll"/>
          </div>

          <div v-show="currentMode === 'sql'">
            <SqlBuilder />
          </div>

          <div v-show="currentMode === 'preview'">
            <TablePreviewSection />
          </div>
        </div>
      </main>
    </div>
  `
};

createApp(App).mount('#app');
