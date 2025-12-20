const Navigation = {
  props: {
    currentMode: String,
    hasData: Boolean,
    theme: String,
    fontSize: String
  },
  emits: ['update:mode', 'toggle-theme', 'update:font-size'],
  setup(props, { emit }) {
    const navItems = [
      { id: 'input', label: '入力', icon: 'bi-pencil-square', alwaysEnabled: true },
      { id: 'preview', label: '定義プレビュー', icon: 'bi-table', alwaysEnabled: false },
      { id: 'scaffolding', label: '雛形生成', icon: 'bi-code-square', alwaysEnabled: false },
      { id: 'sql', label: 'SQL生成', icon: 'bi-database', alwaysEnabled: false },
      { id: 'config', label: '設定', icon: 'bi-gear', alwaysEnabled: true },
    ];

    const selectMode = (mode) => {
      const item = navItems.find(i => i.id === mode);
      if (item && (item.alwaysEnabled || props.hasData)) {
        emit('update:mode', mode);
      }
    };

    return {
      navItems,
      selectMode
    };
  },
  template: `
    <nav class="container-fluid fixed-nav">
      <ul>
        <li><strong>TableDefUtil</strong></li>
      </ul>
      <ul>
        <li v-for="item in navItems" :key="item.id">
          <a href="#" 
             :class="{ 'contrast': currentMode !== item.id, 'active-nav-item': currentMode === item.id, 'disabled': !item.alwaysEnabled && !hasData }"
             @click.prevent="selectMode(item.id)"
             :aria-disabled="!item.alwaysEnabled && !hasData"
             role="button"
             class="outline"
             style="border: none;"
          >
            <i :class="'bi ' + item.icon"></i>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        </li>
      </ul>
      <ul>
        <li>
          <select 
            :value="fontSize" 
            @change="$emit('update:font-size', $event.target.value)" 
            class="select-sm"
            style="margin-bottom: 0; width: auto;"
          >
            <option value="80%">80%</option>
            <option value="90%">90%</option>
            <option value="100%">100%</option>
            <option value="110%">110%</option>
            <option value="125%">125%</option>
          </select>
        </li>
        <li>
          <button class="outline secondary btn-sm" @click="$emit('toggle-theme')" style="border: none;">
            <i v-if="theme === 'light'" class="bi bi-moon-fill"></i>
            <i v-else class="bi bi-sun-fill"></i>
          </button>
        </li>
      </ul>
    </nav>
  `
};
