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
            <button class="outline secondary btn-sm" @click="moveSort(index, -1)" :disabled="index === 0">↑</button>
            <button class="outline secondary btn-sm" @click="moveSort(index, 1)" :disabled="index === sorts.length - 1">↓</button>
            <button class="outline contrast btn-sm btn-danger" @click="removeSort(index)" title="削除">x</button>
          </div>
      </div>
      <button @click="addSort" class="secondary outline btn-sm" style="margin-top: 0.5rem; width: 100%;">ソートを追加</button>
    </div>
  `,
  setup() {
    const sorts = Vue.computed(() => AppState.sql.sorts);
    const selectedTables = Vue.computed(() => AppState.sql.selectedTables);

    const addSort = () => SqlLogic.addSort();
    const removeSort = (index) => SqlLogic.removeSort(index);
    const moveSort = (index, dir) => SqlLogic.moveSort(index, dir);

    const getColumns = (alias) => {
      const t = AppState.sql.selectedTables.find(t => t.alias === alias);
      if (!t) return [];
      const def = AppState.parsedTables.find(d => d.tableName === t.tableName);
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
