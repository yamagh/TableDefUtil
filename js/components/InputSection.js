const InputSection = {
  template: `
    <article>
      <header>入力</header>
      <section>
        <div role="group">
          <a role="button" href="#"
             @click.prevent="activeTab = 'server'"
             :class="{ 'outline': activeTab !== 'server' }"
             class="btn-sm"><i class="bi bi-hdd-network"></i> サーバファイル</a>
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
          <!-- オフライン時の警告とサーバー起動方法 -->
          <div v-if="isOffline" style="margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--pico-del-color); border-radius: 0.5rem; background-color: rgba(255, 0, 0, 0.05);">
            <p>
              <strong><i class="bi bi-exclamation-triangle"></i> オフラインモード</strong><br>
              現在、ローカルファイルとして開かれています。サーバー上のファイルリスト取得などは動作しません。<br>
              正常に利用するには、Webサーバー経由でアクセスしてください。
            </p>
            <details>
              <summary>サーバーの起動方法 (Windows 推奨)</summary>
              <div style="font-size: 0.9em;">
                <p>プロジェクトのルートディレクトリで、以下のいずれかのコマンドを実行してください。</p>
                
                <article style="padding: 0.5rem; margin-bottom: 0.5rem;">
                  <header style="padding: 0.25rem; font-size: 0.8em; margin-bottom: 0;"><strong>Python 3</strong> (推奨)</header>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <code style="flex-grow: 1; word-break: break-all;">python -m http.server 8000</code>
                    <button class="outline" style="padding: 0.25rem 0.5rem; font-size: 0.8em; width: auto;" @click="copyToClipboard('python -m http.server 8000')"><i class="bi bi-clipboard"></i></button>
                  </div>
                </article>

                <article style="padding: 0.5rem; margin-bottom: 0.5rem;">
                  <header style="padding: 0.25rem; font-size: 0.8em; margin-bottom: 0;"><strong>IIS Express</strong> (Command Prompt)</header>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <code style="flex-grow: 1; word-break: break-all;">"C:\\Program Files\\IIS Express\\iisexpress.exe" /path:"%cd%" /port:8000</code>
                    <button class="outline" style="padding: 0.25rem 0.5rem; font-size: 0.8em; width: auto;" @click="copyToClipboard('&quot;C:\\Program Files\\IIS Express\\iisexpress.exe&quot; /path:&quot;%cd%&quot; /port:8000')"><i class="bi bi-clipboard"></i></button>
                  </div>
                </article>

                <article style="padding: 0.5rem; margin-bottom: 0;">
                  <header style="padding: 0.25rem; font-size: 0.8em; margin-bottom: 0;"><strong>IIS Express</strong> (PowerShell)</header>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <code style="flex-grow: 1; word-break: break-all;">& "C:\\Program Files\\IIS Express\\iisexpress.exe" /path:(Get-Location).Path /port:8000</code>
                    <button class="outline" style="padding: 0.25rem 0.5rem; font-size: 0.8em; width: auto;" @click="copyToClipboard('& &quot;C:\\Program Files\\IIS Express\\iisexpress.exe&quot; /path:(Get-Location).Path /port:8000')"><i class="bi bi-clipboard"></i></button>
                  </div>
                </article>
              </div>
            </details>
          </div>

          <div v-if="serverFiles.length > 0">
            <details style="margin-bottom: 1rem;">
              <summary style="font-size: 0.9em; cursor: pointer;"><i class="bi bi-info-circle"></i> 使い方</summary>
              <p style="font-size: 0.9em; color: var(--muted-color, #666); margin-top: 0.5rem;">
                <code>./input</code> フォルダ内のファイルを選択して読み込みます。<br>
                新しいファイルを追加するには、<code>input</code> フォルダにファイルを配置し、<code>input/files.json</code> (または <code>files.js</code>) にファイル名を記述してください。
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
    const isOffline = window.location.protocol === 'file:';

    const copyToClipboard = (text) => {
      // フォールバック用の関数
      const fallbackCopy = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            Toast.success('クリップボードにコピーしました');
          } else {
            Toast.error('コピーに失敗しました');
          }
        } catch (err) {
          console.error('Fallback: Oops, unable to copy', err);
          Toast.error('コピーに失敗しました');
        }
        document.body.removeChild(textArea);
      };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
          Toast.success('クリップボードにコピーしました');
        }).catch(err => {
          console.error('Async: Could not copy text: ', err);
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    };

    // サーバー上のファイル一覧
    const serverFiles = Vue.ref([]);
    const selectedServerFile = Vue.ref('');

    // マウント時にファイル一覧を取得
    Vue.onMounted(async () => {
      // window.InputFiles があればそれを使う
      if (window.InputFiles && Array.isArray(window.InputFiles.files)) {
        serverFiles.value = window.InputFiles.files;
        if (serverFiles.value.length > 0) {
          selectedServerFile.value = serverFiles.value[0];
        }
        return;
      }

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
        Toast.warning('ファイルを選択してください。');
        return;
      }

      // window.DefaultData の利用 (default.js or default.json)
      if ((selectedServerFile.value === 'default.js' || selectedServerFile.value === 'default.json') && window.DefaultData) {
        emit('data-loaded', window.DefaultData);
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
        Toast.error('ファイルの読み込みに失敗しました。');
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
      
      reader.onerror = (e) => {
        console.error('File read error:', e);
        Toast.error('ファイルの読み込みに失敗しました。');
      };

      try {
        reader.readAsText(file);
      } catch (e) {
        console.error('File read synch error:', e);
        Toast.error('ファイルの読み込みに失敗しました。');
      }
    };

    // テキストエリア入力時
    const handleTextSubmit = () => {
      if (!textInput.value.trim()) {
        Toast.warning('入力データがありません。');
        return;
      }
      emit('data-loaded', textInput.value);
    };

    return {
      activeTab,
      isOffline,
      copyToClipboard,
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
