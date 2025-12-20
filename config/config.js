window.AppConfig = {
  "theme": "auto",
  "fontSize": "100%",
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
  },
  "commonColumns": {
    "id": "id",
    "created_at": "created_at",
    "created_by": "created_by",
    "updated_at": "updated_at",
    "updated_by": "updated_by",
    "is_deleted": {
      "name": "is_deleted",
      "type": "boolean",
      "valTrue": true,
      "valFalse": false
    }
  }
};
