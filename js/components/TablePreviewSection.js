const TablePreviewSection = {
  setup() {
    // 全テーブル
    const tables = Vue.computed(() => AppState.parsedTables);

    // 検索
    const searchQuery = Vue.ref('');

    // 現在表示中のテーブル (スクロール追従用)
    const activeTable = Vue.ref('');

    // 検索結果
    const filteredTables = Vue.computed(() => {
      const query = searchQuery.value.trim().toLowerCase();
      if (!query) return tables.value;

      return tables.value.filter(table => {
        return table.tableName.toLowerCase().includes(query) ||
          (table.tableNameJP && table.tableNameJP.toLowerCase().includes(query));
      });
    });

    // テーブル表示するカラム定義
    const columnsDef = [
      { key: 'colNo', label: 'No', defaultVisibility: false },
      { key: 'colNameJP', label: '論理名', defaultVisibility: true },
      { key: 'colName', label: '物理名', defaultVisibility: true },
      { key: 'pkfk', label: 'PK/FK', defaultVisibility: true },
      { key: 'type', label: '型', defaultVisibility: true },
      { key: 'length', label: '長さ', defaultVisibility: true },
      { key: 'constraint', label: '制約', defaultVisibility: true },
      { key: 'default', label: 'デフォルト', defaultVisibility: false },
      { key: 'description', label: '説明', defaultVisibility: false },
      { key: 'idx1', label: 'Idx1', defaultVisibility: false },
      { key: 'idx2', label: 'Idx2', defaultVisibility: false },
      { key: 'idx3', label: 'Idx3', defaultVisibility: false },
      { key: 'idx4', label: 'Idx4', defaultVisibility: false },
      { key: 'idx5', label: 'Idx5', defaultVisibility: false }
    ];

    // 表示するカラム
    const visibleColumns = Vue.ref(columnsDef.filter(c => c.defaultVisibility).map(c => c.key));

    // インデックス列の各キー
    const indexColumnKeys = ['idx1', 'idx2', 'idx3', 'idx4', 'idx5'];

    // インデックス列を一括で表示・非表示にするためのComputedプロパティ
    const isIdxVisible = Vue.computed({
      get: () => {
        // どれか一つでも表示されていればチェック状態とする
        return indexColumnKeys.some(key => visibleColumns.value.includes(key));
      },
      set: (value) => {
        if (value) {
          // チェックされたら、まだ表示されていないインデックス列を追加する
          indexColumnKeys.forEach(key => {
            if (!visibleColumns.value.includes(key)) {
              visibleColumns.value.push(key);
            }
          });
        } else {
          // チェックが外されたら、インデックス列をすべて削除する
          visibleColumns.value = visibleColumns.value.filter(key => !indexColumnKeys.includes(key));
        }
      }
    });

    // 画面上の選択肢として表示するカラム定義
    // Idx1, Idx2... はまとめて "Idx" という1つの選択肢にする
    const displayOptionColumns = Vue.computed(() => {
      const result = [];
      let idxGroupAdded = false;

      columnsDef.forEach(col => {
        if (indexColumnKeys.includes(col.key)) {
          if (!idxGroupAdded) {
            result.push({ key: 'idx_group', label: 'Idx', isGroup: true });
            idxGroupAdded = true;
          }
        } else {
          result.push({ ...col, isGroup: false });
        }
      });
      return result;
    });

    // 共通カラムを隠す
    const hideCommonColumns = Vue.ref(true);

    // 共通カラム名
    const commonColumnNames = Vue.computed(() => {
      const allTables = tables.value;
      if (allTables.length <= 1) return [];

      // 最初のテーブルの論理列名で初期化
      let common = new Set(allTables[0].columns.map(c => c.colName));

      // 他のテーブルと交差
      for (let i = 1; i < allTables.length; i++) {
        const currentTableCols = new Set(allTables[i].columns.map(c => c.colName));
        common = new Set([...common].filter(x => currentTableCols.has(x)));
      }

      // 'id'を除外
      common.delete('id');

      return Array.from(common);
    });

    // 表示する行
    const shouldShowRow = (col) => {
      if (!hideCommonColumns.value) return true;
      return !commonColumnNames.value.includes(col.colName);
    };

    // テーブルスクロール
    const scrollToTable = (tableName) => {
      activeTable.value = tableName;
      const el = document.getElementById(`table-def-${tableName}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    };

    // IntersectionObserverの設定
    let observer = null;
    const setupIntersectionObserver = () => {
      if (observer) observer.disconnect();

      const options = {
        root: null,
        rootMargin: '-20% 0px -60% 0px', // 画面上部20%〜下部60%の範囲で検知 (少し上の方にあるものを優先)
        threshold: 0
      };

      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // id="table-def-tablename" から tablename を抽出
            const tableName = entry.target.id.replace('table-def-', '');
            activeTable.value = tableName;
          }
        });
      }, options);

      // DOM更新後に監視対象を設定
      Vue.nextTick(() => {
        const tableCards = document.querySelectorAll('.card[id^="table-def-"]');
        tableCards.forEach(card => observer.observe(card));
      });
    };

    // テーブルデータが変わったり、フィルタリングが変わったりしたらObserverを再設定
    Vue.watch(filteredTables, () => {
      setupIntersectionObserver();
    }, { flush: 'post' }); // DOM更新後に実行

    Vue.onMounted(() => {
      setupIntersectionObserver();
    });

    Vue.onUnmounted(() => {
      if (observer) observer.disconnect();
    });

    return {
      tables,
      columnsDef,
      visibleColumns,
      hideCommonColumns,
      commonColumnNames,
      filteredTables,
      shouldShowRow,
      scrollToTable,
      isIdxVisible,
      displayOptionColumns,
      searchQuery,
      activeTable,
      isEditMode: Vue.ref(false),
      tables,
      addTable: () => {
        let i = 1;
        let pName = 'new_table';
        while (AppState.parsedTables.some(t => t.tableName === pName)) {
          i++;
          pName = `new_table_${i}`;
        }

        AppState.parsedTables.push({
          tableName: pName,
          tableNameJP: '新規テーブル',
          columns: []
        });
      },
      removeTable: (index) => {
        if (confirm('このテーブルを削除しますか？')) {
          AppState.parsedTables.splice(index, 1);
        }
      },
      addColumn: (table) => {
        let i = 1;
        let cName = 'new_col';
        while (table.columns.some(c => c.colName === cName)) {
          i++;
          cName = `new_col_${i}`;
        }

        table.columns.push({
          colName: cName,
          colNameJP: '新規カラム',
          type: 'varchar',
          length: '255',
          constraint: '',
          pkfk: '',
          default: '',
          description: '',
          idx1: '', idx2: '', idx3: '', idx4: '', idx5: ''
        });
      },
      removeColumn: (table, index) => {
        table.columns.splice(index, 1);
      },
      moveColumn: (table, index, direction) => {
        if (direction === 'up' && index > 0) {
          const temp = table.columns[index];
          table.columns[index] = table.columns[index - 1];
          table.columns[index - 1] = temp;
        } else if (direction === 'down' && index < table.columns.length - 1) {
          const temp = table.columns[index];
          table.columns[index] = table.columns[index + 1];
          table.columns[index + 1] = temp;
        }
      },
      downloadTsv: () => {
        const data = [];
        AppState.parsedTables.forEach(table => {
          // カラムがないテーブルも出力する場合はここで空行を追加するなどの処理が必要だが、
          // 基本的にカラム定義がメインなので、カラムがないテーブルは出力されない（行が作られない）
          // 必要ならダミーカラムを入れるなどの対応検討。今のところはカラム必須とする。

          table.columns.forEach(col => {
            data.push({
              'TableName': table.tableName,
              'TableName_JP': table.tableNameJP,
              'ColName': col.colName,
              'ColName_JP': col.colNameJP,
              'PK/FK': col.pkfk,
              'Type': col.type,
              'Length': col.length,
              'Constraint': col.constraint,
              'Default': col.default,
              'Description': col.description,
              'Idx1': col.idx1,
              'Idx2': col.idx2,
              'Idx3': col.idx3,
              'Idx4': col.idx4,
              'Idx5': col.idx5
            });
          });
        });

        // Papa Parseを使ってTSV生成
        const tsvContent = Papa.unparse(data, {
          delimiter: "\t",
          header: true,
          newline: "\n",
          quotes: false, // 必要なければクォートしない（TSVは通常しないことが多いが、改行などある場合は自動判定される）
        });

        downloadFile(tsvContent, 'table_definitions_edited.tsv');
      }
    };
  },
  template: `
    <section id="table-preview" v-if="tables.length > 0">
      <div class="grid" style="grid-template-columns: 350px 1fr; gap: 2rem; align-items: start;">
        <!-- Sidebar Navigation -->
        <aside style="position: sticky; top: 2rem; max-height: 100vh; overflow-y: auto;">
          
          <!-- Edit Mode & Actions -->
          <div style="margin-bottom: 1rem; border-bottom: 1px solid var(--muted-border-color); padding-bottom: 1rem;">
            <label>
              <input type="checkbox" role="switch" v-model="isEditMode">
              編集モード
            </label>
            <div v-if="isEditMode" style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
               <button class="outline" style="font-size: 0.8rem; padding: 0.2rem 0.5rem;" @click="addTable">＋ テーブル追加</button>
               <button class="outline secondary" style="font-size: 0.8rem; padding: 0.2rem 0.5rem;" @click="downloadTsv">⇩ TSV保存</button>
            </div>
          </div>

          <!-- Column Visibility Settings (Dropdown) -->
          <details class="dropdown" style="margin-bottom: 1rem;">
            <summary>表示カラム設定</summary>
            <ul>
              <li v-if="commonColumnNames.length > 0">
                <label>
                  <input type="checkbox" v-model="hideCommonColumns">
                  共通カラムを隠す ({{ commonColumnNames.length }}件)
                </label>
              </li>
              <li v-for="col in displayOptionColumns" :key="col.key">
                <label>
                  <input v-if="col.isGroup" type="checkbox" v-model="isIdxVisible">
                  <input v-else type="checkbox" :value="col.key" v-model="visibleColumns">
                  {{ col.label }}
                </label>
              </li>
            </ul>
          </details>
          <div style="margin-bottom: 1rem;">
            <input type="search" placeholder="テーブル名で検索..." v-model="searchQuery" style="margin-bottom: 0;">
          </div>

          <nav>
            <ul>
              <li v-for="table in filteredTables" :key="table.tableName" style="padding-top: 0; padding-bottom: 0;">
                <a href="#" @click.prevent="scrollToTable(table.tableName)" 
                   style="display: block; overflow: hidden; padding: 0.5rem 1.5rem; margin: 0 1px; transition: background-color 0.2s;"
                   :style="{ backgroundColor: activeTable === table.tableName ? 'var(--primary-focus)' : 'transparent', border: activeTable === table.tableName ? '1px solid var(--pico-color-primary-600)' : '0' }">
                  <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: bold;" 
                       :style="{ color: activeTable === table.tableName ? 'var(--primary-inverse)' : 'inherit' }"
                       :title="table.tableNameJP">{{ table.tableNameJP }}</div>
                  <small style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" 
                         :style="{ color: activeTable === table.tableName ? 'var(--primary-inverse)' : 'var(--muted-color)' }"
                         :title="table.tableName">{{ table.tableName }}</small>
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <!-- Main Content -->
        <div>
          <!-- Table List -->
          <div v-for="(table, tIndex) in tables" :key="table.tableName + '_' + tIndex" :id="'table-def-' + table.tableName" class="card" style="margin-bottom: 2rem;">
            <header style="display: flex; justify-content: space-between; align-items: center;">
              <div v-if="!isEditMode">
                <strong>{{ table.tableNameJP }} ({{ table.tableName }})</strong>
                <!-- <p v-if="table.description" style="margin-bottom: 0; font-size: 0.9rem; color: var(--muted-color);">{{ table.description }}</p> -->
              </div>
              <div v-else style="display: flex; gap: 0.5rem; width: 100%;">
                <input type="text" v-model="table.tableNameJP" placeholder="論理名" style="margin-bottom: 0;">
                <input type="text" v-model="table.tableName" placeholder="物理名" style="margin-bottom: 0;">
              </div>
              
              <button v-if="isEditMode" class="outline contrast" style="margin-left: 1rem; padding: 0.2rem 0.5rem; font-size: 0.8rem; white-space: nowrap;" @click="removeTable(tIndex)">削除</button>
            </header>
            <div style="overflow-x: auto;">
              <table role="grid">
                <thead>
                  <tr>
                    <th v-if="isEditMode" style="width: 80px;">操作</th>
                    <th v-for="def in columnsDef" :key="def.key" v-show="visibleColumns.includes(def.key)">
                      {{ def.label }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(col, cIndex) in table.columns" :key="col.colName + '_' + cIndex" v-show="shouldShowRow(col) || isEditMode">
                    <td v-if="isEditMode">
                       <div style="display: flex; gap: 2px;">
                         <button class="outline" style="padding: 2px 4px; font-size: 0.7rem;" @click="moveColumn(table, cIndex, 'up')" :disabled="cIndex === 0">↑</button>
                         <button class="outline" style="padding: 2px 4px; font-size: 0.7rem;" @click="moveColumn(table, cIndex, 'down')" :disabled="cIndex === table.columns.length - 1">↓</button>
                         <button class="outline contrast" style="padding: 2px 4px; font-size: 0.7rem;" @click="removeColumn(table, cIndex)">×</button>
                       </div>
                    </td>
                    <td v-for="def in columnsDef" :key="def.key" v-show="visibleColumns.includes(def.key)">
                      <template v-if="!isEditMode">
                        {{ col[def.key] }}
                      </template>
                      <template v-else>
                         <input v-if="def.key !== 'colNo'" type="text" v-model="col[def.key]" style="margin-bottom: 0; padding: 0.2rem; font-size: 0.9rem; min-width: 60px;">
                         <span v-else>{{ cIndex + 1 }}</span>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="isEditMode" style="padding: 0.5rem; text-align: center;">
                 <button class="outline" style="width: 100%;" @click="addColumn(table)">＋ カラム追加</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <div v-else>
      <p>テーブル定義が読み込まれていません。</p>
      <div style="margin-top: 1rem;">
        <button @click="addTable">新規テーブル作成</button>
      </div>
    </div>
  `
};
