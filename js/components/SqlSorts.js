const SqlSorts = {
  template: `
    <div>
      <h4>4. ソート順 (ORDER BY)</h4>
      <div v-for="(sort, index) in sorts" :key="index" style="display: flex; gap: 10px; margin-bottom: 5px; align-items: center;">
          <select v-model="sort.alias" class="select-sm" style="width:auto;">
             <option v-for="t in selectedTables" :key="t.alias" :value="t.alias">{{ t.alias }}</option>
          </select>
          <select v-model="sort.column" class="select-sm">
             <option v-for="col in getColumns(sort.alias)" :key="col.colName" :value="col.colName">
                {{ col.colName }} ({{ col.colNameJP }})
             </option>
          </select>
          <select v-model="sort.direction" class="select-sm" style="width:150px;">
              <option value="ASC">ASC</option>
              <option value="DESC">DESC</option>
          </select>
          
          <div role="group" style="width: auto;">
            <button class="outline secondary btn-sm" @click="moveSort(index, -1)" :disabled="index === 0"><i class="bi bi-arrow-up"></i></button>
            <button class="outline secondary btn-sm" @click="moveSort(index, 1)" :disabled="index === sorts.length - 1"><i class="bi bi-arrow-down"></i></button>
            <button class="outline contrast btn-sm btn-danger" @click="removeSort(index)" title="削除"><i class="bi bi-x-lg"></i></button>
          </div>
      </div>
      <button @click="addSort" class="secondary outline btn-sm" style="margin-top: 0.5rem; width: 100%;"><i class="bi bi-plus-lg"></i> ソートを追加</button>
    </div>
  `,
  setup() {
    // ソート順
    const sorts = Vue.computed(() => App.State.sql.sorts);
    // 選択されたテーブル
    const selectedTables = Vue.computed(() => App.State.sql.selectedTables);

    // ソート順を追加
    const addSort = () => App.Core.SqlLogic.addSort();
    // ソート順を削除
    const removeSort = (index) => App.Core.SqlLogic.removeSort(index);
    // ソート順を移動
    const moveSort = (index, dir) => App.Core.SqlLogic.moveSort(index, dir);

    // 列を取得
    const getColumns = (alias) => {
      const t = App.State.sql.selectedTables.find(t => t.alias === alias);
      if (!t) return [];
      const def = App.State.parsedTables.find(d => d.tableName === t.tableName);
      return def ? def.columns : [];
    };

    return {
      sorts,
      selectedTables,
      addSort,
      removeSort,
      moveSort,
      getColumns
    };
  }
};
