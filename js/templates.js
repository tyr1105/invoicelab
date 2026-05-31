/**
 * InvoiceLab - 模板渲染与选择
 */

const Templates = {
  templates: [
    { id: 'modern', name: '现代简约', desc: '简洁干净，蓝色点缀', icon: '◇' },
    { id: 'classic', name: '经典商务', desc: '传统商务风格，衬线字体', icon: '☷' },
    { id: 'creative', name: '创意彩绘', desc: '色彩丰富，圆润现代', icon: '◉' },
  ],

  render() {
    const current = Storage.getTemplate();
    const container = document.getElementById('templates-grid');
    container.innerHTML = this.templates.map(t => `
      <div class="template-card ${t.id === current ? 'selected' : ''}" data-template="${t.id}">
        <div class="template-preview" id="template-preview-${t.id}">
          ${this.renderMiniPreview(t.id)}
        </div>
        <div class="template-info">
          <h4>${t.icon} ${t.name}</h4>
          <p>${t.desc}</p>
          <button class="btn btn-primary btn-sm" onclick="Templates.select('${t.id}')">
            ${t.id === current ? '✓ 当前选择' : '选择模板'}
          </button>
        </div>
      </div>
    `).join('');
  },

  select(id) {
    Storage.saveTemplate(id);
    this.render();
    Invoice.updatePreview();
    App.toast('模板已切换');
  },

  renderMiniPreview(templateId) {
    const sampleData = {
      sender: { companyName: '示例公司', email: 'info@example.com' },
      client: { name: '客户名称', company: '客户公司' },
      invoiceNumber: 'INV-0001',
      date: '2026-05-31',
      dueDate: '2026-06-30',
      currency: 'CNY',
      lineItems: [
        { description: '网页设计服务', quantity: 1, price: 5000 },
        { description: '前端开发', quantity: 3, price: 3000 },
      ],
      taxRate: 6,
      discount: 500,
      notes: '请于30天内付款，谢谢！',
    };
    sampleData.subtotal = 14000;
    sampleData.taxAmount = 840;
    sampleData.total = 14340;
    return this.renderPreview(sampleData, templateId, true);
  },

  renderPreview(data, templateId = 'modern', mini = false) {
    const t = templateId || 'modern';
    switch (t) {
      case 'modern': return this.renderModern(data, mini);
      case 'classic': return this.renderClassic(data, mini);
      case 'creative': return this.renderCreative(data, mini);
      default: return this.renderModern(data, mini);
    }
  },

  renderModern(data, mini) {
    const sc = mini ? 'font-size:10px;' : '';
    return `
      <div class="tpl tpl-modern" style="${sc}">
        <div class="tpl-header">
          <div class="tpl-sender">
            ${data.sender?.logo ? `<img src="${data.sender.logo}" class="tpl-logo">` : ''}
            <h2>${Invoice.escapeHtml(data.sender?.companyName || '公司名称')}</h2>
            ${data.sender?.email ? `<p>${Invoice.escapeHtml(data.sender.email)}</p>` : ''}
            ${data.sender?.phone ? `<p>${Invoice.escapeHtml(data.sender.phone)}</p>` : ''}
          </div>
          <div class="tpl-invoice-title">
            <h1>发票</h1>
            <p class="text2">${Invoice.escapeHtml(data.invoiceNumber || '')}</p>
          </div>
        </div>
        <div class="tpl-meta">
          <div class="tpl-client">
            <strong>收件人</strong>
            <p>${Invoice.escapeHtml(data.client?.name || '')}</p>
            ${data.client?.company ? `<p>${Invoice.escapeHtml(data.client.company)}</p>` : ''}
          </div>
          <div class="tpl-dates">
            <p><strong>日期：</strong>${data.date || ''}</p>
            <p><strong>到期：</strong>${data.dueDate || ''}</p>
          </div>
        </div>
        <table class="tpl-table">
          <thead><tr><th>描述</th><th>数量</th><th>单价</th><th>金额</th></tr></thead>
          <tbody>
            ${(data.lineItems || []).map(item => `
              <tr>
                <td>${Invoice.escapeHtml(item.description || '-')}</td>
                <td>${item.quantity || 0}</td>
                <td>${App.formatCurrency(item.price, data.currency)}</td>
                <td>${App.formatCurrency((item.quantity || 0) * (item.price || 0), data.currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="tpl-totals">
          <div class="tpl-total-row"><span>小计</span><span>${App.formatCurrency(data.subtotal, data.currency)}</span></div>
          ${data.taxRate ? `<div class="tpl-total-row"><span>税 (${data.taxRate}%)</span><span>${App.formatCurrency(data.taxAmount, data.currency)}</span></div>` : ''}
          ${data.discount ? `<div class="tpl-total-row"><span>折扣</span><span>-${App.formatCurrency(data.discount, data.currency)}</span></div>` : ''}
          <div class="tpl-total-row tpl-grand-total"><span>合计</span><span>${App.formatCurrency(data.total, data.currency)}</span></div>
        </div>
        ${data.notes ? `<div class="tpl-notes"><strong>备注：</strong><p>${Invoice.escapeHtml(data.notes)}</p></div>` : ''}
      </div>
    `;
  },

  renderClassic(data, mini) {
    const sc = mini ? 'font-size:10px;' : '';
    return `
      <div class="tpl tpl-classic" style="${sc}">
        <div class="tpl-header-classic">
          ${data.sender?.logo ? `<img src="${data.sender.logo}" class="tpl-logo">` : ''}
          <div>
            <h2 style="font-family:Georgia,serif;">${Invoice.escapeHtml(data.sender?.companyName || '公司名称')}</h2>
            ${data.sender?.address ? `<p>${Invoice.escapeHtml(data.sender.address)}</p>` : ''}
            ${data.sender?.email ? `<p>${Invoice.escapeHtml(data.sender.email)}</p> | ` : ''}
            ${data.sender?.phone ? `<p>${Invoice.escapeHtml(data.sender.phone)}</p>` : ''}
          </div>
        </div>
        <hr style="border-color:#4a5568;">
        <div style="display:flex;justify-content:space-between;margin:12px 0;">
          <div>
            <strong>账单寄给：</strong>
            <p>${Invoice.escapeHtml(data.client?.name || '')}</p>
            ${data.client?.company ? `<p>${Invoice.escapeHtml(data.client.company)}</p>` : ''}
            ${data.client?.address ? `<p>${Invoice.escapeHtml(data.client.address)}</p>` : ''}
          </div>
          <div style="text-align:right;">
            <h3 style="font-family:Georgia,serif;margin-bottom:8px;">发票</h3>
            <p>编号：${Invoice.escapeHtml(data.invoiceNumber || '')}</p>
            <p>日期：${data.date || ''}</p>
            <p>到期：${data.dueDate || ''}</p>
          </div>
        </div>
        <table class="tpl-table tpl-table-classic">
          <thead><tr><th>描述</th><th>数量</th><th>单价</th><th>金额</th></tr></thead>
          <tbody>
            ${(data.lineItems || []).map(item => `
              <tr>
                <td>${Invoice.escapeHtml(item.description || '-')}</td>
                <td>${item.quantity || 0}</td>
                <td>${App.formatCurrency(item.price, data.currency)}</td>
                <td>${App.formatCurrency((item.quantity || 0) * (item.price || 0), data.currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="tpl-totals tpl-totals-classic">
          <div class="tpl-total-row"><span>小计</span><span>${App.formatCurrency(data.subtotal, data.currency)}</span></div>
          ${data.taxRate ? `<div class="tpl-total-row"><span>税 (${data.taxRate}%)</span><span>${App.formatCurrency(data.taxAmount, data.currency)}</span></div>` : ''}
          ${data.discount ? `<div class="tpl-total-row"><span>折扣</span><span>-${App.formatCurrency(data.discount, data.currency)}</span></div>` : ''}
          <div class="tpl-total-row tpl-grand-total"><span>合计</span><span>${App.formatCurrency(data.total, data.currency)}</span></div>
        </div>
        ${data.notes ? `<div class="tpl-notes"><strong>备注：</strong><p>${Invoice.escapeHtml(data.notes)}</p></div>` : ''}
      </div>
    `;
  },

  renderCreative(data, mini) {
    const sc = mini ? 'font-size:10px;' : '';
    return `
      <div class="tpl tpl-creative" style="${sc}">
        <div class="tpl-header-creative">
          <div>
            ${data.sender?.logo ? `<img src="${data.sender.logo}" class="tpl-logo">` : ''}
            <h2>${Invoice.escapeHtml(data.sender?.companyName || '公司名称')}</h2>
          </div>
          <div class="creative-badge">
            <h1>发票</h1>
            <p>${Invoice.escapeHtml(data.invoiceNumber || '')}</p>
          </div>
        </div>
        <div class="creative-meta">
          <div class="creative-card">
            <p class="creative-label">收件人</p>
            <p><strong>${Invoice.escapeHtml(data.client?.name || '')}</strong></p>
            ${data.client?.company ? `<p>${Invoice.escapeHtml(data.client.company)}</p>` : ''}
            ${data.client?.email ? `<p>${Invoice.escapeHtml(data.client.email)}</p>` : ''}
          </div>
          <div class="creative-card">
            <p class="creative-label">详情</p>
            <p>日期：${data.date || ''}</p>
            <p>到期：${data.dueDate || ''}</p>
          </div>
        </div>
        <table class="tpl-table tpl-table-creative">
          <thead><tr><th>描述</th><th>数量</th><th>单价</th><th>金额</th></tr></thead>
          <tbody>
            ${(data.lineItems || []).map(item => `
              <tr>
                <td>${Invoice.escapeHtml(item.description || '-')}</td>
                <td>${item.quantity || 0}</td>
                <td>${App.formatCurrency(item.price, data.currency)}</td>
                <td>${App.formatCurrency((item.quantity || 0) * (item.price || 0), data.currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="tpl-totals tpl-totals-creative">
          <div class="tpl-total-row"><span>小计</span><span>${App.formatCurrency(data.subtotal, data.currency)}</span></div>
          ${data.taxRate ? `<div class="tpl-total-row"><span>税 (${data.taxRate}%)</span><span>${App.formatCurrency(data.taxAmount, data.currency)}</span></div>` : ''}
          ${data.discount ? `<div class="tpl-total-row"><span>折扣</span><span>-${App.formatCurrency(data.discount, data.currency)}</span></div>` : ''}
          <div class="tpl-total-row tpl-grand-total creative-grand"><span>合计</span><span>${App.formatCurrency(data.total, data.currency)}</span></div>
        </div>
        ${data.notes ? `<div class="tpl-notes tpl-notes-creative"><strong>备注：</strong><p>${Invoice.escapeHtml(data.notes)}</p></div>` : ''}
      </div>
    `;
  },
};

// 历史记录模块
const History = {
  currentFilter: 'all',

  render() {
    const invoices = Storage.getInvoices();
    const container = document.getElementById('history-list');
    const empty = document.getElementById('history-empty');

    const filtered = this.currentFilter === 'all'
      ? invoices
      : invoices.filter(i => i.status === this.currentFilter);

    if (filtered.length === 0) {
      container.innerHTML = '';
      empty.style.display = 'block';
      empty.querySelector('p').textContent = this.currentFilter === 'all'
        ? '暂无发票记录。创建您的第一张发票吧！'
        : `没有${this.getStatusLabel(this.currentFilter)}状态的发票。`;
      return;
    }

    empty.style.display = 'none';
    container.innerHTML = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(inv => `
      <div class="history-card" data-id="${inv.id}">
        <div class="history-card-main" onclick="History.view('${inv.id}')">
          <div class="history-info">
            <h4>${Invoice.escapeHtml(inv.invoiceNumber)}</h4>
            <span class="text2">${Invoice.escapeHtml(inv.client?.name || '未知客户')}</span>
          </div>
          <div class="history-amount">
            <strong>${App.formatCurrency(inv.total, inv.currency)}</strong>
            <span class="text2">${App.formatDate(inv.date)}</span>
          </div>
          <span class="status-badge status-${inv.status}">${this.getStatusLabel(inv.status)}</span>
        </div>
        <div class="history-card-actions">
          <button class="btn btn-sm" onclick="History.edit('${inv.id}')">编辑</button>
          <button class="btn btn-sm" onclick="History.duplicate('${inv.id}')">复制</button>
          <button class="btn btn-sm" onclick="History.changeStatus('${inv.id}')">更改状态</button>
          <button class="btn btn-sm btn-danger" onclick="History.delete('${inv.id}')">删除</button>
        </div>
      </div>
    `).join('');
  },

  filter(status) {
    this.currentFilter = status;
    document.querySelectorAll('.history-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === status);
    });
    this.render();
  },

  view(id) {
    const invoice = Storage.getInvoices().find(i => i.id === id);
    if (!invoice) return;
    // 显示预览模态框
    const modal = document.getElementById('invoice-view-modal');
    const content = document.getElementById('invoice-view-content');
    content.innerHTML = Templates.renderPreview(invoice, invoice.template || 'modern');
    modal.classList.add('show');
  },

  edit(id) {
    const invoice = Storage.getInvoices().find(i => i.id === id);
    if (invoice) Invoice.loadInvoice(invoice);
  },

  duplicate(id) {
    const invoice = Storage.getInvoices().find(i => i.id === id);
    if (!invoice) return;
    const newInvoice = { ...invoice };
    delete newInvoice.id;
    newInvoice.invoiceNumber = Storage.getNextInvoiceNumber();
    newInvoice.date = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    newInvoice.dueDate = dueDate.toISOString().split('T')[0];
    newInvoice.createdAt = new Date().toISOString();
    newInvoice.status = 'draft';
    newInvoice.lineItems = invoice.lineItems.map(item => ({ ...item, id: App.uuid() }));
    Invoice.loadInvoice(newInvoice);
    Invoice.currentEditId = null;
    App.toast('发票已复制');
  },

  changeStatus(id) {
    const invoice = Storage.getInvoices().find(i => i.id === id);
    if (!invoice) return;
    const modal = document.getElementById('status-modal');
    document.getElementById('status-invoice-id').value = id;
    document.querySelectorAll('.status-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.status === invoice.status);
    });
    modal.classList.add('show');
  },

  setStatus(status) {
    const id = document.getElementById('status-invoice-id').value;
    const invoices = Storage.getInvoices();
    const inv = invoices.find(i => i.id === id);
    if (inv) {
      inv.status = status;
      Storage.saveInvoice(inv);
      document.getElementById('status-modal').classList.remove('show');
      this.render();
      App.toast('状态已更新');
    }
  },

  delete(id) {
    if (confirm('确定要删除此发票吗？此操作不可撤销。')) {
      Storage.deleteInvoice(id);
      this.render();
      App.toast('发票已删除');
    }
  },

  getStatusLabel(status) {
    const labels = { draft: '草稿', sent: '已发送', paid: '已支付' };
    return labels[status] || status;
  },
};

// 设置模块
const Settings = {
  render() {
    const settings = Storage.getSettings();
    document.getElementById('settings-company').value = settings.companyName || '';
    document.getElementById('settings-address').value = settings.address || '';
    document.getElementById('settings-email').value = settings.email || '';
    document.getElementById('settings-phone').value = settings.phone || '';
    document.getElementById('settings-currency').value = settings.currency || 'CNY';
    document.getElementById('settings-tax-rate').value = settings.taxRate || 0;
    document.getElementById('settings-payment-terms').value = settings.paymentTerms || '';
    document.getElementById('settings-prefix').value = settings.invoicePrefix || 'INV-';
    document.getElementById('settings-start').value = settings.invoiceStart || 1000;
    if (settings.logo) {
      const preview = document.getElementById('settings-logo-preview');
      preview.innerHTML = `<img src="${settings.logo}" style="max-height:50px;border-radius:6px;">`;
      preview.dataset.logo = settings.logo;
    }
  },

  save() {
    const settings = {
      companyName: document.getElementById('settings-company').value.trim(),
      address: document.getElementById('settings-address').value.trim(),
      email: document.getElementById('settings-email').value.trim(),
      phone: document.getElementById('settings-phone').value.trim(),
      logo: document.getElementById('settings-logo-preview')?.dataset.logo || '',
      currency: document.getElementById('settings-currency').value,
      taxRate: parseFloat(document.getElementById('settings-tax-rate').value) || 0,
      paymentTerms: document.getElementById('settings-payment-terms').value.trim(),
      invoicePrefix: document.getElementById('settings-prefix').value.trim(),
      invoiceStart: parseInt(document.getElementById('settings-start').value) || 1000,
    };
    Storage.saveSettings(settings);
    App.toast('设置已保存');
  },

  handleLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const preview = document.getElementById('settings-logo-preview');
      preview.innerHTML = `<img src="${ev.target.result}" style="max-height:50px;border-radius:6px;">`;
      preview.dataset.logo = ev.target.result;
    };
    reader.readAsDataURL(file);
  },

  exportData() {
    const data = Storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoicelab-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.toast('数据已导出');
  },

  importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        Storage.importAll(data);
        App.toast('数据已导入');
        this.render();
      } catch (err) {
        App.toast('导入失败：文件格式不正确', 'error');
      }
    };
    reader.readAsText(file);
  },

  clearAllData() {
    if (confirm('确定要清除所有数据吗？此操作不可撤销！')) {
      if (confirm('再次确认：所有发票、客户和设置将被删除。')) {
        Storage.clearAll();
        App.toast('所有数据已清除');
        location.reload();
      }
    }
  },
};
