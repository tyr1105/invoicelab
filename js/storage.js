/**
 * InvoiceLab - 本地存储管理模块
 * 封装 localStorage 操作，提供统一的数据持久化接口
 */

const Storage = {
  KEYS: {
    CLIENTS: 'invoicelab_clients',
    INVOICES: 'invoicelab_invoices',
    SETTINGS: 'invoicelab_settings',
    TEMPLATE: 'invoicelab_template',
    DRAFT: 'invoicelab_draft',
    INVOICE_COUNTER: 'invoicelab_counter',
  },

  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  },

  // 客户管理
  getClients() {
    return this.get(this.KEYS.CLIENTS) || [];
  },

  saveClient(client) {
    const clients = this.getClients();
    const idx = clients.findIndex(c => c.id === client.id);
    if (idx >= 0) {
      clients[idx] = client;
    } else {
      clients.push(client);
    }
    this.set(this.KEYS.CLIENTS, clients);
    return client;
  },

  deleteClient(id) {
    const clients = this.getClients().filter(c => c.id !== id);
    this.set(this.KEYS.CLIENTS, clients);
  },

  // 发票管理
  getInvoices() {
    return this.get(this.KEYS.INVOICES) || [];
  },

  saveInvoice(invoice) {
    const invoices = this.getInvoices();
    const idx = invoices.findIndex(i => i.id === invoice.id);
    if (idx >= 0) {
      invoices[idx] = invoice;
    } else {
      invoices.push(invoice);
    }
    this.set(this.KEYS.INVOICES, invoices);
    return invoice;
  },

  deleteInvoice(id) {
    const invoices = this.getInvoices().filter(i => i.id !== id);
    this.set(this.KEYS.INVOICES, invoices);
  },

  // 草稿
  getDraft() {
    return this.get(this.KEYS.DRAFT);
  },

  saveDraft(draft) {
    this.set(this.KEYS.DRAFT, draft);
  },

  clearDraft() {
    this.remove(this.KEYS.DRAFT);
  },

  // 设置
  getSettings() {
    return this.get(this.KEYS.SETTINGS) || {
      companyName: '',
      address: '',
      email: '',
      phone: '',
      logo: '',
      currency: 'CNY',
      taxRate: 0,
      paymentTerms: '请于发票日期后30天内付款。',
      invoicePrefix: 'INV-',
      invoiceStart: 1000,
    };
  },

  saveSettings(settings) {
    this.set(this.KEYS.SETTINGS, settings);
  },

  // 模板
  getTemplate() {
    return this.get(this.KEYS.TEMPLATE) || 'modern';
  },

  saveTemplate(template) {
    this.set(this.KEYS.TEMPLATE, template);
  },

  // 发票编号计数器
  getNextInvoiceNumber() {
    const settings = this.getSettings();
    const counter = this.get(this.KEYS.INVOICE_COUNTER) || settings.invoiceStart || 1000;
    const num = counter;
    this.set(this.KEYS.INVOICE_COUNTER, num + 1);
    return `${settings.invoicePrefix || 'INV-'}${String(num).padStart(4, '0')}`;
  },

  getCurrentCounter() {
    return this.get(this.KEYS.INVOICE_COUNTER) || 1000;
  },

  // 导出所有数据
  exportAll() {
    return {
      clients: this.getClients(),
      invoices: this.getInvoices(),
      settings: this.getSettings(),
      template: this.getTemplate(),
      counter: this.getCurrentCounter(),
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };
  },

  // 导入所有数据
  importAll(data) {
    if (data.clients) this.set(this.KEYS.CLIENTS, data.clients);
    if (data.invoices) this.set(this.KEYS.INVOICES, data.invoices);
    if (data.settings) this.set(this.KEYS.SETTINGS, data.settings);
    if (data.template) this.set(this.KEYS.TEMPLATE, data.template);
    if (data.counter) this.set(this.KEYS.INVOICE_COUNTER, data.counter);
  },

  // 清除所有数据
  clearAll() {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};
