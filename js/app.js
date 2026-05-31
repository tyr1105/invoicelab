/**
 * InvoiceLab - 主应用逻辑 & 标签页导航
 */

const App = {
  currentTab: 'create',

  init() {
    this.bindTabs();
    this.bindGlobalEvents();
    // 恢复上次状态
    const saved = Storage.get('invoicelab_last_tab');
    if (saved && document.getElementById(`tab-${saved}`)) {
      this.switchTab(saved);
    }
  },

  bindTabs() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.currentTarget.dataset.tab;
        this.switchTab(tabName);
      });
    });
  },

  switchTab(tabName) {
    this.currentTab = tabName;
    // 更新标签高亮
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    // 切换内容区
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
    // 保存状态
    Storage.set('invoicelab_last_tab', tabName);

    // 按需初始化
    if (tabName === 'clients') Clients.render();
    if (tabName === 'history') History.render();
    if (tabName === 'templates') Templates.render();
    if (tabName === 'settings') Settings.render();
  },

  bindGlobalEvents() {
    // 升级横幅关闭
    const banner = document.getElementById('pro-banner');
    if (banner) {
      const closeBtn = banner.querySelector('.banner-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          banner.style.display = 'none';
        });
      }
    }

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          Invoice.saveDraft();
        }
        if (e.key === 'p') {
          e.preventDefault();
          PDFExport.exportPDF();
        }
      }
    });
  },

  // 工具函数：生成UUID
  uuid() {
    return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
      Math.floor(Math.random() * 16).toString(16)
    );
  },

  // 格式化货币
  formatCurrency(amount, currency = 'CNY') {
    const symbols = {
      USD: '$', EUR: '€', CNY: '¥', HKD: 'HK$', GBP: '£', JPY: '¥'
    };
    const symbol = symbols[currency] || '¥';
    return `${symbol}${parseFloat(amount || 0).toFixed(2)}`;
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  },

  // 显示提示
  toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
};
