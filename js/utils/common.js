/**
 * ファイルダウンロード処理
 */
function downloadFile(content, fileName) {
  const blob = (content instanceof Blob) ? content : new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 文字列をPascalCaseに変換
 */
function toPascalCase(s) {
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

/**
 * 文字列をcamelCaseに変換
 */
function toCamelCase(s) {
  const pascal = toPascalCase(s);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
