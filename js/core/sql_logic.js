/**
 * SQL Construction Logic
 */
const SqlLogic = {
  /**
   * Add a table to selection
   */
  addTable(tableName) {
    const alias = `t${AppState.sql.selectedTables.length}`;
    AppState.sql.selectedTables.push({ tableName, alias });
    return AppState.sql.selectedTables;
  },

  removeTable(index) {
    AppState.sql.selectedTables.splice(index, 1);
    // Re-assign aliases
    AppState.sql.selectedTables.forEach((item, idx) => {
      item.alias = `t${idx}`;
    });
  },

  moveTable(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= AppState.sql.selectedTables.length) return Promise.resolve(); // or just return
    const item = AppState.sql.selectedTables.splice(index, 1)[0];
    AppState.sql.selectedTables.splice(newIndex, 0, item);
    // Re-assign aliases if we want consistent t0, t1 order? 
    // The original code did re-assign aliases on render. 
    // If we want logic to be pure, we should probably do it here or let UI trigger it.
    // Original: renderSqlTables -> item.alias = `t${index}`
    // So moving tables changes their aliases.
    AppState.sql.selectedTables.forEach((item, idx) => {
      item.alias = `t${idx}`;
    });
  },

  addJoin() {
    if (AppState.sql.selectedTables.length < 2) {
      throw new Error('At least 2 tables needed for join.');
    }
    const rightIdx = AppState.sql.selectedTables.length - 1;
    const leftIdx = Math.max(0, rightIdx - 1);

    // We need parsedTables to generate condition. Passing from AppState.parsedTables
    const condition = this.generateDefaultJoinCondition(
      AppState.sql.selectedTables[leftIdx],
      AppState.sql.selectedTables[rightIdx]
    );

    AppState.sql.joins.push({
      leftAlias: AppState.sql.selectedTables[leftIdx].alias,
      rightAlias: AppState.sql.selectedTables[rightIdx].alias,
      type: 'INNER JOIN',
      condition: condition
    });
  },

  updateJoin(index, key, value) {
    if (AppState.sql.joins[index]) {
      AppState.sql.joins[index][key] = value;
    }
  },

  removeJoin(index) {
    AppState.sql.joins.splice(index, 1);
  },

  moveJoin(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= AppState.sql.joins.length) return;
    const item = AppState.sql.joins.splice(index, 1)[0];
    AppState.sql.joins.splice(newIndex, 0, item);
  },

  generateDefaultJoinCondition(leftTableState, rightTableState) {
    const leftDef = AppState.parsedTables.find(t => t.tableName === leftTableState.tableName);
    const rightDef = AppState.parsedTables.find(t => t.tableName === rightTableState.tableName);

    if (!leftDef || !rightDef) return '/* Table definition not found */';

    let condition = '';
    const leftCols = leftDef.columns.map(c => c.colName);
    const rightCols = rightDef.columns.map(c => c.colName);

    const commonIdCols = leftCols.filter(c => rightCols.includes(c) && c.includes('_id'));

    if (commonIdCols.length > 0) {
      condition = `${leftTableState.alias}.${commonIdCols[0]} = ${rightTableState.alias}.${commonIdCols[0]}`;
    } else {
      if (leftCols.includes(`${rightTableState.tableName}_id`)) {
        condition = `${leftTableState.alias}.${rightTableState.tableName}_id = ${rightTableState.alias}.id`;
      } else if (rightCols.includes(`${leftTableState.tableName}_id`)) {
        condition = `${leftTableState.alias}.id = ${rightTableState.alias}.${leftTableState.tableName}_id`;
      }
    }

    if (leftCols.includes('is_deleted')) {
      condition += `\nAND ${leftTableState.alias}.is_deleted = false`;
    }
    if (rightCols.includes('is_deleted')) {
      condition += `\nAND ${rightTableState.alias}.is_deleted = false`;
    }

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
    if (AppState.sql.selectedTables.length === 0) return;
    const firstTbl = AppState.sql.selectedTables[0];
    const firstDef = AppState.parsedTables.find(t => t.tableName === firstTbl.tableName);

    // Safety check
    if (!firstDef || firstDef.columns.length === 0) return;

    AppState.sql.sorts.push({
      alias: firstTbl.alias,
      column: firstDef.columns[0].colName,
      direction: 'ASC'
    });
  },

  updateSort(index, key, value) {
    const sort = AppState.sql.sorts[index];
    if (!sort) return;
    sort[key] = value;

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

    // Check if select clause is edited
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

    // Note: we assume generateJavaSql/generateTsSql are global or we import them.
    // Since they are script-loaded, they are global.
    const javaFiles = generateJavaSql(AppState.sql, AppState.parsedTables, selectClause, isSelectEdited);
    const tsFiles = generateTsSql(AppState.sql, AppState.parsedTables, selectClause, isSelectEdited);

    // Merge results. Note that converters now return [{path, content}] array.
    // We need to merge them into a consistent structure for UI or Zip.
    // Let's stick to returning array of files.

    const allFiles = [];

    // Add SQL file
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

    // Add Java and TS files after SQL
    allFiles.push(...javaFiles, ...tsFiles);

    return allFiles;
  }
};
