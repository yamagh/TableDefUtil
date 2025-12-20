const ProcessingOptions = {
  emits: ['update:mode'],
  setup(props, { emit }) {
    // 選択されたモード
    const selectedMode = Vue.ref('preview');

    // モード更新
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
          :class="{ 'selected-mode': selectedMode === 'input' }"
          @click="updateMode('input')"
          style="cursor: pointer;"
        >
          <header><strong><i class="bi bi-pencil-square"></i> 入力</strong></header>
          ファイルロードやテキスト貼付を行います。
        </article>

        <article 
          :class="{ 'selected-mode': selectedMode === 'preview' }"
          @click="updateMode('preview')"
          style="cursor: pointer;"
        >
          <header><strong><i class="bi bi-table"></i> 定義プレビュー</strong></header>
          読み込んだテーブル定義を表形式で確認します。
        </article>

        <article
          :class="{ 'selected-mode': selectedMode === 'scaffolding' }"
          @click="updateMode('scaffolding')"
          style="cursor: pointer;"
        >
          <header><strong><i class="bi bi-code-square"></i> アプリケーション雛形</strong></header>
          DDL, Model, Repository等のコードを生成します。
        </article>

        <article
          :class="{ 'selected-mode': selectedMode === 'sql' }"
          @click="updateMode('sql')"
          style="cursor: pointer;"
        >
          <header><strong><i class="bi bi-database"></i> SQLコード生成</strong></header>
          GUIでSQLを構築し、Java/TSコードを生成します。
        </article>
      </div>
    </section>
  `
};
