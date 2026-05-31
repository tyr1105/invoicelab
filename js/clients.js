/**
 * InvoiceLab - 客户管理
 */

const Clients = {
  render() {
    const clients = Storage.getClients();
    const container = document.getElementById('clients-list');
    const empty = document.getElementById('clients-empty');

    if (clients.length === 0) {
      container.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    container.innerHTML = clients.map(client => `
      <div class="client-card" data-id="${client.id}">
        <div class="client-card-header">
          <div class="client-avatar">${(client.name || '?')[0].toUpperCase()}</div>
          <div class="client-info">
            <h4>${Invoice.escapeHtml(client.name)}</h4>
            ${client.company ? `<span>${Invoice.escapeHtml(client.company)}</span>` : ''}
          </div>
          <div class="client-actions">
            <button class="btn-icon" onclick="Clients.edit('${client.id}')" title="编辑">✎</button>
            <button class="btn-icon btn-danger" onclick="Clients.delete('${client.id}')" title="删除">✕</button>
          </div>
        </div>
        <div class="client-card-body">
          ${client.email ? `<div class="client-detail"><span class="detail-label">邮箱</span><span>${Invoice.escapeHtml(client.email)}</span></div>` : ''}
          ${client.address ? `<div class="client-detail"><span class="detail-label">地址</span><span>${Invoice.escapeHtml(client.address)}</span></div>` : ''}
          ${client.phone ? `<div class="client-detail"><span class="detail-label">电话</span><span>${Invoice.escapeHtml(client.phone)}</span></div>` : ''}
        </div>
      </div>
    `).join('');
  },

  showForm(client = null) {
    const modal = document.getElementById('client-form-modal');
    document.getElementById('client-form-title').textContent = client ? '编辑客户' : '添加客户';
    document.getElementById('client-form-id').value = client?.id || '';
    document.getElementById('client-form-name').value = client?.name || '';
    document.getElementById('client-form-company').value = client?.company || '';
    document.getElementById('client-form-address').value = client?.address || '';
    document.getElementById('client-form-email').value = client?.email || '';
    document.getElementById('client-form-phone').value = client?.phone || '';
    modal.classList.add('show');
  },

  save() {
    const id = document.getElementById('client-form-id').value || App.uuid();
    const client = {
      id,
      name: document.getElementById('client-form-name').value.trim(),
      company: document.getElementById('client-form-company').value.trim(),
      address: document.getElementById('client-form-address').value.trim(),
      email: document.getElementById('client-form-email').value.trim(),
      phone: document.getElementById('client-form-phone').value.trim(),
    };

    if (!client.name) {
      App.toast('请输入客户名称', 'error');
      return;
    }

    Storage.saveClient(client);
    document.getElementById('client-form-modal').classList.remove('show');
    this.render();
    App.toast(client.id === id && document.getElementById('client-form-id').value ? '客户已更新' : '客户已添加');
  },

  edit(id) {
    const client = Storage.getClients().find(c => c.id === id);
    if (client) this.showForm(client);
  },

  delete(id) {
    if (confirm('确定要删除此客户吗？')) {
      Storage.deleteClient(id);
      this.render();
      App.toast('客户已删除');
    }
  },
};
