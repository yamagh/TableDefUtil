const CommonColumnsConfig = {
  setup() {
    // コンフィグがロードされるまで待つためのガード
    const config = Vue.computed(() => {
      if (AppState.config && AppState.config.commonColumns) {
        return AppState.config.commonColumns;
      }
      return null;
    });

    const isOpen = Vue.ref(false);

    const openModal = () => { isOpen.value = true; };
    const closeModal = () => { isOpen.value = false; };

    return { config, isOpen, openModal, closeModal };
  },
  template: `
    <div v-if="config">
      <button class="outline contrast" @click="openModal" style="margin-bottom: 1rem;">
        <i class="bi bi-gear"></i> 共通カラム設定
      </button>

      <dialog :open="isOpen">
        <article style="max-width: 800px;">
          <header>
            <a href="#close" aria-label="Close" class="close" @click.prevent="closeModal"></a>
            <h3>共通カラム設定</h3>
          </header>
          
          <p>
            これらの設定は、全テーブル共通で付与されるカラム（BaseModel等）の生成に影響します。
          </p>

          <details open>
            <summary>基本カラム名</summary>
            <div class="grid">
              <label>
                ID (PK)
                <input type="text" v-model="config.id">
              </label>
              <label>
                作成日時
                <input type="text" v-model="config.created_at">
              </label>
              <label>
                作成者
                <input type="text" v-model="config.created_by">
              </label>
            </div>
            <div class="grid">
              <label>
                更新日時
                <input type="text" v-model="config.updated_at">
              </label>
              <label>
                更新者
                <input type="text" v-model="config.updated_by">
              </label>
            </div>
          </details>

          <details open>
            <summary>論理削除 (Logical Delete)</summary>
            <div class="grid">
              <label>
                カラム名
                <input type="text" v-model="config.is_deleted.name">
              </label>
              <label>
                型
                <select v-model="config.is_deleted.type">
                  <option value="boolean">Boolean</option>
                  <option value="string">String</option>
                </select>
              </label>
            </div>
            
            <div v-if="config.is_deleted.type === 'string'" class="grid">
               <label>
                 削除済の値 (Trueとして扱う値)
                 <input type="text" v-model="config.is_deleted.valTrue">
               </label>
               <label>
                 有効な値 (Falseとして扱う値)
                 <input type="text" v-model="config.is_deleted.valFalse">
               </label>
            </div>
             <p v-if="config.is_deleted.type === 'string'"><small>※ String型の場合、指定された文字以外の値は考慮されません。</small></p>
          </details>

          <footer>
            <button @click="closeModal">閉じる</button>
          </footer>
        </article>
      </dialog>
    </div>
  `
};
