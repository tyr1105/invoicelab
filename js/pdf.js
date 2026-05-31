/**
 * InvoiceLab - PDF导出 (jsPDF)
 */

const PDFExport = {
  exportPDF() {
    const data = Invoice.getFormData();
    const template = Storage.getTemplate();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    switch (template) {
      case 'classic':
        this.renderClassicPDF(doc, data, margin, contentWidth, pageWidth, pageHeight);
        break;
      case 'creative':
        this.renderCreativePDF(doc, data, margin, contentWidth, pageWidth, pageHeight);
        break;
      default:
        this.renderModernPDF(doc, data, margin, contentWidth, pageWidth, pageHeight);
    }

    doc.save(`${data.invoiceNumber || 'invoice'}.pdf`);
    App.toast('PDF已生成并下载');
  },

  renderModernPDF(doc, data, margin, cw, pw, ph) {
    let y = margin;
    const accent = [56, 189, 248]; // #38bdf8

    // Header background
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pw, 50, 'F');

    // Logo
    if (data.sender?.logo) {
      try {
        doc.addImage(data.sender.logo, 'PNG', margin, 10, 25, 25);
      } catch (e) {}
    }

    // Company name
    doc.setTextColor(241, 245, 249);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(data.sender?.companyName || '', data.sender?.logo ? margin + 30 : margin, 22);

    // Company details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    let detailY = 30;
    if (data.sender?.email) { doc.text(data.sender.email, data.sender?.logo ? margin + 30 : margin, detailY); detailY += 5; }
    if (data.sender?.phone) { doc.text(data.sender.phone, data.sender?.logo ? margin + 30 : margin, detailY); }

    // Invoice title
    doc.setTextColor(...accent);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pw - margin, 25, { align: 'right' });

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(10);
    doc.text(data.invoiceNumber || '', pw - margin, 35, { align: 'right' });

    y = 60;

    // Bill To & Date
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text('BILL TO', margin, y);

    doc.setTextColor(241, 245, 249);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(data.client?.name || '', margin, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    if (data.client?.company) { doc.text(data.client.company, margin, y + 14); }
    if (data.client?.address) { doc.text(data.client.address, margin, y + 21); }
    if (data.client?.email) { doc.text(data.client.email, margin, y + 28); }

    // Date info (right side)
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text('DATE', pw - margin - 40, y);
    doc.text('DUE DATE', pw - margin, y);
    doc.setTextColor(241, 245, 249);
    doc.setFontSize(9);
    doc.text(data.date || '', pw - margin - 40, y + 7);
    doc.text(data.dueDate || '', pw - margin, y + 7);

    // Currency
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text('CURRENCY', pw - margin, y + 16);
    doc.setTextColor(241, 245, 249);
    doc.setFontSize(9);
    doc.text(data.currency || 'CNY', pw - margin, y + 23);

    y += 38;

    // Line items table
    const tableTop = y;
    const colWidths = [cw * 0.4, cw * 0.15, cw * 0.2, cw * 0.25];
    const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

    // Table header
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, cw, 10, 'F');
    doc.setTextColor(...accent);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const headers = ['DESCRIPTION', 'QTY', 'UNIT PRICE', 'AMOUNT'];
    headers.forEach((h, i) => {
      doc.text(h, colX[i] + 3, y + 7);
    });
    y += 12;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 220, 220);
    doc.setFontSize(9);
    (data.lineItems || []).forEach((item, idx) => {
      if (y > ph - 40) {
        doc.addPage();
        y = margin;
      }
      if (idx % 2 === 0) {
        doc.setFillColor(24, 34, 50);
        doc.rect(margin, y - 3, cw, 8, 'F');
      }
      doc.text((item.description || '').substring(0, 35), colX[0] + 3, y + 2);
      doc.text(String(item.quantity || 0), colX[1] + 3, y + 2);
      doc.text(this.formatMoney(item.price, data.currency), colX[2] + 3, y + 2);
      doc.text(this.formatMoney((item.quantity || 0) * (item.price || 0), data.currency), colX[3] + 3, y + 2);
      y += 8;
    });

    y += 5;

    // Separator line
    doc.setDrawColor(51, 65, 85);
    doc.line(margin, y, pw - margin, y);
    y += 8;

    // Totals
    const totalX = pw - margin;
    const labelX = pw - margin - 60;
    doc.setFontSize(9);

    doc.setTextColor(148, 163, 184);
    doc.text('Subtotal', labelX, y);
    doc.setTextColor(220, 220, 220);
    doc.text(this.formatMoney(data.subtotal, data.currency), totalX, y, { align: 'right' });
    y += 7;

    if (data.taxRate) {
      doc.setTextColor(148, 163, 184);
      doc.text(`Tax (${data.taxRate}%)`, labelX, y);
      doc.setTextColor(220, 220, 220);
      doc.text(this.formatMoney(data.taxAmount, data.currency), totalX, y, { align: 'right' });
      y += 7;
    }

    if (data.discount) {
      doc.setTextColor(148, 163, 184);
      doc.text('Discount', labelX, y);
      doc.setTextColor(220, 220, 220);
      doc.text(`-${this.formatMoney(data.discount, data.currency)}`, totalX, y, { align: 'right' });
      y += 7;
    }

    // Grand total
    doc.setFillColor(30, 41, 59);
    doc.rect(labelX - 5, y - 3, 65, 10, 'F');
    doc.setTextColor(...accent);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', labelX, y + 3);
    doc.text(this.formatMoney(data.total, data.currency), totalX, y + 3, { align: 'right' });
    y += 18;

    // Notes
    if (data.notes) {
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTES', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 200);
      const lines = doc.splitTextToSize(data.notes, cw);
      doc.text(lines, margin, y);
    }
  },

  renderClassicPDF(doc, data, margin, cw, pw, ph) {
    let y = margin;

    // Logo
    if (data.sender?.logo) {
      try { doc.addImage(data.sender.logo, 'PNG', margin, y, 20, 20); } catch (e) {}
    }

    // Company name
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.text(data.sender?.companyName || '', data.sender?.logo ? margin + 25 : margin, y + 8);

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    let cy = y + 15;
    if (data.sender?.address) { doc.text(data.sender.address, data.sender?.logo ? margin + 25 : margin, cy); cy += 5; }
    if (data.sender?.email) { doc.text(data.sender.email, data.sender?.logo ? margin + 25 : margin, cy); cy += 5; }
    if (data.sender?.phone) { doc.text(data.sender.phone, data.sender?.logo ? margin + 25 : margin, cy); }

    // Horizontal line
    y = 45;
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pw - margin, y);
    y += 10;

    // INVOICE header right
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(24);
    doc.setFont('times', 'bold');
    doc.text('INVOICE', pw - margin, y, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(data.invoiceNumber || '', pw - margin, y + 7, { align: 'right' });

    // Bill to
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(8);
    doc.setFont('times', 'bold');
    doc.text('BILL TO:', margin, y);
    y += 7;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(data.client?.name || '', margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    if (data.client?.company) { doc.text(data.client.company, margin, y); y += 5; }
    if (data.client?.address) { doc.text(data.client.address, margin, y); y += 5; }
    if (data.client?.email) { doc.text(data.client.email, margin, y); y += 5; }

    // Dates
    y += 5;
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    doc.text(`Date: ${data.date || ''}`, margin, y);
    doc.text(`Due Date: ${data.dueDate || ''}`, margin + 60, y);
    y += 12;

    // Table
    const colWidths = [cw * 0.4, cw * 0.15, cw * 0.2, cw * 0.25];
    const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

    doc.setFillColor(60, 60, 60);
    doc.rect(margin, y - 2, cw, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('times', 'bold');
    ['Description', 'Qty', 'Unit Price', 'Amount'].forEach((h, i) => {
      doc.text(h, colX[i] + 2, y + 3);
    });
    y += 10;

    doc.setFont('times', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    (data.lineItems || []).forEach((item, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y - 3, cw, 7, 'F');
      }
      doc.text((item.description || '').substring(0, 35), colX[0] + 2, y + 1);
      doc.text(String(item.quantity || 0), colX[1] + 2, y + 1);
      doc.text(this.formatMoney(item.price, data.currency), colX[2] + 2, y + 1);
      doc.text(this.formatMoney((item.quantity || 0) * (item.price || 0), data.currency), colX[3] + 2, y + 1);
      y += 7;
    });

    y += 5;
    doc.setDrawColor(60, 60, 60);
    doc.line(margin, y, pw - margin, y);
    y += 8;

    const totalX = pw - margin;
    const labelX = pw - margin - 55;

    doc.setTextColor(100, 100, 100);
    doc.text('Subtotal', labelX, y);
    doc.setTextColor(40, 40, 40);
    doc.text(this.formatMoney(data.subtotal, data.currency), totalX, y, { align: 'right' });
    y += 6;

    if (data.taxRate) {
      doc.setTextColor(100, 100, 100);
      doc.text(`Tax (${data.taxRate}%)`, labelX, y);
      doc.setTextColor(40, 40, 40);
      doc.text(this.formatMoney(data.taxAmount, data.currency), totalX, y, { align: 'right' });
      y += 6;
    }
    if (data.discount) {
      doc.setTextColor(100, 100, 100);
      doc.text('Discount', labelX, y);
      doc.setTextColor(40, 40, 40);
      doc.text(`-${this.formatMoney(data.discount, data.currency)}`, totalX, y, { align: 'right' });
      y += 6;
    }

    y += 2;
    doc.setLineWidth(0.3);
    doc.line(labelX - 2, y - 2, totalX, y - 2);
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text('Total', labelX, y + 3);
    doc.text(this.formatMoney(data.total, data.currency), totalX, y + 3, { align: 'right' });
    y += 15;

    if (data.notes) {
      doc.setFont('times', 'bold');
      doc.setFontSize(9);
      doc.text('Notes:', margin, y);
      y += 6;
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const lines = doc.splitTextToSize(data.notes, cw);
      doc.text(lines, margin, y);
    }
  },

  renderCreativePDF(doc, data, margin, cw, pw, ph) {
    let y = 0;
    const purple = [139, 92, 246];
    const pink = [236, 72, 153];
    const teal = [20, 184, 166];

    // Top gradient bar
    doc.setFillColor(...purple);
    doc.rect(0, 0, pw / 3, 8, 'F');
    doc.setFillColor(...pink);
    doc.rect(pw / 3, 0, pw / 3, 8, 'F');
    doc.setFillColor(...teal);
    doc.rect(pw * 2 / 3, 0, pw / 3, 8, 'F');

    y = 20;

    // Logo
    if (data.sender?.logo) {
      try { doc.addImage(data.sender.logo, 'PNG', margin, y, 22, 22); } catch (e) {}
    }

    // Company
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(data.sender?.companyName || '', data.sender?.logo ? margin + 27 : margin, y + 8);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    if (data.sender?.email) doc.text(data.sender.email, data.sender?.logo ? margin + 27 : margin, y + 15);
    if (data.sender?.phone) doc.text(data.sender.phone, data.sender?.logo ? margin + 27 : margin, y + 21);

    // Invoice badge
    doc.setFillColor(...purple);
    doc.roundedRect(pw - margin - 45, y, 45, 25, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pw - margin - 22, y + 10, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(data.invoiceNumber || '', pw - margin - 22, y + 17, { align: 'center' });

    y += 35;

    // Rounded card for client info
    doc.setFillColor(248, 245, 255);
    doc.roundedRect(margin, y, cw * 0.55, 28, 3, 3, 'F');
    doc.setTextColor(...purple);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', margin + 5, y + 6);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.text(data.client?.name || '', margin + 5, y + 13);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    if (data.client?.company) doc.text(data.client.company, margin + 5, y + 19);
    if (data.client?.email) doc.text(data.client.email, margin + 5, y + 24);

    // Date card
    doc.setFillColor(240, 253, 250);
    doc.roundedRect(margin + cw * 0.6, y, cw * 0.4, 28, 3, 3, 'F');
    doc.setTextColor(...teal);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('DATE & DUE', margin + cw * 0.6 + 5, y + 6);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${data.date || ''}`, margin + cw * 0.6 + 5, y + 14);
    doc.text(`Due: ${data.dueDate || ''}`, margin + cw * 0.6 + 5, y + 22);

    y += 38;

    // Table with rounded header
    const colWidths = [cw * 0.4, cw * 0.15, cw * 0.2, cw * 0.25];
    const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

    doc.setFillColor(...purple);
    doc.roundedRect(margin, y, cw, 9, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    ['Description', 'Qty', 'Unit Price', 'Amount'].forEach((h, i) => {
      doc.text(h, colX[i] + 3, y + 6);
    });
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    (data.lineItems || []).forEach((item, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 245, 255);
        doc.rect(margin, y - 3, cw, 8, 'F');
      }
      doc.text((item.description || '').substring(0, 35), colX[0] + 3, y + 1);
      doc.text(String(item.quantity || 0), colX[1] + 3, y + 1);
      doc.text(this.formatMoney(item.price, data.currency), colX[2] + 3, y + 1);
      doc.text(this.formatMoney((item.quantity || 0) * (item.price || 0), data.currency), colX[3] + 3, y + 1);
      y += 8;
    });

    y += 8;
    const totalX = pw - margin;
    const labelX = pw - margin - 55;

    doc.setTextColor(120, 120, 120);
    doc.setFontSize(9);
    doc.text('Subtotal', labelX, y);
    doc.setTextColor(40, 40, 40);
    doc.text(this.formatMoney(data.subtotal, data.currency), totalX, y, { align: 'right' });
    y += 7;

    if (data.taxRate) {
      doc.setTextColor(120, 120, 120);
      doc.text(`Tax (${data.taxRate}%)`, labelX, y);
      doc.setTextColor(40, 40, 40);
      doc.text(this.formatMoney(data.taxAmount, data.currency), totalX, y, { align: 'right' });
      y += 7;
    }
    if (data.discount) {
      doc.setTextColor(120, 120, 120);
      doc.text('Discount', labelX, y);
      doc.setTextColor(40, 40, 40);
      doc.text(`-${this.formatMoney(data.discount, data.currency)}`, totalX, y, { align: 'right' });
      y += 7;
    }

    // Grand total with gradient-ish bar
    y += 3;
    doc.setFillColor(...purple);
    doc.roundedRect(labelX - 5, y - 4, totalX - labelX + 5, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', labelX, y + 3);
    doc.text(this.formatMoney(data.total, data.currency), totalX - 3, y + 3, { align: 'right' });

    y += 20;
    if (data.notes) {
      doc.setFillColor(255, 248, 251);
      doc.roundedRect(margin, y, cw, 20, 3, 3, 'F');
      doc.setTextColor(...pink);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTES', margin + 5, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const lines = doc.splitTextToSize(data.notes, cw - 10);
      doc.text(lines.slice(0, 2), margin + 5, y + 13);
    }

    // Bottom color bar
    doc.setFillColor(...pink);
    doc.rect(0, ph - 5, pw / 3, 5, 'F');
    doc.setFillColor(...teal);
    doc.rect(pw / 3, ph - 5, pw / 3, 5, 'F');
    doc.setFillColor(...purple);
    doc.rect(pw * 2 / 3, ph - 5, pw / 3, 5, 'F');
  },

  formatMoney(amount, currency = 'CNY') {
    const symbols = { USD: '$', EUR: '€', CNY: '¥', HKD: 'HK$', GBP: '£', JPY: '¥' };
    const sym = symbols[currency] || '¥';
    return `${sym}${parseFloat(amount || 0).toFixed(2)}`;
  },
};
