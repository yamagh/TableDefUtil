const InputSection = {
  template: `
    <article>
      <header>1. 入力</header>
      <section>
        <div role="group">
          <a role="button" href="#" 
             @click.prevent="activeTab = 'file'" 
             :class="{ 'outline': activeTab !== 'file' }"
             class="btn-sm">ファイル入力</a>
          <a role="button" href="#" 
             @click.prevent="activeTab = 'text'" 
             :class="{ 'outline': activeTab !== 'text' }"
             class="btn-sm">テキストエリア入力</a>
        </div>

        <div v-show="activeTab === 'file'" class="tab-content" style="display: block;">
          <input type="file" ref="fileInput" @change="handleFileChange">
          <small>TSVまたはCSVファイルを選択してください。</small>
        </div>
        <div v-show="activeTab === 'text'" class="tab-content" style="display: block;">
          <textarea v-model="textInput" placeholder="ここにTSVまたはCSVデータを貼り付けます"></textarea>
          <button @click="handleTextSubmit" style="margin-top: 1rem;">読み込み</button>
        </div>
      </section>
    </article>
  `,
  setup(props, { emit }) {
    const activeTab = Vue.ref('file');
    const textInput = Vue.ref('');
    const fileInput = Vue.ref(null);

    const parseData = (content) => {
      // Access global function for now, or move logic here later
      // Assuming runConversion/parse logic is global or imported
      // We'll emit an event or call a global handler.
      // For now, let's call the global logic exposed in main.js (which we will refactor)
      // Ideally, we emit to parent.
    };

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        emit('data-loaded', e.target.result);
      };
      reader.readAsText(file);
    };

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
      handleFileChange,
      handleTextSubmit
    };
  }
};
