/**
 * SQL Construction Logic
 */
const SqlLogic = {
  /**
   * セクションにテーブルを追加
   */
  addTable(tableName) {
    const alias = `t${AppState.sql.selectedTables.length}`;
    AppState.sql.selectedTables.push({ tableName, alias });
    return AppState.sql.selectedTables;
  },

  /**
   * セクションからテーブルを削除
   */
  removeTable(index) {
    AppState.sql.selectedTables.splice(index, 1);
    // エイリアスの再割り当て
    AppState.sql.selectedTables.forEach((item, idx) => {
      item.alias = `t${idx}`;
    });
  },

  /**
   * セクション内のテーブルを移動
   */
  moveTable(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= AppState.sql.selectedTables.length) return Promise.resolve(); // or just return
    const item = AppState.sql.selectedTables.splice(index, 1)[0];
    AppState.sql.selectedTables.splice(newIndex, 0, item);
    // エイリアスの再割り当て
    AppState.sql.selectedTables.forEach((item, idx) => {
      item.alias = `t${idx}`;
    });
  },

  /**
   * セクションに結合条件を追加
   */
  addJoin() {
    if (AppState.sql.selectedTables.length < 2) {
      throw new Error('結合条件を追加するには、2つ以上のテーブルが必要です。');
    }
    // 右側のテーブル
    const rightIdx = AppState.sql.selectedTables.length - 1;
    // 左側のテーブル
    const leftIdx = Math.max(0, rightIdx - 1);

    // 結合条件を生成
    const condition = this.generateDefaultJoinCondition(
      AppState.sql.selectedTables[leftIdx],
      AppState.sql.selectedTables[rightIdx]
    );

    // 結合条件を追加
    AppState.sql.joins.push({
      leftAlias: AppState.sql.selectedTables[leftIdx].alias,
      rightAlias: AppState.sql.selectedTables[rightIdx].alias,
      type: 'INNER JOIN',
      condition: condition
    });
  },

  /**
   * 結合条件を更新
   */
  updateJoin(index, key, value) {
    if (AppState.sql.joins[index]) {
      AppState.sql.joins[index][key] = value;
    }
  },

  /**
   * 結合条件を削除
   */
  removeJoin(index) {
    AppState.sql.joins.splice(index, 1);
  },

  /**
   * 結合条件を移動
   */
  moveJoin(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= AppState.sql.joins.length) return;
    const item = AppState.sql.joins.splice(index, 1)[0];
    AppState.sql.joins.splice(newIndex, 0, item);
  },

  /**
   * 結合条件を生成
   */
  generateDefaultJoinCondition(leftTableState, rightTableState) {
    const leftDef = AppState.parsedTables.find(t => t.tableName === leftTableState.tableName);
    const rightDef = AppState.parsedTables.find(t => t.tableName === rightTableState.tableName);

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
    AppState.sql.filters.push('');
  },

  updateFilter(index, value) {
    AppState.sql.filters[index] = value;
  },

  removeFilter(index) {
    AppState.sql.filters.splice(index, 1);
  },

  addSort() {
    // 1つ以上のテーブルが選択されているかチェック
    if (AppState.sql.selectedTables.length === 0) return;
    const firstTbl = AppState.sql.selectedTables[0];
    const firstDef = AppState.parsedTables.find(t => t.tableName === firstTbl.tableName);

    // 安全チェック
    if (!firstDef || firstDef.columns.length === 0) return;

    AppState.sql.sorts.push({
      alias: firstTbl.alias,
      column: firstDef.columns[0].colName,
      direction: 'ASC'
    });
  },

  updateSort(index, key, value) {
    // ソートを更新
    const sort = AppState.sql.sorts[index];
    if (!sort) return;
    sort[key] = value;

    // エイリアスが変更された場合、カラムを再設定
    if (key === 'alias') {
      const tblState = AppState.sql.selectedTables.find(t => t.alias === value);
      if (tblState) {
        const def = AppState.parsedTables.find(t => t.tableName === tblState.tableName);
        if (def && def.columns.length > 0) {
          sort.column = def.columns[0].colName;
        }
      }
    }
  },

  removeSort(index) {
    AppState.sql.sorts.splice(index, 1);
  },

  moveSort(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= AppState.sql.sorts.length) return;
    const item = AppState.sql.sorts.splice(index, 1)[0];
    AppState.sql.sorts.splice(newIndex, 0, item);
  },

  generateSql(selectClause) {
    if (AppState.sql.selectedTables.length === 0) return '';

    let sql = 'SELECT\n';
    sql += selectClause || '*';
    sql += '\nFROM\n';

    const first = AppState.sql.selectedTables[0];
    sql += `    ${first.tableName} AS ${first.alias}\n`;

    AppState.sql.joins.forEach(join => {
      const rightTbl = AppState.sql.selectedTables.find(t => t.alias === join.rightAlias);
      const rightName = rightTbl ? rightTbl.tableName : '???';
      sql += `${join.type} ${rightName} AS ${join.rightAlias} ON ${join.condition}\n`;
    });

    const validFilters = AppState.sql.filters.filter(f => f.trim() !== '');
    if (validFilters.length > 0) {
      sql += 'WHERE\n';
      sql += validFilters.map(f => `    ${f}`).join(' AND\n');
      sql += '\n';
    }

    if (AppState.sql.sorts.length > 0) {
      sql += 'ORDER BY\n';
      sql += AppState.sql.sorts.map(s => `    ${s.alias}.${s.column} ${s.direction}`).join(',\n');
      sql += '\n';
    }

    if (AppState.sql.limit && AppState.sql.limit.trim() !== '') {
      sql += `LIMIT ${AppState.sql.limit.trim()}\n`;
    }

    if (AppState.sql.offset && AppState.sql.offset.trim() !== '') {
      sql += `OFFSET ${AppState.sql.offset.trim()}\n`;
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
    if (AppState.sql.selectedTables.length === 0) return autoGenResult;

    // select句が編集されているかチェック
    let defaultSelects = [];
    AppState.sql.selectedTables.forEach(t => {
      const def = AppState.parsedTables.find(table => table.tableName === t.tableName);
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
    const javaFiles = generateJavaSql(AppState.sql, AppState.parsedTables, selectClause, isSelectEdited);
    // TypeScriptコード生成
    const tsFiles = generateTsSql(AppState.sql, AppState.parsedTables, selectClause, isSelectEdited);

    // 結果をマージ
    const allFiles = [];

    // SQLファイル
    const sqlContent = this.generateSql(selectClause);
    if (sqlContent && sqlContent.trim() !== '') {
      let baseName = "CustomQuery";
      if (AppState.sql.selectedTables.length === 1) {
        const t = AppState.parsedTables.find(table => table.tableName === AppState.sql.selectedTables[0].tableName);
        if (t) baseName = toPascalCase(t.tableName);
      } else if (AppState.sql.selectedTables.length > 0) {
        const t = AppState.parsedTables.find(table => table.tableName === AppState.sql.selectedTables[0].tableName);
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
