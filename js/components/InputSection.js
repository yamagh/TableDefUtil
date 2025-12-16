const InputSection = {
  template: `
    <article>
      <header>入力</header>
      <section>
        <div role="group">
          <a role="button" href="#"
             @click.prevent="activeTab = 'server'"
             :class="{ 'outline': activeTab !== 'server' }"
             class="btn-sm"><i class="bi bi-hdd-network"></i> ローカルファイル</a>
          <a role="button" href="#" 
             @click.prevent="activeTab = 'file'" 
             :class="{ 'outline': activeTab !== 'file' }"
             class="btn-sm"><i class="bi bi-file-earmark-arrow-up"></i> ファイル入力</a>
          <a role="button" href="#" 
             @click.prevent="activeTab = 'text'" 
             :class="{ 'outline': activeTab !== 'text' }"
             class="btn-sm"><i class="bi bi-pencil-square"></i> テキストエリア入力</a>
        </div>

        <div v-show="activeTab === 'file'" class="tab-content" style="display: block;">
          <input type="file" ref="fileInput" @change="handleFileChange">
          <small>TSV、CSV、またはJSONファイルを選択してください。</small>
        </div>
        <div v-show="activeTab === 'text'" class="tab-content" style="display: block;">
          <textarea v-model="textInput" placeholder="ここにTSV、CSV、またはJSONデータを貼り付けます"></textarea>
          <button @click="handleTextSubmit" style="margin-top: 1rem;"><i class="bi bi-upload"></i> 読み込み</button>
        </div>
        <div v-show="activeTab === 'server'" class="tab-content" style="display: block;">
          <div v-if="serverFiles.length > 0">
            <details style="margin-bottom: 1rem;">
              <summary style="font-size: 0.9em; cursor: pointer;"><i class="bi bi-info-circle"></i> 使い方</summary>
              <p style="font-size: 0.9em; color: var(--muted-color, #666); margin-top: 0.5rem;">
                <code>./input</code> フォルダ内のファイルを選択して読み込みます。<br>
                新しいファイルを追加するには、<code>input</code> フォルダにファイルを配置し、<code>input/files.json</code> にファイル名を記述してください。
              </p>
            </details>
            <label>
              ファイルを選択:
              <select v-model="selectedServerFile">
                <option v-for="file in serverFiles" :key="file" :value="file">{{ file }}</option>
              </select>
            </label>
            <button @click="handleServerFileLoad" style="margin-top: 1rem;"><i class="bi bi-download"></i> 読み込み</button>
          </div>
          <div v-else>
            <p>サーバー上のファイルが見つかりません (input/files.json が存在しません)。</p>
          </div>
        </div>
      </section>
    </article>
  `,
  setup(props, { emit }) {
    const activeTab = Vue.ref('server');
    const textInput = Vue.ref('');
    const fileInput = Vue.ref(null);

    // サーバー上のファイル一覧
    const serverFiles = Vue.ref([]);
    const selectedServerFile = Vue.ref('');

    // マウント時にファイル一覧を取得
    Vue.onMounted(async () => {
      try {
        const response = await fetch('input/files.json');
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.files)) {
            serverFiles.value = data.files;
            if (serverFiles.value.length > 0) {
              selectedServerFile.value = serverFiles.value[0];
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch input/files.json', e);
      }
    });

    // サーバーファイル読み込みハンドラ
    const handleServerFileLoad = async () => {
      if (!selectedServerFile.value) {
        alert('ファイルを選択してください。');
        return;
      }
      try {
        const response = await fetch(`input/${selectedServerFile.value}`);
        if (!response.ok) {
          throw new Error('Failed to fetch file');
        }
        const text = await response.text();
        emit('data-loaded', text);
      } catch (e) {
        console.error(e);
        alert('ファイルの読み込みに失敗しました。');
      }
    };

    // ファイル選択時
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        emit('data-loaded', e.target.result);
      };
      reader.readAsText(file);
    };

    // テキストエリア入力時
    const handleTextSubmit = () => {
      if (!textInput.value.trim()) {
        alert('入力データがありません。');
        return;
      }
      emit('data-loaded', textInput.value);
    };

    return {
      activeTab,
      textInput,
      fileInput,
      serverFiles,
      selectedServerFile,
      handleServerFileLoad,
      handleFileChange,
      handleTextSubmit
    };
  }
};
