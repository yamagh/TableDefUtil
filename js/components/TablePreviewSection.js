const TablePreviewSection = {
  setup() {
    // Access global state directly since it's reactive
    const tables = Vue.computed(() => AppState.parsedTables);

    return {
      tables
    };
  },
  template: `
    <section id="table-preview" v-if="tables.length > 0">
      <h2>テーブル定義プレビュー</h2>
      
      <div v-for="table in tables" :key="table.tableName" class="card" style="margin-bottom: 2rem;">
        <header>
          <strong>{{ table.tableNameJP }} ({{ table.tableName }})</strong>
          <p v-if="table.description" style="margin-bottom: 0; font-size: 0.9rem; color: var(--muted-color);">{{ table.description }}</p>
        </header>
        <div style="overflow-x: auto;">
          <table role="grid">
            <thead>
              <tr>
                <th>No</th>
                <th>論理名</th>
                <th>物理名</th>
                <th>PK/FK</th>
                <th>型</th>
                <th>長さ</th>
                <th>制約</th>
                <th>デフォルト</th>
                <th>説明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="col in table.columns" :key="col.colName">
                <td>{{ col.colNo }}</td>
                <td>{{ col.colNameJP }}</td>
                <td>{{ col.colName }}</td>
                <td>{{ col.pkfk }}</td>
                <td>{{ col.type }}</td>
                <td>{{ col.length }}</td>
                <td>{{ col.constraint }}</td>
                <td>{{ col.default }}</td>
                <td>{{ col.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
    <div v-else>
      <p>テーブル定義が読み込まれていません。</p>
    </div>
  `
};
