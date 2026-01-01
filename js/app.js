// Main App Entry
const { createApp, ref, reactive, computed } = Vue;

const RootComponent = {
  components: {
    InputSection,
    OptionsSection,
    ResultSection,
    SqlBuilder,
    TablePreviewSection,
    ConfigEditor,
    Navigation,
  },
  setup() {
    // モード: preview, scaffolding, sql
    const currentMode = ref('preview');

    // テーマ: light, dark, auto
    const initialTheme = localStorage.getItem('theme') || (App.State.config && App.State.config.theme) || 'auto';
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
    const initialFontSize = localStorage.getItem('fontSize') || (App.State.config && App.State.config.fontSize) || '100%';
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
    const hasData = computed(() => App.State.parsedTables.length > 0);

    // データロードハンドラ
    const handleDataLoaded = (rawData) => {
      // すでにオブジェクトの場合はそのまま利用
      if (typeof rawData === 'object' && rawData !== null) {
        App.State.parsedTables = rawData;
        App.State.resetSqlState();
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
            App.State.parsedTables = jsonData;
            App.State.resetSqlState();
            conversionResults.value = null;
            convertedFormats.value = [];
            convertedRlsOptions.value = null;
            // alert('JSONファイルを読み込みました。');
            Toast.success('JSONデータを読み込みました');
            currentMode.value = 'preview';
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
            Toast.error('パースエラー: ' + JSON.stringify(results.errors));
            return;
          }
          const tables = App.Core.Parser.transformToIntermediate(results.data);
          App.State.parsedTables = tables;

          // SQL Builderの状態をリセット
          App.State.resetSqlState();

          // 変換結果をクリア
          conversionResults.value = null;
          convertedFormats.value = [];
          convertedRlsOptions.value = null;

          Toast.success('データを読み込みました');
          currentMode.value = 'preview';
        }
      });
    };

    // 変換ハンドラ
    const handleConvert = ({ formats, rls }) => {
      if (App.State.parsedTables.length === 0) {
        Toast.warning('データを入力してください。');
        return;
      }

      const results = {};
      formats.forEach(format => {
        switch (format) {
          case 'ddl': results[format] = App.Converters.Ddl.generateDDL(App.State.parsedTables); break;
          case 'ddl-play': results[format] = App.Converters.Ddl.generatePlayEvolution(App.State.parsedTables); break;
          case 'typescript': results[format] = App.Converters.Typescript.generateTypeScript(App.State.parsedTables); break;
          case 'zod-schema': results[format] = App.Converters.Zod.generateZodSchema(App.State.parsedTables); break;
          case 'zod-type': results[format] = App.Converters.Zod.generateZodType(App.State.parsedTables); break;
          case 'java-model': results[format] = App.Converters.JavaModel.generateJavaModel(App.State.parsedTables, rls); break;
          case 'java-repo': results[format] = App.Converters.JavaRepo.generateJavaRepo(App.State.parsedTables, rls); break;
          case 'java-service': results[format] = App.Converters.JavaService.generateJavaService(App.State.parsedTables, rls); break;
          case 'java-controller': results[format] = App.Converters.JavaController.generateJavaController(App.State.parsedTables, rls); break;
          case 'vscode-snippets': results[format] = App.Converters.VscodeSnippets.generateVscodeSnippets(App.State.parsedTables); break;
        }
      });

      conversionResults.value = results;
      convertedFormats.value = formats;
      convertedRlsOptions.value = rls;
      Toast.success('変換が完了しました');
    };

    // 全てのファイルをダウンロードするハンドラ
    const handleDownloadAll = () => {
      if (!convertedFormats.value || convertedFormats.value.length === 0) {
        Toast.warning("先に「変換実行」を押してください。");
        return;
      }

      App.Core.Zipper.generateZip(App.State.parsedTables, convertedFormats.value, convertedRlsOptions.value).then(content => {
        const now = (d => { d.setHours(d.getHours() + 9); return d.toISOString().slice(0, 19).replace('T', '-').replace(/:/g, '') })(new Date())
        downloadFile(content, `table-definitions-${now}.zip`);
      });
    };

    // デフォルトデータの読み込み
    Vue.onMounted(async () => {
      if (App.State.parsedTables.length === 0) {
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
      <Navigation 
        :current-mode="currentMode" 
        :has-data="hasData" 
        :theme="theme" 
        :font-size="fontSize"
        @update:mode="currentMode = $event"
        @toggle-theme="toggleTheme"
        @update:font-size="updateFontSize"
      />
      
      <main class="container-fluid">
        <!-- Default to Input mode if hasData is false, or if explicit input mode -->
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
  if (typeof App.State === 'object') {
    console.log('Using window.AppConfig');
    window.AppConfig = App.State.config;
    if (App.State.config.sql && App.State.config.sql.includeCountMethod !== undefined) {
      App.State.sql.includeCountMethod = App.State.config.sql.includeCountMethod;
    }
    return;
  }

  console.warn('window.AppConfig is not defined. Using default settings.');
};

// アプリケーションの起動
loadConfig().then(() => {
  createApp(RootComponent).mount('#app');
});
