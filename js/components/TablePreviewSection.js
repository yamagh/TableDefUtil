const TablePreviewSection = {
  setup() {
    // 全テーブル
    const tables = Vue.computed(() => App.State.parsedTables);

    // 検索
    const searchQuery = Vue.ref('');

    // 現在表示中のテーブル (スクロール追従用)
    const activeTable = Vue.ref('');

    // Handsontable instance
    let hotInstance = null;
    const hotContainer = Vue.ref(null);

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
    const defaultCols = (App.State.config && App.State.config.preview && App.State.config.preview.defaultVisibleColumns)
      ? App.State.config.preview.defaultVisibleColumns
      : columnsDef.filter(c => c.defaultVisibility).map(c => c.key);
    const visibleColumns = Vue.ref(defaultCols);

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

    // Edit Mode Toggle Logic
    const isEditMode = Vue.ref(false);

    // Flatten tables for Handsontable
    const flattenTables = (tables) => {
      const flatData = [];
      tables.forEach(table => {
        table.columns.forEach(col => {
          flatData.push({
            tableName: table.tableName,
            tableNameJP: table.tableNameJP,
            colName: col.colName,
            colNameJP: col.colNameJP,
            pkfk: col.pkfk,
            type: col.type,
            length: col.length,
            constraint: col.constraint,
            default: col.default,
            description: col.description,
            idx1: col.idx1,
            idx2: col.idx2,
            idx3: col.idx3,
            idx4: col.idx4,
            idx5: col.idx5
          });
        });
      });
      return flatData;
    };

    // Reconstruct tables from Handsontable data
    const reconstructTables = (flatData) => {
      // Group by tableName
      const tablesMap = new Map();
      
      // Preserve original structure to keep generic table props if any (though currently simple)
      // We will rebuild from scratch based on flatData order to allow reordering tables/columns via grid
      
      flatData.forEach(row => {
        // Skip empty rows if user clears them (optional check)
        if (!row.tableName || !row.colName) return;

        if (!tablesMap.has(row.tableName)) {
          tablesMap.set(row.tableName, {
            tableName: row.tableName,
            tableNameJP: row.tableNameJP || row.tableName, // fallback
            columns: []
          });
        }
        
        const table = tablesMap.get(row.tableName);
        // Ensure logical name sync (last row wins or first? let's update it to ensure consistency)
        if (row.tableNameJP) table.tableNameJP = row.tableNameJP;

        table.columns.push({
          colName: row.colName,
          colNameJP: row.colNameJP || '',
          pkfk: row.pkfk || '',
          type: row.type || '',
          length: row.length || '',
          constraint: row.constraint || '',
          default: row.default || '',
          description: row.description || '',
          idx1: row.idx1 || '',
          idx2: row.idx2 || '',
          idx3: row.idx3 || '',
          idx4: row.idx4 || '',
          idx5: row.idx5 || ''
        });
      });

      return Array.from(tablesMap.values());
    };

    const initHandsontable = () => {
      const container = document.getElementById('hot-container');
      if (!container) return;

      const data = flattenTables(App.State.parsedTables);

      hotInstance = new Handsontable(container, {
        data: data,
        colHeaders: [
          'Table Name', 'Table Name (JP)', 
          'Column Name', 'Column Name (JP)', 
          'PK/FK', 'Type', 'Length', 'Constraint', 
          'Default', 'Description', 
          'Idx1', 'Idx2', 'Idx3', 'Idx4', 'Idx5'
        ],
        columns: [
          { data: 'tableName', type: 'text' },
          { data: 'tableNameJP', type: 'text' },
          { data: 'colName', type: 'text' },
          { data: 'colNameJP', type: 'text' },
          { data: 'pkfk', type: 'text' },
          { data: 'type', type: 'text' },
          { data: 'length', type: 'text' },
          { data: 'constraint', type: 'text' },
          { data: 'default', type: 'text' },
          { data: 'description', type: 'text' },
          { data: 'idx1', type: 'text' },
          { data: 'idx2', type: 'text' },
          { data: 'idx3', type: 'text' },
          { data: 'idx4', type: 'text' },
          { data: 'idx5', type: 'text' }
        ],
        fixedColumnsLeft: 1,
        rowHeaders: true,
        width: '100%',
        height: '80vh', // ヘッダーを固定するために高さを指定
        licenseKey: 'non-commercial-and-evaluation',
        contextMenu: true,
        filters: true,
        dropdownMenu: true,
        autoWrapRow: true,
        autoWrapCol: true,
        manualRowMove: true,
        manualColumnMove: true,
        minSpareRows: 1,
        afterChange: (changes, source) => {
          if (source === 'loadData') return;
          const newData = hotInstance.getSourceData();
          const validRows = newData.filter(r => r.tableName && r.colName);
          App.State.parsedTables.splice(0, App.State.parsedTables.length, ...reconstructTables(validRows));
        }
      });
    };

    Vue.watch(isEditMode, (newVal) => {
      if (newVal) {
        // Switch to Edit Mode -> Init HOT
        Vue.nextTick(() => {
          initHandsontable();
        });
      } else {
        // Switch to Preview Mode -> Destroy HOT
        if (hotInstance) {
          hotInstance.destroy();
          hotInstance = null;
        }
        setupIntersectionObserver();
      }
    });

    // テーブルデータが変わったり、フィルタリングが変わったりしたらObserverを再設定 (Preview Mode Only)
    Vue.watch(filteredTables, () => {
      if (!isEditMode.value) {
        setupIntersectionObserver();
      }
    }, { flush: 'post' }); // DOM更新後に実行

    Vue.onMounted(() => {
      if (!isEditMode.value) {
        setupIntersectionObserver();
      }
    });

    Vue.onUnmounted(() => {
      if (observer) observer.disconnect();
      if (hotInstance) hotInstance.destroy();
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
      isEditMode,
      tables,
      addTable: () => {
        let i = 1;
        let pName = 'new_table';
        while (App.State.parsedTables.some(t => t.tableName === pName)) {
          i++;
          pName = `new_table_${i}`;
        }

        App.State.parsedTables.push({
          tableName: pName,
          tableNameJP: '新規テーブル',
          columns: [{
             colName: 'id', colNameJP: 'ID', pkfk: 'PK', type: 'bigserial', constraint: 'NN',
             idx1: '1'
          }]
        });
      },
      removeTable: (index) => {
        if (confirm('このテーブルを削除しますか？')) {
          App.State.parsedTables.splice(index, 1);
        }
      },
      downloadTsv: () => {
        const data = [];
        App.State.parsedTables.forEach(table => {
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
          quotes: false,
        });

        App.Utils.Common.downloadFile(tsvContent, 'table_definitions_edited.tsv');
      },
      downloadJson: () => {
        const jsonContent = JSON.stringify(App.State.parsedTables, null, 2);
        App.Utils.Common.downloadFile(jsonContent, 'table_definitions_edited.json');
      }
    };
  },
  template: `
    <section id="table-preview" v-if="tables.length > 0">
      
      <!-- Top Actions Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--muted-border-color);">
         <div>
            <label style="display: inline-flex; align-items: center; cursor: pointer;">
              <input type="checkbox" role="switch" v-model="isEditMode">
              <span style="font-weight: bold; margin-left: 0.5rem;">編集モード (Spreadsheet)</span>
            </label>
         </div>
         <div style="display: flex; gap: 0.5rem;">
            <button class="outline secondary" style="font-size: 0.9rem; padding: 0.4rem 1rem;" @click="downloadTsv"><i class="bi bi-file-earmark-arrow-down"></i> TSV保存</button>
            <button class="outline secondary" style="font-size: 0.9rem; padding: 0.4rem 1rem;" @click="downloadJson"><i class="bi bi-file-earmark-code"></i> JSON保存</button>
         </div>
      </div>

      <!-- Edit Mode: Handsontable -->
      <div v-if="isEditMode">
         <div id="hot-container" style="width: 100%; height: 80vh; overflow: scroll;"></div>
         <small class="muted">※ 行を追加するには最下部の空行に入力してください。テーブル名が同じ行は同じテーブルとして扱われます。</small>
      </div>

      <!-- View Mode: Card List -->
      <div v-else class="grid" style="grid-template-columns: 350px 1fr; gap: 2rem; align-items: start;">
        <!-- Sidebar Navigation -->
        <aside style="position: sticky; top: 2rem; max-height: 100vh; overflow-y: auto;">
          
          <!-- Column Visibility Settings (Dropdown) -->
          <details class="dropdown" style="margin-bottom: 1rem;">
            <summary><i class="bi bi-layout-three-columns"></i> 表示カラム設定</summary>
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
            <header>
                <strong>{{ table.tableNameJP }} ({{ table.tableName }})</strong>
            </header>
            <div style="overflow-x: auto;">
              <table role="grid">
                <thead>
                  <tr>
                    <th v-for="def in columnsDef" :key="def.key" v-show="visibleColumns.includes(def.key)">
                      {{ def.label }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(col, cIndex) in table.columns" :key="cIndex" v-show="shouldShowRow(col)">
                    <td v-for="def in columnsDef" :key="def.key" v-show="visibleColumns.includes(def.key)">
                        {{ col[def.key] }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
    <div v-else>
      <p>テーブル定義が読み込まれていません。</p>
      <div style="margin-top: 1rem;">
        <button @click="addTable"><i class="bi bi-plus-circle"></i> 新規テーブル作成</button>
      </div>
    </div>
  `
};
