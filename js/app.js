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
    // App Mode
    const currentMode = ref('scaffolding');

    // Current Results
    const conversionResults = ref(null);
    const convertedFormats = ref([]); // To track which formats were requested

    const convertedRlsOptions = ref(null);

    // Handlers
    const handleDataLoaded = (tsvData) => {
      // Use existing Papa Parse logic
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

          // Reset SQL Builder state
          AppState.resetSqlState();

          // Clear previous results
          conversionResults.value = null;
          convertedFormats.value = [];
          convertedRlsOptions.value = null;

          // alert('テーブル定義を読み込みました。変換実行やSQL作成が可能です。');
        }
      });
    };

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
      handleDataLoaded,
      handleConvert,
      handleDownloadAll,
      conversionResults,
      convertedFormats
    };
  },
  template: `
    <div>
      <header class="container-fluid">
        <h1>テーブル定義変換ツール</h1>
      </header>
      <main class="container-fluid">
        <InputSection @data-loaded="handleDataLoaded" />
        
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
      </main>
    </div>
  `
};

createApp(App).mount('#app');
