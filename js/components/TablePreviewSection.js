const TablePreviewSection = {
  setup() {
    // 全テーブル
    const tables = Vue.computed(() => AppState.parsedTables);

    // 検索
    const searchQuery = Vue.ref('');

    // 検索結果
    const filteredTables = Vue.computed(() => {
      const query = searchQuery.value.trim().toLowerCase();
      if (!query) return tables.value;

      return tables.value.filter(table => {
        return table.tableName.toLowerCase().includes(query) ||
          (table.tableNameJP && table.tableNameJP.toLowerCase().includes(query));
      });
    });

    // テーブル表示するカラム定義
    const columnsDef = [
      { key: 'colNo', label: 'No', defaultVisibility: false },
      { key: 'colNameJP', label: '論理名', defaultVisibility: true },
      { key: 'colName', label: '物理名', defaultVisibility: true },
      { key: 'pkfk', label: 'PK/FK', defaultVisibility: true },
      { key: 'type', label: '型', defaultVisibility: true },
      { key: 'length', label: '長さ', defaultVisibility: true },
      { key: 'constraint', label: '制約', defaultVisibility: true },
      { key: 'default', label: 'デフォルト', defaultVisibility: false },
      { key: 'description', label: '説明', defaultVisibility: false },
      { key: 'idx1', label: 'Idx1', defaultVisibility: false },
      { key: 'idx2', label: 'Idx2', defaultVisibility: false },
      { key: 'idx3', label: 'Idx3', defaultVisibility: false },
      { key: 'idx4', label: 'Idx4', defaultVisibility: false },
      { key: 'idx5', label: 'Idx5', defaultVisibility: false }
    ];

    // 表示するカラム
    const visibleColumns = Vue.ref(columnsDef.filter(c => c.defaultVisibility).map(c => c.key));

    // インデックス列の各キー
    const indexColumnKeys = ['idx1', 'idx2', 'idx3', 'idx4', 'idx5'];

    // インデックス列を一括で表示・非表示にするためのComputedプロパティ
    const isIdxVisible = Vue.computed({
      get: () => {
        // どれか一つでも表示されていればチェック状態とする
        return indexColumnKeys.some(key => visibleColumns.value.includes(key));
      },
      set: (value) => {
        if (value) {
          // チェックされたら、まだ表示されていないインデックス列を追加する
          indexColumnKeys.forEach(key => {
            if (!visibleColumns.value.includes(key)) {
              visibleColumns.value.push(key);
            }
          });
        } else {
          // チェックが外されたら、インデックス列をすべて削除する
          visibleColumns.value = visibleColumns.value.filter(key => !indexColumnKeys.includes(key));
        }
      }
    });

    // 画面上の選択肢として表示するカラム定義
    // Idx1, Idx2... はまとめて "Idx" という1つの選択肢にする
    const displayOptionColumns = Vue.computed(() => {
      const result = [];
      let idxGroupAdded = false;

      columnsDef.forEach(col => {
        if (indexColumnKeys.includes(col.key)) {
          if (!idxGroupAdded) {
            result.push({ key: 'idx_group', label: 'Idx', isGroup: true });
            idxGroupAdded = true;
          }
        } else {
          result.push({ ...col, isGroup: false });
        }
      });
      return result;
    });

    // 共通カラムを隠す
    const hideCommonColumns = Vue.ref(true);

    // 共通カラム名
    const commonColumnNames = Vue.computed(() => {
      const allTables = tables.value;
      if (allTables.length <= 1) return [];

      // 最初のテーブルの論理列名で初期化
      let common = new Set(allTables[0].columns.map(c => c.colName));

      // 他のテーブルと交差
      for (let i = 1; i < allTables.length; i++) {
        const currentTableCols = new Set(allTables[i].columns.map(c => c.colName));
        common = new Set([...common].filter(x => currentTableCols.has(x)));
      }

      // 'id'を除外
      common.delete('id');

      return Array.from(common);
    });

    // 表示する行
    const shouldShowRow = (col) => {
      if (!hideCommonColumns.value) return true;
      return !commonColumnNames.value.includes(col.colName);
    };

    // テーブルスクロール
    const scrollToTable = (tableName) => {
      const el = document.getElementById(`table-def-${tableName}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    };

    return {
      tables,
      columnsDef,
      visibleColumns,
      hideCommonColumns,
      commonColumnNames,
      filteredTables,
      shouldShowRow,
      scrollToTable,
      isIdxVisible,
      displayOptionColumns
    };
  },
  template: `
    <section id="table-preview" v-if="tables.length > 0">
      <h2>テーブル定義プレビュー</h2>

      <div class="grid" style="grid-template-columns: 350px 1fr; gap: 2rem; align-items: start;">
        <!-- Sidebar Navigation -->
        <aside style="position: sticky; top: 2rem; max-height: 100vh; overflow-y: auto;">
          <!-- Column Visibility Settings (Dropdown) -->
          <details class="dropdown" style="margin-bottom: 1rem;">
            <summary>表示カラム設定</summary>
            <ul>
              <li v-if="commonColumnNames.length > 0">
                <label>
                  <input type="checkbox" v-model="hideCommonColumns">
                  共通カラムを隠す ({{ commonColumnNames.length }}件)
                </label>
              </li>
              <li v-for="col in displayOptionColumns" :key="col.key">
                <label>
                  <input v-if="col.isGroup" type="checkbox" v-model="isIdxVisible">
                  <input v-else type="checkbox" :value="col.key" v-model="visibleColumns">
                  {{ col.label }}
                </label>
              </li>
            </ul>
          </details>
          <div style="margin-bottom: 1rem;">
            <input type="search" placeholder="テーブル名で検索..." v-model="searchQuery" style="margin-bottom: 0;">
          </div>

          <nav>
            <ul>
              <li v-for="table in filteredTables" :key="table.tableName">
                <a href="#" @click.prevent="scrollToTable(table.tableName)" style="display: block; overflow: hidden;">
                  <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="table.tableNameJP">{{ table.tableNameJP }}</div>
                  <small style="display: block; color: var(--muted-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="table.tableName">{{ table.tableName }}</small>
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <!-- Main Content -->
        <div>
          <!-- Table List -->
          <div v-for="table in tables" :key="table.tableName" :id="'table-def-' + table.tableName" class="card" style="margin-bottom: 2rem;">
            <header>
              <strong>{{ table.tableNameJP }} ({{ table.tableName }})</strong>
              <!-- <p v-if="table.description" style="margin-bottom: 0; font-size: 0.9rem; color: var(--muted-color);">{{ table.description }}</p> -->
            </header>
            <div style="overflow-x: auto;">
              <table role="grid">
                <thead>
                  <tr>
                    <th v-for="def in columnsDef" :key="def.key" v-show="visibleColumns.includes(def.key)">
                      {{ def.label }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="col in table.columns" :key="col.colName" v-show="shouldShowRow(col)">
                    <td v-for="def in columnsDef" :key="def.key" v-show="visibleColumns.includes(def.key)">
                      {{ col[def.key] }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
    <div v-else>
      <p>テーブル定義が読み込まれていません。</p>
    </div>
  `
};
