/**
 * SQL Construction Logic
 */
// Initialize Namespace
window.App = window.App || {};
App.Core = App.Core || {};

/**
 * SQL Construction Logic
 */
App.Core.SqlLogic = {
  /**
   * セクションにテーブルを追加
   */
  addTable(tableName) {
    const alias = `t${App.State.sql.selectedTables.length}`;
    App.State.sql.selectedTables.push({ tableName, alias });
    return App.State.sql.selectedTables;
  },

  /**
   * セクションからテーブルを削除
   */
  removeTable(index) {
    App.State.sql.selectedTables.splice(index, 1);
    // エイリアスの再割り当て
    App.State.sql.selectedTables.forEach((item, idx) => {
      item.alias = `t${idx}`;
    });
  },

  /**
   * セクション内のテーブルを移動
   */
  moveTable(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= App.State.sql.selectedTables.length) return Promise.resolve(); // or just return
    const item = App.State.sql.selectedTables.splice(index, 1)[0];
    App.State.sql.selectedTables.splice(newIndex, 0, item);
    // エイリアスの再割り当て
    App.State.sql.selectedTables.forEach((item, idx) => {
      item.alias = `t${idx}`;
    });
  },

  /**
   * セクションに結合条件を追加
   */
  addJoin() {
    if (App.State.sql.selectedTables.length < 2) {
      throw new Error('結合条件を追加するには、2つ以上のテーブルが必要です。');
    }
    // 右側のテーブル
    const rightIdx = App.State.sql.selectedTables.length - 1;
    // 左側のテーブル
    const leftIdx = Math.max(0, rightIdx - 1);

    // 結合条件を生成
    const condition = this.generateDefaultJoinCondition(
      App.State.sql.selectedTables[leftIdx],
      App.State.sql.selectedTables[rightIdx]
    );

    // 結合条件を追加
    App.State.sql.joins.push({
      leftAlias: App.State.sql.selectedTables[leftIdx].alias,
      rightAlias: App.State.sql.selectedTables[rightIdx].alias,
      type: 'INNER JOIN',
      condition: condition
    });
  },

  /**
   * 結合条件を更新
   */
  updateJoin(index, key, value) {
    if (App.State.sql.joins[index]) {
      App.State.sql.joins[index][key] = value;
    }
  },

  /**
   * 結合条件を削除
   */
  removeJoin(index) {
    App.State.sql.joins.splice(index, 1);
  },

  /**
   * 結合条件を移動
   */
  moveJoin(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= App.State.sql.joins.length) return;
    const item = App.State.sql.joins.splice(index, 1)[0];
    App.State.sql.joins.splice(newIndex, 0, item);
  },

  /**
   * 結合条件を生成
   */
  generateDefaultJoinCondition(leftTableState, rightTableState) {
    const leftDef = App.State.parsedTables.find(t => t.tableName === leftTableState.tableName);
    const rightDef = App.State.parsedTables.find(t => t.tableName === rightTableState.tableName);

    if (!leftDef || !rightDef) return '/* テーブル定義が見つかりません */';

    let condition = '';
    const leftCols = leftDef.columns.map(c => c.colName);
    const rightCols = rightDef.columns.map(c => c.colName);

    // IDカラムの一致
    const commonIdCols = leftCols.filter(c => rightCols.includes(c) && c.includes('_id'));

    // AK/FKカラムの一致
    const leftAkFk = leftDef.columns.filter(c => c.pkfk && (c.pkfk.includes('AK') || c.pkfk.includes('FK'))).map(c => c.colName);
    const rightAkFk = rightDef.columns.filter(c => c.pkfk && (c.pkfk.includes('AK') || c.pkfk.includes('FK'))).map(c => c.colName);
    const commonAkFk = leftAkFk.filter(c => rightAkFk.includes(c));

    // 一致するカラムがあれば、それを使用
    if (commonAkFk.length > 0) {
      condition = `${leftTableState.alias}.${commonAkFk[0]} = ${rightTableState.alias}.${commonAkFk[0]}`;
    } else if (commonIdCols.length > 0) {
      condition = `${leftTableState.alias}.${commonIdCols[0]} = ${rightTableState.alias}.${commonIdCols[0]}`;
    } else {
      if (leftCols.includes(`${rightTableState.tableName}_id`)) {
        condition = `${leftTableState.alias}.${rightTableState.tableName}_id = ${rightTableState.alias}.id`;
      } else if (rightCols.includes(`${leftTableState.tableName}_id`)) {
        condition = `${leftTableState.alias}.id = ${rightTableState.alias}.${leftTableState.tableName}_id`;
      }
    }

    // 削除フラグの一致
    const isDeletedConfig = window.AppConfig?.commonColumns?.is_deleted || { name: 'is_deleted', valFalse: false };
    const isDeletedColName = isDeletedConfig.name;
    let isDeletedValFalse = isDeletedConfig.valFalse;
    if (typeof isDeletedValFalse === 'string') {
      isDeletedValFalse = `'${isDeletedValFalse}'`;
    }

    if (leftCols.includes(isDeletedColName)) {
      condition += `\nAND ${leftTableState.alias}.${isDeletedColName} = ${isDeletedValFalse}`;
    }
    if (rightCols.includes(isDeletedColName)) {
      condition += `\nAND ${rightTableState.alias}.${isDeletedColName} = ${isDeletedValFalse}`;
    }

    // ANDを削除
    if (condition.startsWith(' AND ')) condition = condition.substring(5);

    return condition.length > 0 ? condition : '/* 結合条件を設定してください */';
  },

  addFilter() {
    App.State.sql.filters.push('');
  },

  updateFilter(index, value) {
    App.State.sql.filters[index] = value;
  },

  removeFilter(index) {
    App.State.sql.filters.splice(index, 1);
  },

  addSort() {
    // 1つ以上のテーブルが選択されているかチェック
    if (App.State.sql.selectedTables.length === 0) return;
    const firstTbl = App.State.sql.selectedTables[0];
    const firstDef = App.State.parsedTables.find(t => t.tableName === firstTbl.tableName);

    // 安全チェック
    if (!firstDef || firstDef.columns.length === 0) return;

    App.State.sql.sorts.push({
      alias: firstTbl.alias,
      column: firstDef.columns[0].colName,
      direction: 'ASC'
    });
  },

  updateSort(index, key, value) {
    // ソートを更新
    const sort = App.State.sql.sorts[index];
    if (!sort) return;
    sort[key] = value;

    // エイリアスが変更された場合、カラムを再設定
    if (key === 'alias') {
      const tblState = App.State.sql.selectedTables.find(t => t.alias === value);
      if (tblState) {
        const def = App.State.parsedTables.find(t => t.tableName === tblState.tableName);
        if (def && def.columns.length > 0) {
          sort.column = def.columns[0].colName;
        }
      }
    }
  },

  removeSort(index) {
    App.State.sql.sorts.splice(index, 1);
  },

  moveSort(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= App.State.sql.sorts.length) return;
    const item = App.State.sql.sorts.splice(index, 1)[0];
    App.State.sql.sorts.splice(newIndex, 0, item);
  },

  generateSql(selectClause) {
    if (App.State.sql.selectedTables.length === 0) return '';

    let sql = 'SELECT\n';
    sql += selectClause || '*';
    sql += '\nFROM\n';

    const first = App.State.sql.selectedTables[0];
    sql += `    ${first.tableName} AS ${first.alias}\n`;

    App.State.sql.joins.forEach(join => {
      const rightTbl = App.State.sql.selectedTables.find(t => t.alias === join.rightAlias);
      const rightName = rightTbl ? rightTbl.tableName : '???';
      sql += `${join.type} ${rightName} AS ${join.rightAlias} ON ${join.condition}\n`;
    });

    const validFilters = App.State.sql.filters.filter(f => f.trim() !== '');
    if (validFilters.length > 0) {
      sql += 'WHERE\n';
      sql += validFilters.map(f => `    ${f}`).join(' AND\n');
      sql += '\n';
    }

    if (App.State.sql.sorts.length > 0) {
      sql += 'ORDER BY\n';
      sql += App.State.sql.sorts.map(s => `    ${s.alias}.${s.column} ${s.direction}`).join(',\n');
      sql += '\n';
    }

    if (App.State.sql.limit && App.State.sql.limit.trim() !== '') {
      sql += `LIMIT ${App.State.sql.limit.trim()}\n`;
    }

    if (App.State.sql.offset && App.State.sql.offset.trim() !== '') {
      sql += `OFFSET ${App.State.sql.offset.trim()}\n`;
    }

    sql += ';';

    try {
      if (typeof sqlFormatter !== 'undefined') {
        return sqlFormatter.format(sql, { language: 'postgresql' });
      }
    } catch (e) {
      console.warn("SQL formatter error", e);
    }
    return sql;
  },

  generateAutoCode(selectClause) {
    const autoGenResult = {};
    if (App.State.sql.selectedTables.length === 0) return autoGenResult;

    // select句が編集されているかチェック
    let defaultSelects = [];
    App.State.sql.selectedTables.forEach(t => {
      const def = App.State.parsedTables.find(table => table.tableName === t.tableName);
      if (def) {
        def.columns.forEach(col => {
          defaultSelects.push(`${t.alias}.${col.colName} as ${t.alias}_${col.colName}`);
        });
      } else {
        defaultSelects.push(`${t.alias}.*`);
      }
    });
    const defaultSelectClause = defaultSelects.join(',\n');
    const isSelectEdited = (selectClause.replace(/\s/g, '') !== defaultSelectClause.replace(/\s/g, ''));

    // Javaコード生成
    const javaFiles = generateJavaSql(App.State.sql, App.State.parsedTables, selectClause, isSelectEdited);
    // TypeScriptコード生成
    const tsFiles = generateTsSql(App.State.sql, App.State.parsedTables, selectClause, isSelectEdited);

    // 結果をマージ
    const allFiles = [];

    // SQLファイル
    const sqlContent = this.generateSql(selectClause);
    if (sqlContent && sqlContent.trim() !== '') {
      let baseName = "CustomQuery";
      if (App.State.sql.selectedTables.length === 1) {
        const t = App.State.parsedTables.find(table => table.tableName === App.State.sql.selectedTables[0].tableName);
        if (t) baseName = toPascalCase(t.tableName);
      } else if (App.State.sql.selectedTables.length > 0) {
        const t = App.State.parsedTables.find(table => table.tableName === App.State.sql.selectedTables[0].tableName);
        if (t) baseName = toPascalCase(t.tableName) + "Custom";
      }
      allFiles.push({ path: `sql/${baseName}.sql`, content: sqlContent });
    }

    // Javaファイル
    allFiles.push(...javaFiles);
    // TypeScriptファイル
    allFiles.push(...tsFiles);

    return allFiles;
  }
};

// Backward compat
window.SqlLogic = App.Core.SqlLogic;
