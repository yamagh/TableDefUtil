const ResultSection = {
  props: ['results', 'formats'],
  template: `
    <article v-if="results && formats.length > 0">
      <header>変換結果</header>
      <section>
        <nav role="tab-control" class="tabs" style="overflow-x: scroll; white-space: nowrap;">
          <ul>
            <li v-for="format in formats" :key="format">
              <a href="#" 
                 @click.prevent="activeTab = format"
                 :class="{ 'active': activeTab === format }">
                 {{ format.toUpperCase() }}
              </a>
            </li>
          </ul>
        </nav>
        <div class="result-contents">
          <div v-for="format in formats" :key="format" v-show="activeTab === format">
            <textarea readonly style="height: 500px;">{{ getResultContent(format) }}</textarea>
          </div>
        </div>
      </section>
      <footer v-if="activeTab">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
           <button class="secondary" @click="downloadCurrent">
             <i class="bi bi-download"></i> {{ activeTab.toUpperCase() }} をダウンロード
           </button>
           <button class="primary" @click="downloadAll">
             <i class="bi bi-file-zip"></i> すべてダウンロード (ZIP)
           </button>
        </div>
      </footer>
    </article>
  `,
  setup(props, { emit }) {
    // 選択されたタブ
    const activeTab = Vue.ref(props.formats[0] || '');

    // フォーマットが変更された場合、タブを更新する
    Vue.watch(() => props.formats, (newFormats) => {
      if (newFormats.length > 0 && !newFormats.includes(activeTab.value)) {
        activeTab.value = newFormats[0];
      }
    });

    // 結果取得
    const getResultContent = (format) => {
      if (!props.results || !props.results[format]) return '';
      const output = props.results[format];
      if (typeof output === 'string') return output;
      if (Array.isArray(output)) {
        return output.map(f => `// --- FileName: ${f.path} ---\n${f.content}\n`).join('\n');
      }
      return '';
    };

    // 現在の結果をダウンロード
    const downloadCurrent = () => {
      const content = getResultContent(activeTab.value);
      App.Utils.Common.downloadFile(content, 'output.txt'); // Helper from common.js
    };

    // すべての結果をダウンロード
    const downloadAll = () => {
      emit('download-all');
    };

    return {
      activeTab,
      getResultContent,
      downloadCurrent,
      downloadAll
    };
  }
};
