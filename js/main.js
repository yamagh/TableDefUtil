// --- Main Logic ---

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  const textInput = document.getElementById('textInput');
  const convertBtn = document.getElementById('convertBtn');
  const resultTabs = document.getElementById('result-tabs');
  const resultContents = document.getElementById('result-contents');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const rlsEnabled = document.getElementById('rlsEnabled');
  const rlsOptions = document.getElementById('rlsOptions');

  rlsEnabled.addEventListener('change', () => {
    rlsOptions.style.display = rlsEnabled.checked ? 'block' : 'none';
  });

  // --- Tab UI ---
  document.querySelectorAll('.tab-link').forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      const targetId = e.target.dataset.tab;

      // Handle input tabs
      if (e.target.closest('.tabs').nextElementSibling.id.includes('input')) {
        document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(content => {
          if (content.id === targetId) {
            content.classList.add('active');
          } else {
            content.classList.remove('active');
          }
        });
      }
      // Handle result tabs
      else {
        document.querySelectorAll('#result-tabs .tab-link').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        document.querySelectorAll('#result-contents .tab-content').forEach(content => {
          if (content.id === `result-${targetId}`) {
            content.classList.add('active');
          } else {
            content.classList.remove('active');
          }
        });
      }
    });
  });

  convertBtn.addEventListener('click', () => {
    const activeInputTab = document.querySelector('.tab-link.active').dataset.tab;
    if (activeInputTab === 'file-input' && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        parseAndConvert(e.target.result);
      };
      reader.readAsText(file);
    } else if (activeInputTab === 'text-input' && textInput.value.trim() !== '') {
      parseAndConvert(textInput.value);
    } else {
      alert('入力データがありません。');
    }
  });

  downloadAllBtn.addEventListener('click', () => {
    // JSZip must be loaded globally
    if (typeof JSZip === 'undefined') {
      console.error('JSZip is not loaded');
      return;
    }
    const zip = new JSZip();
    const formats = Array.from(document.querySelectorAll('input[name="format"]:checked')).map(cb => cb.value);

    const activeInputTab = document.querySelector('.tab-link.active').dataset.tab;
    let tsvData = '';
    if (activeInputTab === 'file-input' && fileInput.files.length > 0) {
      // 非同期処理のため、readerのonload内で処理する必要がある
      const reader = new FileReader();
      reader.onload = (e) => {
        proceedWithZipping(e.target.result);
      };
      reader.readAsText(fileInput.files[0]);
      return; // ここで終了し、readerによってproceedWithZippingが呼び出される
    } else if (activeInputTab === 'text-input' && textInput.value.trim() !== '') {
      tsvData = textInput.value;
    } else {
      alert('入力データがありません。');
      return;
    }
    proceedWithZipping(tsvData);

    function proceedWithZipping(data) {
      Papa.parse(data, {
        header: true,
        skipEmptyLines: true,
        delimiter: '\t',
        complete: (results) => {
          if (results.errors.length > 0) {
            alert('CSV/TSVのパースに失敗しました。');
            return;
          }
          const tables = transformToIntermediate(results.data);
          const rlsOptions = {
            enabled: document.getElementById('rlsEnabled')?.checked,
            tenantIdColumn: document.getElementById('tenantIdColumn')?.value,
            adminFlagColumn: document.getElementById('adminFlagColumn')?.value
          };

          formats.forEach(format => {
            let output = '';
            switch (format) {
              case 'ddl':
                output = generateDDL(tables);
                zip.file('schema.sql', output);
                break;
              case 'typescript':
                output = generateTypeScript(tables);
                zip.file('entities.ts', output);
                break;
              case 'zod-schema':
                output = generateZodSchema(tables);
                zip.file('schemas.ts', output);
                break;
              case 'zod-type':
                output = generateZodType(tables);
                zip.file('zod-types.ts', output);
                break;
              case 'java-model':
              case 'java-repo':
              case 'java-service':
              case 'java-controller':
                output = format === 'java-model' ? generateJavaModel(tables, rlsOptions) :
                  format === 'java-repo' ? generateJavaRepo(tables, rlsOptions) :
                    format === 'java-controller' ? generateJavaController(tables, rlsOptions) :
                      generateJavaService(tables, rlsOptions);

                const files = output.split('// --- FileName: ');
                files.forEach(fileContent => {
                  if (fileContent.trim() === '') return;
                  const firstLineEnd = fileContent.indexOf(' ---\n');
                  const fileName = fileContent.substring(0, firstLineEnd).trim();
                  const content = fileContent.substring(firstLineEnd + 5);

                  let path = '';
                  if (format === 'java-model') path = 'models/';
                  else if (format === 'java-repo') path = 'repository/';
                  else if (format === 'java-service') path = 'services/';
                  else if (format === 'java-controller') path = 'controllers/api/';

                  zip.file(path + fileName, content.trim());
                });
                break;
            }
          });

          zip.generateAsync({ type: "blob" })
            .then(function (content) {
              const now = (d => { d.setHours(d.getHours() + 9); return d.toISOString().slice(0, 19).replace('T', '-').replace(/:/g, '') })(new Date())
              downloadFile(content, `table-definitions-${now}.zip`);
            });
        }
      });
    }
  });

});

/**
 * 各フォーマットのコード生成
 */
function generateOutputs(tables, rlsOptions) {
  const resultTabs = document.getElementById('result-tabs');
  const resultContents = document.getElementById('result-contents');
  const downloadAllBtn = document.getElementById('downloadAllBtn');

  resultTabs.innerHTML = '';
  resultContents.innerHTML = '';
  downloadAllBtn.style.display = 'block';

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

    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = `${format.toUpperCase()} をダウンロード`;
    downloadBtn.addEventListener('click', () => downloadFile(textArea.value, `output.${format}`));

    // スタブ関数を使用してコンテンツを生成
    let output = '';
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
    textArea.value = output;

    content.appendChild(downloadBtn);
    content.appendChild(textArea);
    resultContents.appendChild(content);

    firstTab = false;
  });

  // 結果タブのクリックリスナーを再追加
  document.querySelectorAll('#result-tabs .tab-link').forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      const targetId = e.target.dataset.tab;
      document.querySelectorAll('#result-tabs .tab-link').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      document.querySelectorAll('#result-contents .tab-content').forEach(c => {
        c.classList.toggle('active', c.id === `result-${targetId}`);
      });
    });
  });
}
