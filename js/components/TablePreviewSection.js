const TablePreviewSection = {
  setup() {
    // Access global state
    const tables = Vue.computed(() => AppState.parsedTables);

    // Search
    const searchQuery = Vue.ref('');

    const filteredTables = Vue.computed(() => {
      const query = searchQuery.value.trim().toLowerCase();
      if (!query) return tables.value;

      return tables.value.filter(table => {
        return table.tableName.toLowerCase().includes(query) ||
          (table.tableNameJP && table.tableNameJP.toLowerCase().includes(query));
      });
    });

    // Column Definitions
    const columnsDef = [
      { key: 'colNo', label: 'No' },
      { key: 'colNameJP', label: '論理名' },
      { key: 'colName', label: '物理名' },
      { key: 'pkfk', label: 'PK/FK' },
      { key: 'type', label: '型' },
      { key: 'length', label: '長さ' },
      { key: 'constraint', label: '制約' },
      { key: 'default', label: 'デフォルト' },
      { key: 'description', label: '説明' }
    ];

    // Reactive state for visible columns (initially all true)
    const visibleColumns = Vue.ref(columnsDef.map(c => c.key));

    // Hide Common Columns Logic
    const hideCommonColumns = Vue.ref(true);

    const commonColumnNames = Vue.computed(() => {
      const allTables = tables.value;
      if (allTables.length <= 1) return [];

      // Initialize with logical column names from the first table
      let common = new Set(allTables[0].columns.map(c => c.colName));

      // Intersect with remaining tables
      for (let i = 1; i < allTables.length; i++) {
        const currentTableCols = new Set(allTables[i].columns.map(c => c.colName));
        common = new Set([...common].filter(x => currentTableCols.has(x)));
      }

      // Exclude 'id' from being hidden
      common.delete('id');

      return Array.from(common);
    });

    const shouldShowRow = (col) => {
      if (!hideCommonColumns.value) return true;
      return !commonColumnNames.value.includes(col.colName);
    };

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
      searchQuery,
      filteredTables,
      shouldShowRow,
      scrollToTable
    };
  },
  template: `
    <section id="table-preview" v-if="tables.length > 0">
      <h2>テーブル定義プレビュー</h2>

      <div class="grid" style="grid-template-columns: 250px 1fr; gap: 2rem; align-items: start;">
        <!-- Sidebar Navigation -->
        <aside style="position: sticky; top: 2rem; max-height: 100vh; overflow-y: auto;">
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
          <!-- Column Visibility Settings -->
          <details open style="margin-bottom: 2rem;">
            <summary>表示カラム設定</summary>
            <div style="padding: 1rem;">
              <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--muted-border-color);" v-if="commonColumnNames.length > 0">
                <label>
                  <input type="checkbox" v-model="hideCommonColumns">
                  共通カラムを隠す ({{ commonColumnNames.length }}件)
                  <span :data-tooltip="commonColumnNames.join(', ')">ℹ️</span>
                </label>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
                <label v-for="col in columnsDef" :key="col.key">
                  <input type="checkbox" :value="col.key" v-model="visibleColumns">
                  {{ col.label }}
                </label>
              </div>
            </div>
          </details>

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
