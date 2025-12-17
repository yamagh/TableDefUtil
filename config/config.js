window.AppConfig = {
  "theme": "auto",
  "preview": {
    "defaultVisibleColumns": [
      "colNameJP",
      "colName",
      "pkfk",
      "type",
      "length",
      "constraint"
    ]
  },
  "export": {
    "defaultFormats": [
      "ddl",
      "ddl-play",
      "typescript",
      "zod-schema",
      "zod-type",
      "java-model",
      "java-repo",
      "java-service",
      "java-controller"
    ],
    "rls": {
      "enabled": false,
      "tenantIdColumn": "tenant_id",
      "adminFlagColumn": "is_admin"
    }
  },
  "sql": {
    "includeCountMethod": true
  }
};
