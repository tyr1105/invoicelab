/**
 * InvoiceLab - 发票创建与管理
 */

const Invoice = {
  lineItems: [{ id: App.uuid(), description: '', quantity: 1, price: 0 }],
  autoSaveTimer: null,

  init() {
    this.bindEvents();
    this.loadDraft();
    this.renderLineItems();
    this.updatePreview();
  },

  bindEvents() {
    // 发件人信息
    document.getElementById('sender-company').addEventListener('input', () => this.autoSave());
    document.getElementById('sender-address').addEventListener('input', () => this.autoSave());
    document.getElementById('sender-email').addEventListener('input', () => this.autoSave());
    document.getElementById('sender-phone').addEventListener('input', () => this.autoSave());
    document.getElementById('logo-upload').addEventListener('change', (e) => this.handleLogo(e));

    // 收件人信息
    document.getElementById('client-name').addEventListener('input', () => this.autoSave());
    document.getElementById('client-company').addEventListener('input', () => this.autoSave());
    document.getElementById('client-address').addEventListener('input', () => this.autoSave());
    document.getElementById('client-email').addEventListener('input', () => this.autoSave());

    // 快速选择客户按钮
    document.getElementById('client-quick-select').addEventListener('click', () => this.showClientPicker());

    // 发票详情
    document.getElementById('invoice-number').addEventListener('input', () => this.autoSave());
    document.getElementById('invoice-date').addEventListener('change', () => this.autoSave());
    document.getElementById('invoice-due-date').addEventListener('change', () => this.autoSave());
    document.getElementById('currency').addEventListener('change', () => this.autoSave());

    // 税率和折扣
    document.getElementById('tax-rate').addEventListener('input', () => { this.calculateTotals(); this.autoSave(); });
    document.getElementById('discount').addEventListener('input', () => { this.calculateTotals(); this.autoSave(); });

    // 备注
    document.getElementById('invoice-notes').addEventListener('input', () => this.autoSave());

    // 操作按钮
    document.getElementById('btn-add-line').addEventListener('click', () => this.addLineItem());
    document.getElementById('btn-save-draft').addEventListener('click', () => this.saveDraft());
    document.getElementById('btn-export-pdf').addEventListener('click', () => PDFExport.exportPDF());
    document.getElementById('btn-print').addEventListener('click', () => window.print());
    document.getElementById('btn-save-invoice').addEventListener('click', () => this.saveInvoice('draft'));

    // 拖拽排序
    this.initDragSort();
  },

  loadDraft() {
    const draft = Storage.getDraft();
    const settings = Storage.getSettings();

    if (draft) {
      document.getElementById('sender-company').value = draft.sender?.companyName || settings.companyName || '';
      document.getElementById('sender-address').value = draft.sender?.address || settings.address || '';
      document.getElementById('sender-email').value = draft.sender?.email || settings.email || '';
      document.getElementById('sender-phone').value = draft.sender?.phone || settings.phone || '';
      if (draft.sender?.logo || settings.logo) {
        this.setLogoPreview(draft.sender?.logo || settings.logo);
      }
      document.getElementById('client-name').value = draft.client?.name || '';
      document.getElementById('client-company').value = draft.client?.company || '';
      document.getElementById('client-address').value = draft.client?.address || '';
      document.getElementById('client-email').value = draft.client?.email || '';
      document.getElementById('invoice-number').value = draft.invoiceNumber || Storage.getNextInvoiceNumber();
      document.getElementById('invoice-date').value = draft.date || new Date().toISOString().split('T')[0];
      document.getElementById('invoice-due-date').value = draft.dueDate || this.getDefaultDueDate();
      document.getElementById('currency').value = draft.currency || settings.currency || 'CNY';
      document.getElementById('tax-rate').value = draft.taxRate ?? settings.taxRate ?? 0;
      document.getElementById('discount').value = draft.discount || 0;
      document.getElementById('invoice-notes').value = draft.notes || settings.paymentTerms || '';
      if (draft.lineItems && draft.lineItems.length > 0) {
        this.lineItems = draft.lineItems;
      }
    } else {
      // 预填默认值
      document.getElementById('sender-company').value = settings.companyName || '';
      document.getElementById('sender-address').value = settings.address || '';
      document.getElementById('sender-email').value = settings.email || '';
      document.getElementById('sender-phone').value = settings.phone || '';
      if (settings.logo) this.setLogoPreview(settings.logo);
      document.getElementById('invoice-number').value = Storage.getNextInvoiceNumber();
      document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0];
      document.getElementById('invoice-due-date').value = this.getDefaultDueDate();
      document.getElementById('currency').value = settings.currency || 'CNY';
      document.getElementById('tax-rate').value = settings.taxRate || 0;
      document.getElementById('invoice-notes').value = settings.paymentTerms || '';
    }
  },

  getDefaultDueDate() {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  },

  handleLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      this.setLogoPreview(base64);
      this.autoSave();
    };
    reader.readAsDataURL(file);
  },

  setLogoPreview(base64) {
    const preview = document.getElementById('logo-preview');
    if (base64) {
      preview.innerHTML = `<img src="${base64}" alt="Logo" style="max-height:60px;max-width:120px;border-radius:6px;">`;
      preview.dataset.logo = base64;
    } else {
      preview.innerHTML = '';
      preview.dataset.logo = '';
    }
  },

  getFormData() {
    return {
      id: this.currentEditId || App.uuid(),
      sender: {
        companyName: document.getElementById('sender-company').value,
        address: document.getElementById('sender-address').value,
        email: document.getElementById('sender-email').value,
        phone: document.getElementById('sender-phone').value,
        logo: document.getElementById('logo-preview').dataset.logo || '',
      },
      client: {
        name: document.getElementById('client-name').value,
        company: document.getElementById('client-company').value,
        address: document.getElementById('client-address').value,
        email: document.getElementById('client-email').value,
      },
      invoiceNumber: document.getElementById('invoice-number').value,
      date: document.getElementById('invoice-date').value,
      dueDate: document.getElementById('invoice-due-date').value,
      currency: document.getElementById('currency').value,
      lineItems: [...this.lineItems],
      taxRate: parseFloat(document.getElementById('tax-rate').value) || 0,
      discount: parseFloat(document.getElementById('discount').value) || 0,
      notes: document.getElementById('invoice-notes').value,
      subtotal: this.getSubtotal(),
      taxAmount: this.getTaxAmount(),
      total: this.getTotal(),
      template: Storage.getTemplate(),
      createdAt: new Date().toISOString(),
      status: 'draft',
    };
  },

  renderLineItems() {
    const container = document.getElementById('line-items-body');
    container.innerHTML = '';
    this.lineItems.forEach((item, index) => {
      const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
      const row = document.createElement('tr');
      row.className = 'line-item-row';
      row.dataset.id = item.id;
      row.draggable = true;
      row.innerHTML = `
        <td class="drag-handle" title="拖拽排序">⠿</td>
        <td><input type="text" class="line-desc" value="${this.escapeHtml(item.description)}" placeholder="项目描述" data-index="${index}"></td>
        <td><input type="number" class="line-qty" value="${item.quantity}" min="0" step="1" data-index="${index}"></td>
        <td><input type="number" class="line-price" value="${item.price}" min="0" step="0.01" data-index="${index}"></td>
        <td class="line-amount">${App.formatCurrency(amount, document.getElementById('currency')?.value)}</td>
        <td><button class="btn-icon btn-remove-line" data-index="${index}" title="删除">✕</button></td>
      `;
      container.appendChild(row);
    });

    // 绑定行内事件
    container.querySelectorAll('.line-desc').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.lineItems[idx].description = e.target.value;
        this.calculateTotals();
        this.autoSave();
      });
    });
    container.querySelectorAll('.line-qty').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.lineItems[idx].quantity = parseFloat(e.target.value) || 0;
        this.calculateTotals();
        this.autoSave();
      });
    });
    container.querySelectorAll('.line-price').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.lineItems[idx].price = parseFloat(e.target.value) || 0;
        this.calculateTotals();
        this.autoSave();
      });
    });
    container.querySelectorAll('.btn-remove-line').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.removeLineItem(idx);
      });
    });

    // 拖拽事件
    container.querySelectorAll('.line-item-row').forEach(row => {
      row.addEventListener('dragstart', (e) => this.handleDragStart(e));
      row.addEventListener('dragover', (e) => this.handleDragOver(e));
      row.addEventListener('drop', (e) => this.handleDrop(e));
      row.addEventListener('dragend', (e) => this.handleDragEnd(e));
    });

    this.calculateTotals();
  },

  addLineItem() {
    this.lineItems.push({ id: App.uuid(), description: '', quantity: 1, price: 0 });
    this.renderLineItems();
    this.autoSave();
  },

  removeLineItem(index) {
    if (this.lineItems.length <= 1) {
      App.toast('至少保留一行项目', 'error');
      return;
    }
    this.lineItems.splice(index, 1);
    this.renderLineItems();
    this.autoSave();
  },

  getSubtotal() {
    return this.lineItems.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
    }, 0);
  },

  getTaxAmount() {
    const rate = parseFloat(document.getElementById('tax-rate')?.value) || 0;
    return this.getSubtotal() * (rate / 100);
  },

  getTotal() {
    const discount = parseFloat(document.getElementById('discount')?.value) || 0;
    return this.getSubtotal() + this.getTaxAmount() - discount;
  },

  calculateTotals() {
    const currency = document.getElementById('currency')?.value || 'CNY';
    const subtotal = this.getSubtotal();
    const taxAmount = this.getTaxAmount();
    const discount = parseFloat(document.getElementById('discount')?.value) || 0;
    const total = subtotal + taxAmount - discount;

    document.getElementById('subtotal-display').textContent = App.formatCurrency(subtotal, currency);
    document.getElementById('tax-amount-display').textContent = App.formatCurrency(taxAmount, currency);
    document.getElementById('total-display').textContent = App.formatCurrency(total, currency);

    // 更新行金额
    document.querySelectorAll('.line-item-row').forEach((row, i) => {
      if (this.lineItems[i]) {
        const amt = (parseFloat(this.lineItems[i].quantity) || 0) * (parseFloat(this.lineItems[i].price) || 0);
        row.querySelector('.line-amount').textContent = App.formatCurrency(amt, currency);
      }
    });

    this.updatePreview();
  },

  // 拖拽排序
  draggedIndex: null,

  initDragSort() {},

  handleDragStart(e) {
    this.draggedIndex = [...e.target.parentElement.children].indexOf(e.target);
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  },

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  },

  handleDrop(e) {
    e.preventDefault();
    const target = e.target.closest('tr');
    if (!target) return;
    const targetIndex = [...target.parentElement.children].indexOf(target);
    if (this.draggedIndex === null || this.draggedIndex === targetIndex) return;
    const [item] = this.lineItems.splice(this.draggedIndex, 1);
    this.lineItems.splice(targetIndex, 0, item);
    this.renderLineItems();
    this.autoSave();
  },

  handleDragEnd(e) {
    e.target.classList.remove('dragging');
    this.draggedIndex = null;
  },

  // 自动保存
  autoSave() {
    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      const data = this.getFormData();
      Storage.saveDraft(data);
      this.updatePreview();
    }, 1000);
  },

  saveDraft() {
    const data = this.getFormData();
    Storage.saveDraft(data);
    App.toast('草稿已保存');
  },

  saveInvoice(status) {
    const data = this.getFormData();
    data.status = status;
    data.updatedAt = new Date().toISOString();
    Storage.saveInvoice(data);
    Storage.clearDraft();
    App.toast('发票已保存');
  },

  // 加载已有发票
  loadInvoice(invoice) {
    this.currentEditId = invoice.id;
    document.getElementById('sender-company').value = invoice.sender?.companyName || '';
    document.getElementById('sender-address').value = invoice.sender?.address || '';
    document.getElementById('sender-email').value = invoice.sender?.email || '';
    document.getElementById('sender-phone').value = invoice.sender?.phone || '';
    this.setLogoPreview(invoice.sender?.logo || '');
    document.getElementById('client-name').value = invoice.client?.name || '';
    document.getElementById('client-company').value = invoice.client?.company || '';
    document.getElementById('client-address').value = invoice.client?.address || '';
    document.getElementById('client-email').value = invoice.client?.email || '';
    document.getElementById('invoice-number').value = invoice.invoiceNumber || '';
    document.getElementById('invoice-date').value = invoice.date || '';
    document.getElementById('invoice-due-date').value = invoice.dueDate || '';
    document.getElementById('currency').value = invoice.currency || 'CNY';
    document.getElementById('tax-rate').value = invoice.taxRate || 0;
    document.getElementById('discount').value = invoice.discount || 0;
    document.getElementById('invoice-notes').value = invoice.notes || '';
    if (invoice.lineItems) {
      this.lineItems = [...invoice.lineItems];
    }
    this.renderLineItems();
    App.switchTab('create');
  },

  // 实时预览
  updatePreview() {
    const preview = document.getElementById('invoice-preview');
    if (!preview) return;
    const data = this.getFormData();
    const template = Storage.getTemplate();
    preview.innerHTML = Templates.renderPreview(data, template);
  },

  // 客户快速选择
  showClientPicker() {
    const clients = Storage.getClients();
    if (clients.length === 0) {
      App.toast('暂无保存的客户，请先在"客户管理"中添加', 'info');
      return;
    }
    const modal = document.getElementById('client-picker-modal');
    const list = document.getElementById('client-picker-list');
    list.innerHTML = '';
    clients.forEach(client => {
      const item = document.createElement('div');
      item.className = 'client-picker-item';
      item.innerHTML = `
        <strong>${this.escapeHtml(client.name)}</strong>
        ${client.company ? `<span class="text2">${this.escapeHtml(client.company)}</span>` : ''}
        ${client.email ? `<span class="text2">${this.escapeHtml(client.email)}</span>` : ''}
      `;
      item.addEventListener('click', () => {
        document.getElementById('client-name').value = client.name || '';
        document.getElementById('client-company').value = client.company || '';
        document.getElementById('client-address').value = client.address || '';
        document.getElementById('client-email').value = client.email || '';
        modal.classList.remove('show');
        this.autoSave();
      });
      list.appendChild(item);
    });
    modal.classList.add('show');
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};

// 发票编辑ID（用于区分新建和编辑）
Invoice.currentEditId = null;
