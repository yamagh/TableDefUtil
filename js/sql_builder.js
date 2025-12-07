// --- SQL構築ロジック ---

const sqlTableSelect = document.getElementById('sql-table-select');
const sqlSelectedTables = document.getElementById('sql-selected-tables');
const sqlJoinsContainer = document.getElementById('sql-joins-container');
const sqlFiltersContainer = document.getElementById('sql-filters-container');
const sqlSortsContainer = document.getElementById('sql-sorts-container');
const sqlSelectClause = document.getElementById('sql-select-clause');
const sqlOutput = document.getElementById('sql-output');

/**
 * SQL構築機能の初期化
 * @param {Array} tables パース済みのテーブル定義
 */
function initSqlBuilder(tables) {
  parsedTables = tables;
  sqlState.selectedTables = [];
  sqlState.joins = [];
  sqlState.filters = [];
  sqlState.sorts = [];

  sqlTableSelect.innerHTML = '<option value="">テーブルを追加...</option>';
  tables.forEach(table => {
    const option = document.createElement('option');
    option.value = table.tableName;
    option.textContent = `${table.tableName} (${table.tableNameJP})`;
    sqlTableSelect.appendChild(option);
  });

  document.getElementById('sql-builder-section').style.display = 'block';
  renderSqlBuilderUI();
}

/**
 * SQL構築UI全体の再描画
 */
function renderSqlBuilderUI() {
  renderSqlTables();
  renderSqlJoins();
  renderSqlFilters();
  renderSqlSorts();
  // renderSqlTables now calls updateSelectColumns, which is needed before updateSqlOutput
  updateSqlOutput();
}

// 1. テーブル選択
document.getElementById('sql-add-table-btn').addEventListener('click', () => {
  const tableName = sqlTableSelect.value;
  if (!tableName) return;
  const alias = `t${sqlState.selectedTables.length}`;
  sqlState.selectedTables.push({ tableName, alias });
  renderSqlBuilderUI();
});

/**
 * 選択されたテーブル一覧の描画
 */
function renderSqlTables() {
  sqlSelectedTables.innerHTML = '';
  sqlState.selectedTables.forEach((item, index) => {
    // 順序に基づいてエイリアス(t0, t1...)を再割り当て
    item.alias = `t${index}`;

    const def = parsedTables.find(t => t.tableName === item.tableName);
    const tableNameJP = def ? def.tableNameJP : '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.alias}</td>
      <td style="width: 100%;">${item.tableName} (${tableNameJP})</td>
      <td>
        <div role="group" style="width: auto; margin: 0;">
          <button class="outline secondary btn-sm" onclick="moveSqlTable(${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="outline secondary btn-sm" onclick="moveSqlTable(${index}, 1)" ${index === sqlState.selectedTables.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="outline contrast btn-sm btn-danger"" onclick="removeSqlTable(${index})" title="削除">x</button>
        </div>
      </td>
    `;
    sqlSelectedTables.appendChild(tr);
  });
  updateSelectColumns();
}

/**
 * SELECT句のカラム一覧を更新
 */
function updateSelectColumns() {
  const selects = [];
  sqlState.selectedTables.forEach(t => {
    const def = parsedTables.find(table => table.tableName === t.tableName);
    if (def) {
      def.columns.forEach(col => {
        selects.push(`${t.alias}.${col.colName} as ${t.alias}_${col.colName}`);
      });
    } else {
      selects.push(`${t.alias}.*`);
    }
  });
  sqlSelectClause.value = selects.join(',\n');
}

/**
 * 選択されたテーブルの削除
 */
window.removeSqlTable = (index) => {
  sqlState.selectedTables.splice(index, 1);
  renderSqlBuilderUI();
};

/**
 * 選択されたテーブルの順序変更
 */
window.moveSqlTable = (index, direction) => {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= sqlState.selectedTables.length) return;
  const item = sqlState.selectedTables.splice(index, 1)[0];
  sqlState.selectedTables.splice(newIndex, 0, item);
  renderSqlBuilderUI();
};

// 2. 結合条件
document.getElementById('sql-add-join-btn').addEventListener('click', () => {
  if (sqlState.selectedTables.length < 2) {
    alert('結合するには少なくとも2つのテーブルを選択してください。');
    return;
  }

  const rightIdx = sqlState.selectedTables.length - 1;
  const leftIdx = Math.max(0, rightIdx - 1);

  sqlState.joins.push({
    leftAlias: sqlState.selectedTables[leftIdx].alias,
    rightAlias: sqlState.selectedTables[rightIdx].alias,
    type: 'INNER JOIN',
    condition: generateDefaultJoinCondition(sqlState.selectedTables[leftIdx], sqlState.selectedTables[rightIdx])
  });
  renderSqlBuilderUI();
});

/**
 * デフォルトの結合条件を生成
 */
function generateDefaultJoinCondition(leftTableState, rightTableState) {
  const leftDef = parsedTables.find(t => t.tableName === leftTableState.tableName);
  const rightDef = parsedTables.find(t => t.tableName === rightTableState.tableName);

  let condition = '';
  const leftCols = leftDef.columns.map(c => c.colName);
  const rightCols = rightDef.columns.map(c => c.colName);

  const commonIdCols = leftCols.filter(c => rightCols.includes(c) && c.includes('_id'));

  if (commonIdCols.length > 0) {
    condition = `${leftTableState.alias}.${commonIdCols[0]} = ${rightTableState.alias}.${commonIdCols[0]}`;
  } else {
    // フォールバック: IDマッチング (例: t0.id = t1.user_id)
    if (leftCols.includes(`${rightTableState.tableName}_id`)) {
      condition = `${leftTableState.alias}.${rightTableState.tableName}_id = ${rightTableState.alias}.id`;
    } else if (rightCols.includes(`${leftTableState.tableName}_id`)) {
      condition = `${leftTableState.alias}.id = ${rightTableState.alias}.${leftTableState.tableName}_id`;
    }
  }

  // 論理削除フラグのチェックを追加
  if (leftCols.includes('is_deleted')) {
    condition += `\nAND ${leftTableState.alias}.is_deleted = false`;
  }
  if (rightCols.includes('is_deleted')) {
    condition += `\nAND ${rightTableState.alias}.is_deleted = false`;
  }

  // 条件が空だった場合の先頭のANDを削除
  if (condition.startsWith(' AND ')) condition = condition.substring(5);

  condition = condition.length > 0 ? condition : '/* 結合条件を設定してください */';

  return condition;
}

/**
 * 結合条件一覧の描画
 */
function renderSqlJoins() {
  sqlJoinsContainer.innerHTML = '';
  sqlState.joins.forEach((join, index) => {
    const div = document.createElement('div');
    // シンプルなflexレイアウトで並べる(Pico v2でもgridよりflexの方が柔軟な場合あり)
    div.style.display = 'flex';
    div.style.alignItems = 'start';
    div.style.gap = '10px';
    div.style.marginTop = '0.5rem';

    // エイリアス選択肢の生成
    const options = sqlState.selectedTables.map(t => `<option value="${t.alias}" ${t.alias === join.leftAlias || t.alias === join.rightAlias ? 'selected' : ''}>${t.alias} (${t.tableName})</option>`).join('');

    const leftOptions = sqlState.selectedTables.map(t => `<option value="${t.alias}" ${t.alias === join.leftAlias ? 'selected' : ''}>${t.alias}</option>`).join('');
    const rightOptions = sqlState.selectedTables.map(t => `<option value="${t.alias}" ${t.alias === join.rightAlias ? 'selected' : ''}>${t.alias}</option>`).join('');

    div.innerHTML = `
      <select onchange="updateSqlJoin(${index}, 'leftAlias', this.value)" style="width: auto;">${leftOptions}</select>
      <select onchange="updateSqlJoin(${index}, 'type', this.value)" style="width: auto;">
        <option value="INNER JOIN" ${join.type === 'INNER JOIN' ? 'selected' : ''}>INNER</option>
        <option value="LEFT JOIN" ${join.type === 'LEFT JOIN' ? 'selected' : ''}>LEFT</option>
      </select>
      <select onchange="updateSqlJoin(${index}, 'rightAlias', this.value)" style="width: auto;">${rightOptions}</select>
      <span style="margin-top: 1rem;">ON</span>
      <textarea onchange="updateSqlJoin(${index}, 'condition', this.value)" placeholder="例: t0.id = t1.user_id" style="field-sizing: content; flex-grow:1; height: auto; min-height: 2rem; resize: vertical; padding: 0.25rem; margin: 0;">${join.condition.replace(/"/g, '&quot;')}</textarea>
      <div role="group" style="width: auto;">
        <button class="outline secondary btn-sm" onclick="moveSqlJoin(${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button class="outline secondary btn-sm" onclick="moveSqlJoin(${index}, 1)" ${index === sqlState.joins.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="outline contrast btn-sm btn-danger" onclick="removeSqlJoin(${index})" title="削除">x</button>
      </div>
    `;
    sqlJoinsContainer.appendChild(div);
  });
}

/**
 * 結合条件の更新
 */
window.updateSqlJoin = (index, key, value) => {
  sqlState.joins[index][key] = value;
  updateSqlOutput();
};

/**
 * 結合条件の削除
 */
window.removeSqlJoin = (index) => {
  sqlState.joins.splice(index, 1);
  renderSqlBuilderUI();
};

/**
 * 結合条件の順序変更
 */
window.moveSqlJoin = (index, direction) => {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= sqlState.joins.length) return;
  const item = sqlState.joins.splice(index, 1)[0];
  sqlState.joins.splice(newIndex, 0, item);
  renderSqlBuilderUI();
};

// 3. 絞り込み条件
document.getElementById('sql-add-filter-btn').addEventListener('click', () => {
  sqlState.filters.push('');
  renderSqlBuilderUI();
});

/**
 * 絞り込み条件一覧の描画
 */
function renderSqlFilters() {
  sqlFiltersContainer.innerHTML = '';
  sqlState.filters.forEach((filter, index) => {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '5px';
    div.style.alignItems = 'center';
    div.innerHTML = `
       <textarea onchange="updateSqlFilter(${index}, this.value)" placeholder="例: t0.id > 100" style="field-sizing: content; flex-grow:1; height: auto; min-height: 2rem; resize: vertical; padding: 0.25rem; margin: 0;">${filter}</textarea>
       <button class="outline contrast btn-sm btn-danger" onclick="removeSqlFilter(${index})" title="削除">x</button>
    `;
    sqlFiltersContainer.appendChild(div);
  });
}

/**
 * 絞り込み条件の更新
 */
window.updateSqlFilter = (index, value) => {
  sqlState.filters[index] = value;
  updateSqlOutput();
};

/**
 * 絞り込み条件の削除
 */
window.removeSqlFilter = (index) => {
  sqlState.filters.splice(index, 1);
  renderSqlBuilderUI();
};

// 4. ソート順
document.getElementById('sql-add-sort-btn').addEventListener('click', () => {
  if (sqlState.selectedTables.length === 0) return;

  // 最初のテーブルの最初のカラムをデフォルトにする
  const firstTbl = sqlState.selectedTables[0];
  const firstDef = parsedTables.find(t => t.tableName === firstTbl.tableName);

  sqlState.sorts.push({
    alias: firstTbl.alias,
    column: firstDef.columns[0].colName,
    direction: 'ASC'
  });
  renderSqlBuilderUI();
});

/**
 * ソート順一覧の描画
 */
function renderSqlSorts() {
  sqlSortsContainer.innerHTML = '';
  sqlState.sorts.forEach((sort, index) => {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '5px';
    div.style.alignItems = 'center';

    const aliasOptions = sqlState.selectedTables.map(t => `<option value="${t.alias}" ${t.alias === sort.alias ? 'selected' : ''}>${t.alias}</option>`).join('');

    // 選択されたエイリアスに基づいてカラムの選択肢を変更
    const tblState = sqlState.selectedTables.find(t => t.alias === sort.alias);
    let colOptions = '';
    if (tblState) {
      const def = parsedTables.find(t => t.tableName === tblState.tableName);
      if (def) {
        colOptions = def.columns.map(c => `<option value="${c.colName}" ${c.colName === sort.column ? 'selected' : ''}>${c.colName} (${c.colNameJP})</option>`).join('');
      }
    }

    div.innerHTML = `
      <select onchange="updateSqlSort(${index}, 'alias', this.value)" style="width:auto;">${aliasOptions}</select>
      <select onchange="updateSqlSort(${index}, 'column', this.value)">${colOptions}</select>
      <select onchange="updateSqlSort(${index}, 'direction', this.value)" style="width:150px;">
          <option value="ASC" ${sort.direction === 'ASC' ? 'selected' : ''}>ASC</option>
          <option value="DESC" ${sort.direction === 'DESC' ? 'selected' : ''}>DESC</option>
      </select>
      
      <div role="group" style="width: auto;">
        <button class="outline secondary btn-sm" onclick="moveSqlSort(${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button class="outline secondary btn-sm" onclick="moveSqlSort(${index}, 1)" ${index === sqlState.sorts.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="outline contrast btn-sm btn-danger" onclick="removeSqlSort(${index})" title="削除">x</button>
      </div>
    `;
    sqlSortsContainer.appendChild(div);
  });
}

/**
 * ソート順の更新
 */
window.updateSqlSort = (index, key, value) => {
  sqlState.sorts[index][key] = value;
  // エイリアスが変更された場合、カラムをリセット
  if (key === 'alias') {
    const tblState = sqlState.selectedTables.find(t => t.alias === value);
    const def = parsedTables.find(t => t.tableName === tblState.tableName);
    if (def && def.columns.length > 0) {
      sqlState.sorts[index].column = def.columns[0].colName;
    }
    renderSqlBuilderUI(); // Need full re-render to update columns
  } else {
    updateSqlOutput();
  }
};

/**
 * ソート順の削除
 */
window.removeSqlSort = (index) => {
  sqlState.sorts.splice(index, 1);
  renderSqlBuilderUI();
};

/**
 * ソート順の順序変更
 */
window.moveSqlSort = (index, direction) => {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= sqlState.sorts.length) return;
  const item = sqlState.sorts.splice(index, 1)[0];
  sqlState.sorts.splice(newIndex, 0, item);
  renderSqlBuilderUI();
};

// 5. SQL生成
/**
 * SQL生成と表示
 */
window.updateSqlOutput = function () {
  if (sqlState.selectedTables.length === 0) {
    sqlOutput.value = '';
    return;
  }

  let sql = 'SELECT\n';

  sql += sqlSelectClause.value || '*'; // 空の場合はフォールバック

  sql += '\nFROM\n';

  const first = sqlState.selectedTables[0];
  sql += `    ${first.tableName} AS ${first.alias}\n`;

  sqlState.joins.forEach(join => {
    const rightTbl = sqlState.selectedTables.find(t => t.alias === join.rightAlias);
    const rightName = rightTbl ? rightTbl.tableName : '???';
    sql += `${join.type} ${rightName} AS ${join.rightAlias} ON ${join.condition}\n`;
  });

  const validFilters = sqlState.filters.filter(f => f.trim() !== '');
  if (validFilters.length > 0) {
    sql += 'WHERE\n';
    sql += validFilters.map(f => `    ${f}`).join(' AND\n');
    sql += '\n';
  }

  if (sqlState.sorts.length > 0) {
    sql += 'ORDER BY\n';
    sql += sqlState.sorts.map(s => `    ${s.alias}.${s.column} ${s.direction}`).join(',\n');
    sql += '\n';
  }

  sql += ';';

  try {
    if (window.sqlFormatter) {
      sql = sqlFormatter.format(sql, { language: 'postgresql' });
    }
  } catch (e) {
    console.warn('SQL Formatting failed:', e);
  }

  sqlOutput.value = sql;

  // 自動コード生成
  autoGenerateCode();
}

// 6. コード生成機能 (Repository/Service/Controller/DTO) - 自動実行のための関数
function autoGenerateCode() {
  if (sqlState.selectedTables.length === 0) {
    // テーブルが選択されていない場合は結果をクリアして非表示
    document.getElementById('sql-java-result-container').style.display = 'none';
    return;
  }

  // デフォルトのSELECT句を生成して編集有無を判定
  let defaultSelects = [];
  sqlState.selectedTables.forEach(t => {
    const def = parsedTables.find(table => table.tableName === t.tableName);
    if (def) {
      def.columns.forEach(col => {
        defaultSelects.push(`${t.alias}.${col.colName} as ${t.alias}_${col.colName}`);
      });
    } else {
      defaultSelects.push(`${t.alias}.*`);
    }
  });
  const defaultSelectClause = defaultSelects.join(',\n');

  // 空白を削除して比較
  const isSelectEdited = (sqlSelectClause.value.replace(/\s/g, '') !== defaultSelectClause.replace(/\s/g, ''));

  const javaFiles = generateJavaSql(sqlState, parsedTables, sqlSelectClause.value, isSelectEdited);
  const tsFiles = generateTsSql(sqlState, parsedTables, sqlSelectClause.value, isSelectEdited);

  const allFiles = { ...javaFiles, ...tsFiles };

  // SQLもファイルとして追加
  if (sqlOutput.value && sqlOutput.value.trim() !== '') {
    // ファイル名の決定: 単一テーブルならテーブル名、そうでなければCustomQuery
    let baseName = "CustomQuery";
    if (sqlState.selectedTables.length === 1) {
      const t = parsedTables.find(table => table.tableName === sqlState.selectedTables[0].tableName);
      if (t) baseName = toPascalCase(t.tableName);
    } else if (sqlState.selectedTables.length > 0) {
      const t = parsedTables.find(table => table.tableName === sqlState.selectedTables[0].tableName);
      if (t) baseName = toPascalCase(t.tableName) + "Custom";
    }
    allFiles[`sql/${baseName}.sql`] = sqlOutput.value;
  }

  renderSqlCodeResult(allFiles);
}

/**
 * 生成されたコードを表示する
 */
function renderSqlCodeResult(files) {
  const container = document.getElementById('sql-java-result-container');
  const tabsContainer = document.getElementById('sql-java-tabs');
  const contentsContainer = document.getElementById('sql-java-contents');

  container.style.display = 'block';
  tabsContainer.innerHTML = '';
  contentsContainer.innerHTML = '';

  let isFirst = true;

  for (const [path, content] of Object.entries(files)) {
    // パスからファイル名のみ抽出
    const fileName = path.split('/').pop();

    // ラベルを決定
    let label = fileName;
    if (fileName.endsWith('Repository.java')) label = 'Repository';
    else if (fileName.endsWith('Service.java')) label = 'Service';
    else if (fileName.endsWith('Controller.java')) label = 'Controller';
    else if (fileName.endsWith('Dto.java')) label = 'Java DTO';
    else if (fileName.endsWith('.ts')) label = 'TS Type';
    else if (fileName.endsWith('.sql')) label = 'SQL';

    // ID用にパスをセーフな文字列に
    const tabId = 'sql-java-tab-' + fileName.replace(/[^a-zA-Z0-9]/g, '-');

    // タブ作成
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = label;
    a.title = fileName; // ツールチップで元のファイル名を表示
    a.className = isFirst ? 'active' : '';
    a.dataset.target = tabId;

    a.addEventListener('click', (e) => {
      e.preventDefault();
      // タブの切り替え
      tabsContainer.querySelectorAll('a').forEach(el => el.classList.remove('active'));
      e.target.classList.add('active');

      contentsContainer.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
      document.getElementById(tabId).style.display = 'block';
    });

    li.appendChild(a);
    tabsContainer.appendChild(li);

    // コンテンツ作成
    const div = document.createElement('div');
    div.id = tabId;
    div.className = 'tab-content';
    div.style.display = isFirst ? 'block' : 'none';

    const textarea = document.createElement('textarea');
    textarea.value = content;
    textarea.readOnly = true;
    textarea.style.height = '300px';
    textarea.style.fontFamily = 'monospace';

    div.appendChild(textarea);
    contentsContainer.appendChild(div);

    isFirst = false;
  }

  // ダウンロードボタンの設定
  const downloadBtn = document.getElementById('sql-java-download-btn');
  // リスナーを再生成するためにクローン
  const newDownloadBtn = downloadBtn.cloneNode(true);
  downloadBtn.parentNode.replaceChild(newDownloadBtn, downloadBtn);

  newDownloadBtn.addEventListener('click', () => {
    if (typeof JSZip === 'undefined') {
      console.error('JSZip is not loaded');
      return;
    }
    const zip = new JSZip();
    for (const [path, content] of Object.entries(files)) {
      zip.file(path, content);
    }

    zip.generateAsync({ type: "blob" })
      .then(function (content) {
        const now = (d => { d.setHours(d.getHours() + 9); return d.toISOString().slice(0, 19).replace('T', '-').replace(/:/g, '') })(new Date())
        downloadFile(content, `sql-generated-code-${now}.zip`);
      });
  });
}
