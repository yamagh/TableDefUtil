// Initialize Namespace
window.App = window.App || {};
App.Utils = App.Utils || {};

App.Utils.Common = {
  /**
   * ファイルダウンロード処理
   */
  downloadFile: function(content, fileName) {
    const blob = (content instanceof Blob) ? content : new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * 文字列をPascalCaseに変換
   */
  toPascalCase: function(s) {
    return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  },

  /**
   * 文字列をcamelCaseに変換
   */
  toCamelCase: function(s) {
    const pascal = App.Utils.Common.toPascalCase(s);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }
};

// Backward compat
window.downloadFile = App.Utils.Common.downloadFile;
window.toPascalCase = App.Utils.Common.toPascalCase;
// Ensure context is preserved if used as a method, but here it's utility
window.toCamelCase = function(s) { return App.Utils.Common.toCamelCase(s); }; // bind this for toPascalCase call?
// Actually, App.Utils.Common.toCamelCase calls this.toPascalCase.
// So if I call window.toCamelCase, 'this' will be window. window.toPascalCase exists.
// But usage App.Utils.Common.toCamelCase(s) works because this is App.Utils.Common.
// If I assume toPascalCase is also in App.Utils.Common, I should use `App.Utils.Common.toPascalCase(s)` inside the function?
// Or just `this.toPascalCase` which assumes it's called on the object.
// If I alias `window.toCamelCase = App.Utils.Common.toCamelCase`, `this` will be window.
// And since I aliased `window.toPascalCase`, it will work!
window.toCamelCase = App.Utils.Common.toCamelCase;
