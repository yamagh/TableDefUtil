/**
 * Code generation and Zipping logic
 */
const Zipper = {
  /**
   * Generate ZIP file from tables and options
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
      // Note: We assume the generator functions are globally available or imported
      // For now, adhering to the plan of refactoring converters to return objects
      // but we need to support the current "string" return style until we finish refactoring converters.
      // So this Zipper will implement the logic assuming the NEW style (array of objects),
      // or we handle legacy string returns if we want to do it iteratively.
      // 
      // Plan: We refactor converters NEXT. So this Zipper should expect structured data.

      switch (format) {
        case 'ddl':
          output = generateDDL(tables);
          // DDL usually returns single string. We can wrap it.
          if (typeof output === 'string') {
            zip.file('schema.sql', output);
          } else {
            output.forEach(f => zip.file(f.path, f.content));
          }
          break;
        case 'ddl-play':
          output = generatePlayEvolution(tables);
          // Play Evolution usually goes into conf/evolutions/default/1.sql or similar.
          // For the ZIP, we'll just put it in evolutions/1.sql
          if (typeof output === 'string') {
            zip.file('evolutions/1.sql', output);
          } else {
            output.forEach(f => zip.file(f.path, f.content));
          }
          break;
        case 'typescript':
          output = generateTypeScript(tables);
          if (typeof output === 'string') zip.file('entities.ts', output);
          else output.forEach(f => zip.file(f.path, f.content));
          break;
        case 'zod-schema':
          output = generateZodSchema(tables);
          if (typeof output === 'string') zip.file('schemas.ts', output);
          else output.forEach(f => zip.file(f.path, f.content));
          break;
        case 'zod-type':
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

          // Handle both legacy string (split by // --- FileName:) and new object array
          if (typeof output === 'string') {
            const files = output.split('// --- FileName: ');
            files.forEach(fileContent => {
              if (fileContent.trim() === '') return;
              const firstLineEnd = fileContent.indexOf(' ---\n');
              const fileName = fileContent.substring(0, firstLineEnd).trim();
              const content = fileContent.substring(firstLineEnd + 5);

              let path = '';
              // Note: This path logic was in main.js. We should ideally move it to the converter itself.
              // But for legacy string support we keep it here or assume the converter handles it?
              // The plan says converters will return { path: ..., content: ... }.
              // So if we see an array, we trust the path.

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
