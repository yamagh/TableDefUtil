const SqlFilters = {
  template: `
    <div>
      <h4>3. 絞り込み条件 (WHERE)</h4>
      <div v-for="(filter, index) in filters" :key="index" style="display: flex; gap: 10px; margin-bottom: 5px; align-items: center;">
         <textarea 
            :value="filter"
            @input="updateFilter(index, $event.target.value)"
            placeholder="例: t0.id > 100" 
            style="field-sizing: content; flex-grow:1; height: auto; min-height: 2rem; resize: vertical; padding: 0.25rem; margin: 0;">
         </textarea>
         <button class="outline contrast btn-sm btn-danger" @click="removeFilter(index)" title="削除"><i class="bi bi-x-lg"></i></button>
      </div>
      <button @click="addFilter" class="secondary outline btn-sm" style="margin-top: 0.5rem; width: 100%;"><i class="bi bi-plus-lg"></i> 条件を追加</button>
    </div>
  `,
  setup() {
    // 絞り込み条件
    const filters = Vue.computed(() => App.State.sql.filters);

    const addFilter = () => App.Core.SqlLogic.addFilter();
    const removeFilter = (index) => App.Core.SqlLogic.removeFilter(index);
    const updateFilter = (index, value) => {
      App.State.sql.filters[index] = value;
    };

    return {
      filters,
      addFilter,
      removeFilter,
      updateFilter
    };
  }
};
