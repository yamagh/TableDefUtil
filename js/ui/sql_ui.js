/**
 * SQL Builder UI
 */
const SqlUi = {
  elements: {
    tableSelect: null,
    selectedTables: null,
    joinsContainer: null,
    filtersContainer: null,
    sortsContainer: null,
    selectClause: null,
    output: null,
    section: null,
    resultContainer: null,
    resultTabs: null,
    resultContents: null,
    downloadBtn: null,
    limitInput: null,
    offsetInput: null
  },

  init() {
    this.elements.tableSelect = document.getElementById('sql-table-select');
    this.elements.selectedTables = document.getElementById('sql-selected-tables');
    this.elements.joinsContainer = document.getElementById('sql-joins-container');
    this.elements.filtersContainer = document.getElementById('sql-filters-container');
    this.elements.sortsContainer = document.getElementById('sql-sorts-container');
    this.elements.selectClause = document.getElementById('sql-select-clause');
    this.elements.output = document.getElementById('sql-output');
    this.elements.section = document.getElementById('sql-builder-section');
    this.elements.resultContainer = document.getElementById('sql-java-result-container');
    this.elements.resultTabs = document.getElementById('sql-java-tabs');
    this.elements.resultContents = document.getElementById('sql-java-contents');
    this.elements.downloadBtn = document.getElementById('sql-java-download-btn');
    this.elements.limitInput = document.getElementById('sql-limit');
    this.elements.offsetInput = document.getElementById('sql-offset');

    this.attachListeners();
  },

  attachListeners() {
    document.getElementById('sql-add-table-btn').addEventListener('click', () => {
      const tableName = this.elements.tableSelect.value;
      if (!tableName) return;
      SqlLogic.addTable(tableName);
      this.render();
    });

    document.getElementById('sql-add-join-btn').addEventListener('click', () => {
      try {
        SqlLogic.addJoin();
        this.render();
      } catch (e) {
        alert(e.message);
      }
    });

    document.getElementById('sql-add-filter-btn').addEventListener('click', () => {
      SqlLogic.addFilter();
      this.render();
    });

    document.getElementById('sql-add-sort-btn').addEventListener('click', () => {
      SqlLogic.addSort();
      this.render();
    });

    // Expose remove/move functions to global scope for inline onclick handlers (or rewrite them to delegators)
    // Rewriting to delegators is cleaner but might be too much change. 
    // For now, I'll attach handlers to window as in original code, but pointing to this UI.
    window.removeSqlTable = (idx) => { SqlLogic.removeTable(idx); this.render(); };
    window.moveSqlTable = (idx, dir) => { SqlLogic.moveTable(idx, dir); this.render(); };

    window.updateSqlJoin = (idx, key, val) => { SqlLogic.updateJoin(idx, key, val); this.updateOutput(); };
    window.removeSqlJoin = (idx) => { SqlLogic.removeJoin(idx); this.render(); };
    window.moveSqlJoin = (idx, dir) => { SqlLogic.moveJoin(idx, dir); this.render(); };

    window.updateSqlFilter = (idx, val) => { SqlLogic.updateFilter(idx, val); this.updateOutput(); };
    window.removeSqlFilter = (idx) => { SqlLogic.removeFilter(idx); this.render(); };

    window.updateSqlSort = (idx, key, val) => {
      SqlLogic.updateSort(idx, key, val);
      if (key === 'alias') this.render(); // Full render if alias changes (affects columns)
      else this.updateOutput();
    };
    window.removeSqlSort = (idx) => { SqlLogic.removeSort(idx); this.render(); };
    window.moveSqlSort = (idx, dir) => { SqlLogic.moveSort(idx, dir); this.render(); };

    // Update SQL when select clause changes
    // Note: original code used oninput="updateSqlOutput()" in HTML
    // We should ensure that still works or replace it.
    // Ideally we remove inline handlers.
    // Let's add listener here.
    if (this.elements.selectClause) {
      this.elements.selectClause.addEventListener('input', () => this.updateOutput());
    }

    if (this.elements.limitInput) {
      this.elements.limitInput.addEventListener('input', () => this.updateOutput());
    }
    if (this.elements.offsetInput) {
      this.elements.offsetInput.addEventListener('input', () => this.updateOutput());
    }

    // Expose updateSqlOutput to window if used by index.html
    window.updateSqlOutput = () => this.updateOutput();
  },

  reset() {
    AppState.resetSqlState();
    if (this.elements.limitInput) this.elements.limitInput.value = '';
    if (this.elements.offsetInput) this.elements.offsetInput.value = '';
    this.elements.tableSelect.innerHTML = '<option value="">テーブルを追加...</option>';
    AppState.parsedTables.forEach(table => {
      const option = document.createElement('option');
      option.value = table.tableName;
      option.textContent = `${table.tableName} (${table.tableNameJP})`;
      this.elements.tableSelect.appendChild(option);
    });
    this.elements.section.style.display = 'block';
    this.render();
  },

  render() {
    this.renderTables();
    this.renderJoins();
    this.renderFilters();
    this.renderSorts();
    this.updateSelectColumns(); // This updates the textarea value
    this.updateOutput(); // This generates SQL from textarea and state
  },

  renderTables() {
    this.elements.selectedTables.innerHTML = '';
    AppState.sql.selectedTables.forEach((item, index) => {
      // Aliases are already refreshed in logic
      const def = AppState.parsedTables.find(t => t.tableName === item.tableName);
      const tableNameJP = def ? def.tableNameJP : '';

      const tr = document.createElement('tr');
      tr.innerHTML = `
              <td>${item.alias}</td>
              <td style="width: 100%;">${item.tableName} (${tableNameJP})</td>
              <td>
                <div role="group" style="width: auto; margin: 0;">
                  <button class="outline secondary btn-sm" onclick="moveSqlTable(${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
                  <button class="outline secondary btn-sm" onclick="moveSqlTable(${index}, 1)" ${index === AppState.sql.selectedTables.length - 1 ? 'disabled' : ''}>↓</button>
                  <button class="outline contrast btn-sm btn-danger"" onclick="removeSqlTable(${index})" title="削除">x</button>
                </div>
              </td>
            `;
      this.elements.selectedTables.appendChild(tr);
    });
  },

  renderJoins() {
    this.elements.joinsContainer.innerHTML = '';
    AppState.sql.joins.forEach((join, index) => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.alignItems = 'start';
      div.style.gap = '10px';
      div.style.marginTop = '0.5rem';

      const leftOptions = AppState.sql.selectedTables.map(t => `<option value="${t.alias}" ${t.alias === join.leftAlias ? 'selected' : ''}>${t.alias}</option>`).join('');
      const rightOptions = AppState.sql.selectedTables.map(t => `<option value="${t.alias}" ${t.alias === join.rightAlias ? 'selected' : ''}>${t.alias}</option>`).join('');

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
                <button class="outline secondary btn-sm" onclick="moveSqlJoin(${index}, 1)" ${index === AppState.sql.joins.length - 1 ? 'disabled' : ''}>↓</button>
                <button class="outline contrast btn-sm btn-danger" onclick="removeSqlJoin(${index})" title="削除">x</button>
              </div>
            `;
      this.elements.joinsContainer.appendChild(div);
    });
  },

  renderFilters() {
    this.elements.filtersContainer.innerHTML = '';
    AppState.sql.filters.forEach((filter, index) => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.gap = '10px';
      div.style.marginBottom = '5px';
      div.style.alignItems = 'center';
      div.innerHTML = `
           <textarea onchange="updateSqlFilter(${index}, this.value)" placeholder="例: t0.id > 100" style="field-sizing: content; flex-grow:1; height: auto; min-height: 2rem; resize: vertical; padding: 0.25rem; margin: 0;">${filter}</textarea>
           <button class="outline contrast btn-sm btn-danger" onclick="removeSqlFilter(${index})" title="削除">x</button>
        `;
      this.elements.filtersContainer.appendChild(div);
    });
  },

  renderSorts() {
    this.elements.sortsContainer.innerHTML = '';
    AppState.sql.sorts.forEach((sort, index) => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.gap = '10px';
      div.style.marginBottom = '5px';
      div.style.alignItems = 'center';

      const aliasOptions = AppState.sql.selectedTables.map(t => `<option value="${t.alias}" ${t.alias === sort.alias ? 'selected' : ''}>${t.alias}</option>`).join('');

      const tblState = AppState.sql.selectedTables.find(t => t.alias === sort.alias);
      let colOptions = '';
      if (tblState) {
        const def = AppState.parsedTables.find(t => t.tableName === tblState.tableName);
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
            <button class="outline secondary btn-sm" onclick="moveSqlSort(${index}, 1)" ${index === AppState.sql.sorts.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="outline contrast btn-sm btn-danger" onclick="removeSqlSort(${index})" title="削除">x</button>
          </div>
        `;
      this.elements.sortsContainer.appendChild(div);
    });
  },

  updateSelectColumns() {
    const selects = [];
    AppState.sql.selectedTables.forEach(t => {
      const def = AppState.parsedTables.find(table => table.tableName === t.tableName);
      if (def) {
        def.columns.forEach(col => {
          selects.push(`${t.alias}.${col.colName} as ${t.alias}_${col.colName}`);
        });
      } else {
        selects.push(`${t.alias}.*`);
      }
    });
    // Try NOT to overwrite if user has customized?
    // Original logic was: renderSqlTables calls updateSelectColumns, which overwrites.
    // So every time we add/remove/move table, we reset select clause.
    // That's acceptable.
    this.elements.selectClause.value = selects.join(',\n');
  },

  updateOutput() {
    if (this.elements.limitInput) AppState.sql.limit = this.elements.limitInput.value;
    if (this.elements.offsetInput) AppState.sql.offset = this.elements.offsetInput.value;
    const sql = SqlLogic.generateSql(this.elements.selectClause.value);
    if (this.elements.output && this.elements.output.tagName === 'DIV') {
      // if using a div/highlighting
      this.elements.output.textContent = sql;
    } else {
      this.elements.output.value = sql;
    }
    this.renderAutoCode();
  },

  renderAutoCode() {
    if (!this.elements.output.value) {
      this.elements.resultContainer.style.display = 'none';
      return;
    }

    const files = SqlLogic.generateAutoCode(this.elements.selectClause.value);
    if (!files || files.length === 0) {
      this.elements.resultContainer.style.display = 'none';
      return;
    }

    this.elements.resultContainer.style.display = 'block';
    this.elements.resultTabs.innerHTML = '';
    this.elements.resultContents.innerHTML = '';

    let isFirst = true;

    // files is array of {path, content}
    files.forEach(file => {
      const path = file.path;
      const content = file.content;
      const fileName = path.split('/').pop();

      let label = fileName;
      if (fileName.endsWith('Repository.java')) label = 'Repository';
      else if (fileName.endsWith('Service.java')) label = 'Service';
      else if (fileName.endsWith('Controller.java')) label = 'Controller';
      else if (fileName.endsWith('Dto.java')) label = 'Java DTO';
      else if (fileName.endsWith('.ts')) label = 'TS Type';
      else if (fileName.endsWith('.sql')) label = 'SQL';

      const tabId = 'sql-java-tab-' + fileName.replace(/[^a-zA-Z0-9]/g, '-');

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = label;
      a.title = fileName;
      a.className = isFirst ? 'active' : '';
      a.dataset.target = tabId;

      a.addEventListener('click', (e) => {
        e.preventDefault();
        this.elements.resultTabs.querySelectorAll('a').forEach(el => el.classList.remove('active'));
        e.target.classList.add('active');
        this.elements.resultContents.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
        document.getElementById(tabId).style.display = 'block';
      });

      li.appendChild(a);
      this.elements.resultTabs.appendChild(li);

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
      this.elements.resultContents.appendChild(div);

      isFirst = false;
    });

    // Setup download button
    const newDownloadBtn = this.elements.downloadBtn.cloneNode(true);
    this.elements.downloadBtn.parentNode.replaceChild(newDownloadBtn, this.elements.downloadBtn);
    this.elements.downloadBtn = newDownloadBtn;

    this.elements.downloadBtn.addEventListener('click', () => {
      if (typeof JSZip === 'undefined') {
        console.error('JSZip is not loaded');
        return;
      }
      const zip = new JSZip();
      files.forEach(f => zip.file(f.path, f.content));

      zip.generateAsync({ type: "blob" })
        .then(function (content) {
          const now = (d => { d.setHours(d.getHours() + 9); return d.toISOString().slice(0, 19).replace('T', '-').replace(/:/g, '') })(new Date())
          downloadFile(content, `sql-generated-code-${now}.zip`);
        });
    });
  }
};
