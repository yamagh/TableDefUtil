const OptionsSection = {
  template: `
    <article>
      <header>2. 変換オプション</header>
      <section>
        <details>
          <summary>変換先フォーマット</summary>
          <fieldset>
            <label v-for="opt in formatOptions" :key="opt.value">
              <input type="checkbox" :value="opt.value" v-model="selectedFormats">
              {{ opt.label }}
            </label>
          </fieldset>
        </details>
        <details>
          <summary>Java RLS (Row-Level Security) オプション</summary>
          <fieldset>
            <label>
              <input type="checkbox" v-model="rls.enabled">
              RLSを有効にする
            </label>
            <div v-if="rls.enabled">
              <label>
                テナントIDカラム名
                <input type="text" v-model="rls.tenantIdColumn">
              </label>
              <label>
                管理者フラグカラム名
                <input type="text" v-model="rls.adminFlagColumn">
              </label>
            </div>
          </fieldset>
        </details>
      </section>
      <footer><button @click="handleConvert" style="width: 100%;">変換実行</button></footer>
    </article>
  `,
  emits: ['convert'],
  setup(props, { emit }) {
    const selectedFormats = Vue.ref([
      'ddl', 'ddl-play', 'typescript', 'zod-schema',
      'zod-type', 'java-model', 'java-repo',
      'java-service', 'java-controller'
    ]);

    const formatOptions = [
      { value: 'ddl', label: 'DDL (PostgreSQL)' },
      { value: 'ddl-play', label: 'DDL (PlayFramework)' },
      { value: 'typescript', label: 'TypeScript type' },
      { value: 'zod-schema', label: 'Zod Schema' },
      { value: 'zod-type', label: 'TypeScript type from Zod' },
      { value: 'java-model', label: 'Java (EBean) model' },
      { value: 'java-repo', label: 'Java repository' },
      { value: 'java-service', label: 'Java service' },
      { value: 'java-controller', label: 'Java controller' }
    ];

    const rls = Vue.reactive({
      enabled: false,
      tenantIdColumn: 'tenant_id',
      adminFlagColumn: 'is_admin'
    });

    const handleConvert = () => {
      emit('convert', {
        formats: selectedFormats.value,
        rls: { ...rls }
      });
    };

    return {
      selectedFormats,
      formatOptions,
      rls,
      handleConvert
    };
  }
};
