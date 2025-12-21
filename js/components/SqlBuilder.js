const SqlBuilder = {
  components: {
    SqlTableSelect,
    SqlJoins,
    SqlFilters,
    SqlSorts
  },
  template: `
     <article>
       <header>SQL 作成</header>
       <section id="sql-builder-section" style="display: block;">
         <div class="sql-builder-grid">
           <div class="sql-builder-col-left">
             <SqlTableSelect />
             <hr>
             <SqlJoins />
             <hr>
             <SqlFilters />
             <hr>
             <SqlSorts />
             <hr>
             <!-- Limit / Offset -->
            <div>
               <h4>5. Limit / Offset</h4>
               <div class="grid">
                 <label>
                   Limit
                   <input type="text" v-model="sql.limit" placeholder="例: 10 または :limit">
                 </label>
                 <label>
                   Offset
                   <input type="text" v-model="sql.offset" placeholder="例: 0 または :offset">
                 </label>
               </div>
               <div style="margin-top: 0.5rem;">
                 <label>
                   <input type="checkbox" v-model="sql.includeCountMethod">
                   件数取得 (count) メソッドも生成する
                 </label>
               </div>
             </div>
           </div>
 
           <div class="sql-builder-col-right">
             <div>
               <h4>6. 取得カラム (SELECT)</h4>
               <div style="margin-bottom: 0.5rem; font-size: 0.8rem; color: #666;">
                 ※テーブルを追加・削除・並べ替えするとリセットされます
               </div>
               <textarea v-model="selectClauseQuery"
                 style="height: auto;field-sizing: content;max-height: 90vh; min-height: 100px; font-family: monospace; white-space: pre;"
                 class="text-sm"></textarea>
             </div>
           </div>
         </div>
 
         <hr>
         
         <!-- Generated Results -->
         <div>
           <h4>7. 生成結果</h4>
           <div v-if="generatedFiles && generatedFiles.length > 0">
             <nav role="tab-control" class="tabs">
               <ul>
                 <li v-for="file in generatedFiles" :key="file.path">
                   <a href="#" @click.prevent="activeTab = file.path" :class="{ active: activeTab === file.path }">
                     {{ getFileLabel(file.path) }}
                   </a>
                 </li>
               </ul>
             </nav>
             <div class="result-contents">
                <div v-for="file in generatedFiles" :key="file.path" v-show="activeTab === file.path">
                  <textarea readonly style="height: auto; field-sizing: content; max-height: 80vh; font-family: monospace;" class="text-sm">{{ file.content }}</textarea>
                </div>
             </div>
             <button @click="downloadZip" style="width: 100%; margin-bottom: 1rem;"><i class="bi bi-file-zip"></i> 生成ファイルをダウンロード (ZIP)</button>
           </div>
           <div v-else>
             <p>テーブルを選択すると結果が表示されます。</p>
           </div>
         </div>
       </section>
     </article>
  `,
  setup() {
    const sql = Vue.computed(() => App.State.sql);
    const selectClauseQuery = Vue.ref('');
    const generatedFiles = Vue.shallowRef([]);
    const activeTab = Vue.ref('');

    // SELECT 句を更新
    Vue.watch(() => sql.value.selectedTables, (newTables) => {
      const selects = [];
      newTables.forEach(t => {
        const def = App.State.parsedTables.find(table => table.tableName === t.tableName);
        if (def) {
          def.columns.forEach(col => {
            selects.push(`${t.alias}.${col.colName} as ${t.alias}_${col.colName}${col.colNameJP ? (' /* ' + col.colNameJP + ' */') : ''}`);
          });
        } else {
          selects.push(`${t.alias}.*`);
        }
      });
      selectClauseQuery.value = selects.join(',\n');
    }, { deep: true });

    // すべての結果を生成
    const generate = () => {
      if (sql.value.selectedTables.length === 0) {
        generatedFiles.value = [];
        return;
      }
      try {
        const files = App.Core.SqlLogic.generateAutoCode(selectClauseQuery.value);
        generatedFiles.value = Array.isArray(files) ? files : [];
        if (generatedFiles.value.length > 0 && !generatedFiles.value.find(f => f.path === activeTab.value)) {
          activeTab.value = generatedFiles.value[0].path;
        }
      } catch (e) {
        console.error(e);
      }
    };

    // SQL 状態または Select 句が変更された場合、再生成
    Vue.watch([() => sql.value, selectClauseQuery], () => {
      generate();
    }, { deep: true });

    // ファイル名を取得
    const getFileLabel = (path) => {
      const fileName = path.split('/').pop();
      if (fileName.endsWith('Repository.java')) return 'Repository';
      if (fileName.endsWith('Service.java')) return 'Service';
      if (fileName.endsWith('Controller.java')) return 'Controller';
      if (fileName.endsWith('Dto.java')) return 'Java DTO';
      if (fileName.endsWith('.ts')) return 'TS Type';
      if (fileName.endsWith('.sql')) return 'SQL';
      return fileName;
    };

    // ZIP ファイルをダウンロード
    const downloadZip = () => {
      if (!generatedFiles.value.length) return;
      if (typeof JSZip === 'undefined') {
        // Toast is available globally via ToastNotification.js logic (assumed) or app.js
        // For safety, keeping alert if unsure, but app.js uses Toast.
        alert('JSZip not loaded');
        return;
      }
      const zip = new JSZip();
      generatedFiles.value.forEach(f => zip.file(f.path, f.content));
      zip.generateAsync({ type: "blob" }).then(content => {
        const now = (d => { d.setHours(d.getHours() + 9); return d.toISOString().slice(0, 19).replace('T', '-').replace(/:/g, '') })(new Date())
        App.Utils.Common.downloadFile(content, `sql-generated-code-${now}.zip`);
      });
    };

    return {
      sql,
      selectClauseQuery,
      generatedFiles,
      activeTab,
      getFileLabel,
      downloadZip
    };
  }
};
