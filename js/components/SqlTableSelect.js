const SqlTableSelect = {
  template: `
    <div>
      <details style="margin-bottom: 1rem;">
        <summary style="cursor: pointer;">ℹ️ 変数機能の使い方</summary>
        <article style="margin-top: 0.5rem; font-size: 0.9rem;">
            <p>結合条件や絞り込み条件で、<code>:variableName</code> の形式で変数を記述すると、Javaコード生成時に自動的に引数として処理されます。</p>
            <ul>
            <li><strong>単一の値:</strong>
                <br><code>t0.name = :name</code>
                <br>&rarr; Java側で <code>String name</code> として扱われます。
            </li>
            <li><strong>リスト:</strong>
                <br><code>t0.id IN (:ids)</code>
                <br>&rarr; <code>IN</code> 句の中で使用されると、Java側で <code>List&lt;String&gt; ids</code> として扱われます。
            </li>
            <li><strong>リストサイズ:</strong>
                <br><code>:idsSize</code>
                <br>&rarr; <code>ids</code> がリスト変数の場合、<code>idsSize</code> は自動的に「リストのサイズ
                (<code>ids.size()</code>)」に置き換わります。メソッドの引数には現れません。
                <br><em>使用例:</em> <code>:idsSize = 0 OR t0.id IN (:ids)</code> (リストが空の場合は全件検索、など)
            </li>
            </ul>
        </article>
      </details>

      <h4>1. テーブル選択</h4>
      <fieldset role="group">
        <select v-model="selectedTableToAdd">
          <option value="">テーブルを追加...</option>
          <option v-for="t in availableTables" :key="t.tableName" :value="t.tableName">
            {{ t.tableName }} ({{ t.tableNameJP }})
          </option>
        </select>
        <button @click="addTable" style="white-space: nowrap;" class="btn-sm">追加</button>
      </fieldset>
      <table>
        <thead>
          <tr>
            <th>Alias</th>
            <th>Table Name</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in selectedTables" :key="item.alias">
            <td>{{ item.alias }}</td>
            <td style="width: 100%;">{{ item.tableName }} ({{ getTableNameJP(item.tableName) }})</td>
            <td>
              <div role="group" style="width: auto; margin: 0;">
                <button class="outline secondary btn-sm" @click="moveTable(index, -1)" :disabled="index === 0">↑</button>
                <button class="outline secondary btn-sm" @click="moveTable(index, 1)" :disabled="index === selectedTables.length - 1">↓</button>
                <button class="outline contrast btn-sm btn-danger" @click="removeTable(index)" title="削除">x</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  setup() {
    // We access global AppState directly in logic, but standard way is to use props or inject.
    // Given the architecture, using global AppState is consistent.

    // However, to make it reactive in template:
    const availableTables = Vue.computed(() => AppState.parsedTables);
    const selectedTables = Vue.computed(() => AppState.sql.selectedTables);
    const selectedTableToAdd = Vue.ref('');

    const getTableNameJP = (name) => {
      const t = AppState.parsedTables.find(x => x.tableName === name);
      return t ? t.tableNameJP : '';
    };

    const addTable = () => {
      if (!selectedTableToAdd.value) return;
      SqlLogic.addTable(selectedTableToAdd.value); // Logic operates on AppState
      selectedTableToAdd.value = '';
    };

    const removeTable = (index) => {
      SqlLogic.removeTable(index);
    };

    const moveTable = (index, dir) => {
      SqlLogic.moveTable(index, dir);
    };

    return {
      availableTables,
      selectedTables,
      selectedTableToAdd,
      addTable,
      removeTable,
      moveTable,
      getTableNameJP
    };
  }
};
