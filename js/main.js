// --- Main Logic ---

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const textInput = document.getElementById('textInput');
  const convertBtn = document.getElementById('convertBtn');
  // const downloadAllBtn = document.getElementById('downloadAllBtn'); // Removed as it doesn't exist in HTML
  const rlsEnabled = document.getElementById('rlsEnabled');
  const rlsOptionsEl = document.getElementById('rlsOptions');

  // Initialize SQL UI
  if (typeof SqlUi !== 'undefined') {
    SqlUi.init();
  }

  // Toggle RLS Options
  if (rlsEnabled) {
    rlsEnabled.addEventListener('change', () => {
      rlsOptionsEl.style.display = rlsEnabled.checked ? 'block' : 'none';
    });
  }

  // --- Tab UI ---
  const inputTabs = document.querySelectorAll('a[data-tab="file-input"], a[data-tab="text-input"]');
  inputTabs.forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      const targetId = e.target.dataset.tab;

      inputTabs.forEach(t => t.removeAttribute('aria-current'));
      e.target.setAttribute('aria-current', 'true');

      document.querySelectorAll('.tab-content').forEach(content => {
        if (content.id === 'file-input' || content.id === 'text-input') {
          if (content.id === targetId) {
            content.classList.add('active');
          } else {
            content.classList.remove('active');
          }
        }
      });
    });
  });

  // Convert Button
  if (convertBtn) {
    convertBtn.addEventListener('click', () => {
      const activeTabEl = document.querySelector('a[data-tab="file-input"][aria-current="true"], a[data-tab="text-input"][aria-current="true"]');
      const activeInputTab = activeTabEl ? activeTabEl.dataset.tab : null;

      if (activeInputTab === 'file-input' && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          runConversion(e.target.result);
        };
        reader.readAsText(file);
      } else if (activeInputTab === 'text-input' && textInput.value.trim() !== '') {
        runConversion(textInput.value);
      } else {
        alert('入力データがありません。');
      }
    });
  }

  // Download All Logic (Extracted)
  function executeDownloadAll() {
    if (AppState.parsedTables.length === 0) {
      // Try to parse from input if state is empty
      const activeTabEl = document.querySelector('a[data-tab="file-input"][aria-current="true"], a[data-tab="text-input"][aria-current="true"]');
      const activeInputTab = activeTabEl ? activeTabEl.dataset.tab : null;

      if (activeInputTab === 'file-input' && fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
          handleDownload(e.target.result);
        };
        reader.readAsText(fileInput.files[0]);
      } else if (activeInputTab === 'text-input' && textInput.value.trim() !== '') {
        handleDownload(textInput.value);
      } else {
        alert('入力データがありません。');
      }
    } else {
      // Use existing state
      const formats = Array.from(document.querySelectorAll('input[name="format"]:checked')).map(cb => cb.value);
      const rlsOpts = {
        enabled: document.getElementById('rlsEnabled')?.checked,
        tenantIdColumn: document.getElementById('tenantIdColumn')?.value,
        adminFlagColumn: document.getElementById('adminFlagColumn')?.value
      };
      Zipper.generateZip(AppState.parsedTables, formats, rlsOpts).then(content => {
        const now = (d => { d.setHours(d.getHours() + 9); return d.toISOString().slice(0, 19).replace('T', '-').replace(/:/g, '') })(new Date())
        downloadFile(content, `table-definitions-${now}.zip`);
      });
    }
  }

  function handleDownload(tsvData) {
    Papa.parse(tsvData, {
      header: true,
      skipEmptyLines: true,
      delimiter: '\t',
      complete: (results) => {
        if (results.errors.length > 0) {
          alert('CSV/TSVのパースに失敗しました。');
          return;
        }
        const tables = transformToIntermediate(results.data);
        AppState.parsedTables = tables;

        const formats = Array.from(document.querySelectorAll('input[name="format"]:checked')).map(cb => cb.value);
        const rlsOpts = {
          enabled: document.getElementById('rlsEnabled')?.checked,
          tenantIdColumn: document.getElementById('tenantIdColumn')?.value,
          adminFlagColumn: document.getElementById('adminFlagColumn')?.value
        };

        Zipper.generateZip(tables, formats, rlsOpts).then(content => {
          const now = (d => { d.setHours(d.getHours() + 9); return d.toISOString().slice(0, 19).replace('T', '-').replace(/:/g, '') })(new Date())
          downloadFile(content, `table-definitions-${now}.zip`);
        });
      }
    });
  }

  function runConversion(tsvData) {
    Papa.parse(tsvData, {
      header: true,
      skipEmptyLines: true,
      delimiter: '\t',
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error("CSV Parse Errors:", results.errors);
          alert('CSV/TSVのパースに失敗しました。フォーマットを確認してください。');
          return;
        }
        const tables = transformToIntermediate(results.data);
        AppState.parsedTables = tables;

        // Re-init SQL builder with new tables
        if (typeof SqlUi !== 'undefined') {
          SqlUi.reset();
        }

        const rlsOpts = {
          enabled: document.getElementById('rlsEnabled')?.checked,
          tenantIdColumn: document.getElementById('tenantIdColumn')?.value,
          adminFlagColumn: document.getElementById('adminFlagColumn')?.value
        };

        renderResults(tables, rlsOpts);
      }
    });
  }

  function renderResults(tables, rlsOptions) {
    const resultTabs = document.getElementById('result-tabs');
    const resultContents = document.getElementById('result-contents');

    resultTabs.innerHTML = '';
    resultContents.innerHTML = '';

    const formats = Array.from(document.querySelectorAll('input[name="format"]:checked')).map(cb => cb.value);
    let firstTab = true;

    formats.forEach(format => {
      const tab = document.createElement('li');
      const link = document.createElement('a');
      link.href = '#';
      link.dataset.tab = format;
      link.className = 'tab-link' + (firstTab ? ' active' : '');
      link.textContent = format.toUpperCase();
      tab.appendChild(link);
      resultTabs.appendChild(tab);

      const content = document.createElement('div');
      content.id = `result-${format}`;
      content.className = 'tab-content' + (firstTab ? ' active' : '');

      const textArea = document.createElement('textarea');
      textArea.readOnly = true;

      let output;
      switch (format) {
        case 'ddl': output = generateDDL(tables); break;
        case 'typescript': output = generateTypeScript(tables); break;
        case 'zod-schema': output = generateZodSchema(tables); break;
        case 'zod-type': output = generateZodType(tables); break;
        case 'java-model': output = generateJavaModel(tables, rlsOptions); break;
        case 'java-repo': output = generateJavaRepo(tables, rlsOptions); break;
        case 'java-service': output = generateJavaService(tables, rlsOptions); break;
        case 'java-controller': output = generateJavaController(tables, rlsOptions); break;
      }

      let displayString = '';
      if (Array.isArray(output)) {
        output.forEach(f => {
          displayString += `// --- FileName: ${f.path} ---\n${f.content}\n\n`;
        });
      } else if (typeof output === 'string') {
        displayString = output;
      }

      textArea.value = displayString;
      content.appendChild(textArea);
      resultContents.appendChild(content);

      firstTab = false;
    });

    const tabs = document.querySelectorAll('#result-tabs .tab-link');
    tabs.forEach(tab => {
      tab.addEventListener('click', e => {
        e.preventDefault();
        const targetId = e.target.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        document.querySelectorAll('#result-contents .tab-content').forEach(c => {
          c.classList.toggle('active', c.id === `result-${targetId}`);
        });

        updateResultFooter(targetId);
      });
    });

    if (formats.length > 0) {
      updateResultFooter(formats[0]);
    }
  }

  function updateResultFooter(format) {
    const resultFooter = document.getElementById('result-footer');
    resultFooter.innerHTML = '';

    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = `${format.toUpperCase()} をダウンロード`;
    downloadBtn.className = 'secondary';
    downloadBtn.style.width = '100%';
    downloadBtn.addEventListener('click', () => {
      const textArea = document.querySelector(`#result-${format} textarea`);
      if (textArea) downloadFile(textArea.value, `output.txt`);
    });

    const downloadAllCloneBtn = document.createElement('button');
    downloadAllCloneBtn.textContent = 'すべてダウンロード (ZIP)';
    downloadAllCloneBtn.className = 'primary';
    downloadAllCloneBtn.style.width = '100%';
    downloadAllCloneBtn.addEventListener('click', () => executeDownloadAll());

    const buttonGrid = document.createElement('div');
    buttonGrid.style.display = 'grid';
    buttonGrid.style.gridTemplateColumns = '1fr 1fr';
    buttonGrid.style.gap = '1rem';
    buttonGrid.appendChild(downloadBtn);
    buttonGrid.appendChild(downloadAllCloneBtn);

    resultFooter.appendChild(buttonGrid);
  }
});
