const SqlTableSelect = {
  template: `
    <div>
      <details style="margin-bottom: 1rem;">
        <summary style="cursor: pointer;"><i class="bi bi-info-circle-fill"></i> 変数機能の使い方</summary>
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
        <button @click="addTable" style="white-space: nowrap;" class="btn-sm"><i class="bi bi-plus"></i> 追加</button>
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
                <button class="outline secondary btn-sm" @click="moveTable(index, -1)" :disabled="index === 0"><i class="bi bi-arrow-up"></i></button>
                <button class="outline secondary btn-sm" @click="moveTable(index, 1)" :disabled="index === selectedTables.length - 1"><i class="bi bi-arrow-down"></i></button>
                <button class="outline contrast btn-sm btn-danger" @click="removeTable(index)" title="削除"><i class="bi bi-x-lg"></i></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  setup() {
    // 選択可能なテーブル
    const availableTables = Vue.computed(() => App.State.parsedTables);
    // 選択されたテーブル
    const selectedTables = Vue.computed(() => App.State.sql.selectedTables);
    // 追加するテーブル
    const selectedTableToAdd = Vue.ref('');

    // テーブル名を取得
    const getTableNameJP = (name) => {
      const t = App.State.parsedTables.find(x => x.tableName === name);
      return t ? t.tableNameJP : '';
    };

    // テーブルを追加
    const addTable = () => {
      if (!selectedTableToAdd.value) return;
      App.Core.SqlLogic.addTable(selectedTableToAdd.value); // Logic operates on AppState
      selectedTableToAdd.value = '';
    };

    // テーブルを削除
    const removeTable = (index) => {
      App.Core.SqlLogic.removeTable(index);
    };

    // テーブルを移動
    const moveTable = (index, dir) => {
      App.Core.SqlLogic.moveTable(index, dir);
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
