const InputSection = {
  template: `
    <article>
      <header>入力</header>
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
          <small>TSV、CSV、またはJSONファイルを選択してください。</small>
        </div>
        <div v-show="activeTab === 'text'" class="tab-content" style="display: block;">
          <textarea v-model="textInput" placeholder="ここにTSV、CSV、またはJSONデータを貼り付けます"></textarea>
          <button @click="handleTextSubmit" style="margin-top: 1rem;">読み込み</button>
        </div>
      </section>
    </article>
  `,
  setup(props, { emit }) {
    const activeTab = Vue.ref('file');
    const textInput = Vue.ref('');
    const fileInput = Vue.ref(null);

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
      handleFileChange,
      handleTextSubmit
    };
  }
};
