const SqlFilters = {
  template: `
    <div>
      <h4>3. 絞り込み条件 (WHERE)</h4>
      <div v-for="(filter, index) in filters" :key="index" style="display: flex; gap: 10px; margin-bottom: 5px; align-items: center;">
         <!-- 
            Directly modifying array of strings in Vue is tricky with v-model if it's a primitive array.
            AppState.sql.filters is an array of strings.
            To modify index, we need a wrapper in logic or special handling.
            Best approach: Component displays inputs, and we update via index.
            Actually, Vue 3 allows v-model on array items if they are objects, but strings are primitives.
            We will use a computed setter or handle input event.
         -->
         <textarea 
            :value="filter"
            @input="updateFilter(index, $event.target.value)"
            placeholder="例: t0.id > 100" 
            style="field-sizing: content; flex-grow:1; height: auto; min-height: 2rem; resize: vertical; padding: 0.25rem; margin: 0;">
         </textarea>
         <button class="outline contrast btn-sm btn-danger" @click="removeFilter(index)" title="削除">x</button>
      </div>
      <button @click="addFilter" class="secondary outline btn-sm" style="margin-top: 0.5rem; width: 100%;">条件を追加</button>
    </div>
  `,
  setup() {
    const filters = Vue.computed(() => AppState.sql.filters);

    const addFilter = () => SqlLogic.addFilter();
    const removeFilter = (index) => SqlLogic.removeFilter(index);
    const updateFilter = (index, value) => {
      AppState.sql.filters[index] = value;
    };

    return {
      filters,
      addFilter,
      removeFilter,
      updateFilter
    };
  }
};
