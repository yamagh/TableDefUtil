const SqlJoins = {
  template: `
    <div>
      <h4>2. 結合条件</h4>
      <div v-for="(join, index) in joins" :key="index" style="display: flex; align-items: start; gap: 10px; margin-top: 0.5rem;">
         <select v-model="join.leftAlias" class="select-sm" style="width: auto;">
             <option v-for="t in selectedTables" :key="t.alias" :value="t.alias">{{ t.alias }}</option>
         </select>
         <select v-model="join.type" class="select-sm" style="width: auto;">
             <option value="INNER JOIN">INNER</option>
             <option value="LEFT JOIN">LEFT</option>
         </select>
         <select v-model="join.rightAlias" class="select-sm" style="width: auto;">
             <option v-for="t in selectedTables" :key="t.alias" :value="t.alias">{{ t.alias }}</option>
         </select>
         <span style="margin-top: 0.4rem;">ON</span>
         <textarea v-model="join.condition" placeholder="例: t0.id = t1.user_id" class="text-sm" style="field-sizing: content; flex-grow:1; height: auto; min-height: 2rem; resize: vertical; padding: 0.25rem; margin: 0;"></textarea>
         <div role="group" style="width: auto;">
            <button class="outline secondary btn-sm" @click="moveJoin(index, -1)" :disabled="index === 0"><i class="bi bi-arrow-up"></i></button>
            <button class="outline secondary btn-sm" @click="moveJoin(index, 1)" :disabled="index === joins.length - 1"><i class="bi bi-arrow-down"></i></button>
            <button class="outline contrast btn-sm btn-danger" @click="removeJoin(index)" title="削除"><i class="bi bi-x-lg"></i></button>
         </div>
      </div>
      <button @click="addJoin" class="secondary outline btn-sm" style="margin-top: 0.5rem; width: 100%;"><i class="bi bi-plus-lg"></i> 結合条件を追加</button>
    </div>
  `,
  setup() {
    const joins = Vue.computed(() => App.State.sql.joins);
    const selectedTables = Vue.computed(() => App.State.sql.selectedTables);

    // 結合条件を追加
    const addJoin = () => {
      try {
        App.Core.SqlLogic.addJoin();
      } catch (e) {
        alert(e.message);
      }
    };

    // 結合条件を削除
    const removeJoin = (index) => {
      App.Core.SqlLogic.removeJoin(index);
    };

    // 結合条件を移動
    const moveJoin = (index, dir) => {
      App.Core.SqlLogic.moveJoin(index, dir);
    };

    return {
      joins,
      selectedTables,
      addJoin,
      removeJoin,
      moveJoin
    };
  }
};
