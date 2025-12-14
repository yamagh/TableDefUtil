/**
 * コード生成とZIPファイル生成のロジック
 */
const Zipper = {
  /**
   * テーブルとオプションからZIPファイルを生成
   * @param {Array} tables Parsed tables
   * @param {Array} formats List of formats to generate
   * @param {Object} rlsOptions RLS options
   * @returns {Promise<Blob>} ZIP file blob
   */
  async generateZip(tables, formats, rlsOptions) {
    if (typeof JSZip === 'undefined') {
      console.error('JSZip is not loaded');
      throw new Error('JSZip is not loaded');
    }
    const zip = new JSZip();

    formats.forEach(format => {
      let output;
      // コンバータがグローバルにロードされていることを前提

      switch (format) {
        case 'ddl':
          // 通常の DDL を返す
          output = generateDDL(tables);
          if (typeof output === 'string') {
            zip.file('schema.sql', output);
          } else {
            output.forEach(f => zip.file(f.path, f.content));
          }
          break;
        case 'ddl-play':
          // Play Evolution 用の DDL を返す
          output = generatePlayEvolution(tables);
          if (typeof output === 'string') {
            zip.file('evolutions/1.sql', output);
          } else {
            output.forEach(f => zip.file(f.path, f.content));
          }
          break;
        case 'typescript':
          // TypeScript を返す
          output = generateTypeScript(tables);
          if (typeof output === 'string') zip.file('entities.ts', output);
          else output.forEach(f => zip.file(f.path, f.content));
          break;
        case 'zod-schema':
          // Zod スキーマを返す
          output = generateZodSchema(tables);
          if (typeof output === 'string') zip.file('schemas.ts', output);
          else output.forEach(f => zip.file(f.path, f.content));
          break;
        case 'zod-type':
          // Zod 型を返す
          output = generateZodType(tables);
          if (typeof output === 'string') zip.file('zod-types.ts', output);
          else output.forEach(f => zip.file(f.path, f.content));
          break;
        case 'java-model':
        case 'java-repo':
        case 'java-service':
        case 'java-controller':
          if (format === 'java-model') output = generateJavaModel(tables, rlsOptions);
          else if (format === 'java-repo') output = generateJavaRepo(tables, rlsOptions);
          else if (format === 'java-controller') output = generateJavaController(tables, rlsOptions);
          else output = generateJavaService(tables, rlsOptions);

          if (typeof output === 'string') {
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
          } else if (Array.isArray(output)) {
            // New structure
            output.forEach(f => {
              zip.file(f.path, f.content);
            });
          }
          break;
      }
    });

    return zip.generateAsync({ type: "blob" });
  }
};
