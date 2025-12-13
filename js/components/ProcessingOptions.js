const ProcessingOptions = {
  emits: ['update:mode'],
  setup(props, { emit }) {
    const selectedMode = Vue.ref('scaffolding');

    const updateMode = (mode) => {
      selectedMode.value = mode;
      emit('update:mode', mode);
    };

    return {
      selectedMode,
      updateMode
    };
  },
  template: `
    <section id="processing-options">
      <h2>処理オプション</h2>
      <div class="grid">
        <article 
          :class="{ 'primary-border': selectedMode === 'scaffolding' }"
          @click="updateMode('scaffolding')"
          style="cursor: pointer;"
        >
          <header><strong>アプリケーション雛形</strong></header>
          DDL, Model, Repository等のコードを生成します。
        </article>
        
        <article 
          :class="{ 'primary-border': selectedMode === 'sql' }"
          @click="updateMode('sql')"
          style="cursor: pointer;"
        >
          <header><strong>SQLコード生成</strong></header>
          GUIでSQLを構築し、Java/TSコードを生成します。
        </article>

        <article 
          :class="{ 'primary-border': selectedMode === 'preview' }"
          @click="updateMode('preview')"
          style="cursor: pointer;"
        >
          <header><strong>定義プレビュー</strong></header>
          読み込んだテーブル定義を表形式で確認します。
        </article>
      </div>
      <style>
        .primary-border {
          border: 2px solid var(--primary);
        }
      </style>
    </section>
  `
};
