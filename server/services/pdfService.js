import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const generateInvoicePDF = async (invoice, settings) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // 1. Template Configurations
      const template = invoice.templateType || 'modern';
      let theme = {
        primary: '#4f46e5',   // Indigo (Modern)
        text: '#1f2937',      // Dark grey
        lightBg: '#f3f4f6',   // Light grey
        border: '#e5e7eb',    // Slate Border
      };

      if (template === 'corporate') {
        theme = {
          primary: '#1e3a8a',  // Navy
          text: '#111827',
          lightBg: '#f0f4f8',
          border: '#cbd5e1',
        };
      } else if (template === 'classic') {
        theme = {
          primary: '#475569',  // Slate
          text: '#334155',
          lightBg: '#f8fafc',
          border: '#e2e8f0',
        };
      } else if (template === 'minimal') {
        theme = {
          primary: '#0f172a',  // Charcoal/Black
          text: '#0f172a',
          lightBg: '#ffffff',
          border: '#e2e8f0',
        };
      }

      const clientInfo = invoice.clientDetailsSnapshot || invoice.client;

      // 2. Generate QR Code Buffer
      // Point it to a simulated client payment portal
      const portalUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/portal/invoice/${invoice.sharingToken}`;
      let qrBuffer = null;
      try {
        qrBuffer = await QRCode.toBuffer(portalUrl, { margin: 1, width: 80 });
      } catch (qrErr) {
        console.error('QR code generation failed, skipping QR code in PDF:', qrErr);
      }

      // 3. Header Styling based on template type
      if (template === 'corporate') {
        // Band of primary color at top
        doc.rect(0, 0, 595.28, 40).fill(theme.primary);
        doc.y = 60;
      } else if (template === 'modern') {
        // Colored accent bar at top left
        doc.rect(50, 45, 5, 55).fill(theme.primary);
      }

      // Company Brand & Details (Left Column) and Invoice Meta Details (Right Column)
      const headerStartY = template === 'corporate' ? 60 : (template === 'modern' ? 45 : 50);
      const leftX = template === 'modern' ? 60 : 50;
      const rightX = 400;
      const colWidth = 320; // leaves 30pt gap since leftX + colWidth <= 380 and right column starts at 400

      // Draw Left Column: Company Brand
      doc.fillColor(template === 'modern' ? theme.primary : theme.text);
      doc.font('Helvetica-Bold').fontSize(24).text(settings.name, leftX, headerStartY, { width: colWidth });

      // Draw Left Column: Company Details
      doc.font('Helvetica').fontSize(9).fillColor(theme.text);
      if (settings.address?.street) {
        doc.text(settings.address.street, leftX, doc.y, { width: colWidth });
      }
      const cityStateZip = `${settings.address?.city || ''}, ${settings.address?.state || ''} ${settings.address?.zipCode || ''}`.trim();
      if (cityStateZip && cityStateZip !== ',') {
        doc.text(cityStateZip, leftX, doc.y, { width: colWidth });
      }
      if (settings.address?.country) {
        doc.text(settings.address.country, leftX, doc.y, { width: colWidth });
      }
      if (settings.phone) {
        doc.text(`Phone: ${settings.phone}`, leftX, doc.y, { width: colWidth });
      }
      if (settings.email) {
        doc.text(`Email: ${settings.email}`, leftX, doc.y, { width: colWidth });
      }
      if (settings.gstNumber) {
        doc.text(`GSTIN: ${settings.gstNumber}`, leftX, doc.y, { width: colWidth });
      }
      if (settings.panNumber) {
        doc.text(`PAN: ${settings.panNumber}`, leftX, doc.y, { width: colWidth });
      }

      // Capture bottom of left column
      const leftY = doc.y;

      // Draw Right Column: Invoice Meta Details
      doc.fillColor(theme.text);
      doc.font('Helvetica-Bold').fontSize(18).fillColor(theme.primary).text('INVOICE', rightX, headerStartY, { align: 'right', width: 145 });
      doc.font('Helvetica-Bold').fontSize(10).fillColor(theme.text).text(`Invoice #: ${invoice.invoiceNumber}`, rightX, headerStartY + 25, { align: 'right', width: 145 });
      doc.font('Helvetica').fontSize(9)
         .text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, rightX, headerStartY + 40, { align: 'right', width: 145 })
         .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, rightX, headerStartY + 53, { align: 'right', width: 145 })
         .text(`Status: ${invoice.status.toUpperCase().replace('_', ' ')}`, rightX, headerStartY + 66, { align: 'right', width: 145 });

      // Capture bottom of right column
      const rightY = doc.y;

      // Ensure the cursor starts below both columns
      doc.y = Math.max(leftY, rightY);

      // Horizontal separator line
      const lineY = Math.max(doc.y + 15, 160);
      doc.strokeColor(theme.border).lineWidth(1).moveTo(50, lineY).lineTo(545, lineY).stroke();

      // 4. Client Billing Info & Dates
      const billingY = lineY + 15;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(theme.primary).text('BILLED TO:', 50, billingY);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(theme.text).text(clientInfo.name || '', 50, billingY + 15, { width: 320 });
      
      doc.font('Helvetica').fontSize(9);
      if (clientInfo.company) {
        doc.text(clientInfo.company, 50, doc.y + 3, { width: 320 });
      }
      if (clientInfo.address?.street) {
        doc.text(clientInfo.address.street, 50, doc.y + 3, { width: 320 });
      }
      const clientCityStateZip = `${clientInfo.address?.city || ''}, ${clientInfo.address?.state || ''} ${clientInfo.address?.zipCode || ''}`.trim();
      if (clientCityStateZip && clientCityStateZip !== ',') {
        doc.text(clientCityStateZip, 50, doc.y + 3, { width: 320 });
      }
      if (clientInfo.address?.country) {
        doc.text(clientInfo.address.country, 50, doc.y + 3, { width: 320 });
      }
      if (clientInfo.email) {
        doc.text(`Email: ${clientInfo.email}`, 50, doc.y + 3, { width: 320 });
      }
      if (clientInfo.phone) {
        doc.text(`Phone: ${clientInfo.phone}`, 50, doc.y + 3, { width: 320 });
      }
      if (clientInfo.gstNumber) {
        doc.text(`GSTIN: ${clientInfo.gstNumber}`, 50, doc.y + 3, { width: 320 });
      }

      // Add Currency / Payment Details box (Right Column)
      doc.rect(400, billingY, 145, 45).fill(theme.lightBg);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(theme.primary).text('PAYMENT DETAILS', 410, billingY + 8, { width: 125 });
      doc.font('Helvetica').fontSize(8).fillColor(theme.text)
         .text(`Currency: ${invoice.currency}`, 410, billingY + 20, { width: 125 })
         .text(`Balance Due: ${invoice.currency} ${invoice.balanceDue.toFixed(2)}`, 410, billingY + 30, { width: 125 });

      // 5. Items Table
      const tableY = Math.max(doc.y, billingY + 55) + 20;
      doc.font('Helvetica-Bold').fontSize(9).fillColor(theme.primary);

      // Table Header
      doc.rect(50, tableY, 495, 20).fill(theme.lightBg);
      doc.fillColor(theme.primary);
      doc.text('Item Details', 60, tableY + 6, { width: 190 });
      doc.text('Qty', 260, tableY + 6, { width: 40, align: 'center' });
      doc.text('Rate', 310, tableY + 6, { width: 60, align: 'right' });
      doc.text('GST %', 380, tableY + 6, { width: 50, align: 'right' });
      doc.text('Amount', 440, tableY + 6, { width: 95, align: 'right' });

      let currentY = tableY + 20;
      doc.font('Helvetica').fontSize(9).fillColor(theme.text);

      invoice.items.forEach((item, index) => {
        // Calculate the height required for the item name & description column
        doc.font('Helvetica-Bold').fontSize(9);
        const nameHeight = doc.heightOfString(item.itemName, { width: 190 });
        
        let descHeight = 0;
        if (item.description) {
          doc.font('Helvetica').fontSize(8);
          descHeight = doc.heightOfString(item.description, { width: 190 });
        }
        
        const contentHeight = nameHeight + (descHeight > 0 ? descHeight + 2 : 0);
        const rowHeight = Math.max(24, contentHeight + 12);

        // Check page overflow first, before drawing the row
        if (currentY + rowHeight > 730) {
          doc.addPage();
          currentY = 50;
        }

        // Alternate row colors if modern/corporate
        if (index % 2 === 1 && template !== 'minimal') {
          doc.rect(50, currentY, 495, rowHeight).fill('#f9fafb');
        }

        // Render Item Name
        doc.font('Helvetica-Bold').fontSize(9).fillColor(theme.text);
        doc.text(item.itemName, 60, currentY + 6, { width: 190 });
        
        // Render Item Description
        if (item.description) {
          doc.font('Helvetica').fontSize(8).fillColor('#6b7280');
          doc.text(item.description, 60, currentY + 6 + nameHeight + 2, { width: 190 });
        }

        // Render other columns
        doc.font('Helvetica').fontSize(9).fillColor(theme.text);
        doc.text(item.quantity.toString(), 260, currentY + 6, { width: 40, align: 'center' });
        doc.text(item.rate.toFixed(2), 310, currentY + 6, { width: 60, align: 'right' });
        doc.text(`${item.taxRate}%`, 380, currentY + 6, { width: 50, align: 'right' });
        doc.text(item.amount.toFixed(2), 440, currentY + 6, { width: 95, align: 'right' });

        currentY += rowHeight;
      });

      // Check page overflow before drawing the summary and footer
      if (currentY > 560) {
        doc.addPage();
        currentY = 50;
      }

      // Horizontal line
      doc.strokeColor(theme.border).lineWidth(1).moveTo(50, currentY).lineTo(545, currentY).stroke();
      currentY += 10;

      // 6. Summary and Calculations
      const sumX = 350;
      doc.font('Helvetica').fontSize(9);

      doc.text('Subtotal:', sumX, currentY, { width: 90 });
      doc.text(`${invoice.currency} ${invoice.subtotal.toFixed(2)}`, 440, currentY, { width: 95, align: 'right' });
      currentY += 15;

      if (invoice.taxAmount > 0) {
        doc.text('GST / Tax:', sumX, currentY, { width: 90 });
        doc.text(`${invoice.currency} ${invoice.taxAmount.toFixed(2)}`, 440, currentY, { width: 95, align: 'right' });
        currentY += 15;
      }

      if (invoice.discountAmount > 0) {
        doc.text(`Discount (${invoice.discountRate}%):`, sumX, currentY, { width: 90 });
        doc.text(`- ${invoice.currency} ${invoice.discountAmount.toFixed(2)}`, 440, currentY, { width: 95, align: 'right' });
        currentY += 15;
      }

      if (invoice.tdsAmount > 0) {
        doc.text(`TDS (${invoice.tdsRate}%):`, sumX, currentY, { width: 90 });
        doc.text(`- ${invoice.currency} ${invoice.tdsAmount.toFixed(2)}`, 440, currentY, { width: 95, align: 'right' });
        currentY += 15;
      }

      // Grand Total Highlight
      doc.rect(340, currentY, 205, 22).fill(theme.primary);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff');
      doc.text('Grand Total:', sumX, currentY + 6, { width: 90 });
      doc.text(`${invoice.currency} ${invoice.grandTotal.toFixed(2)}`, 440, currentY + 6, { width: 95, align: 'right' });
      currentY += 30;

      doc.font('Helvetica').fontSize(9).fillColor(theme.text);
      doc.text('Paid Amount:', sumX, currentY, { width: 90 });
      doc.text(`${invoice.currency} ${invoice.paidAmount.toFixed(2)}`, 440, currentY, { width: 95, align: 'right' });
      currentY += 15;

      doc.font('Helvetica-Bold').text('Balance Due:', sumX, currentY, { width: 90 });
      doc.text(`${invoice.currency} ${invoice.balanceDue.toFixed(2)}`, 440, currentY, { width: 95, align: 'right' });

      // 7. Footer details (Bank details, Notes, Signatures, QR)
      const footerY = Math.max(currentY + 45, 580);

      // Bank Details block (Bottom-Left)
      if (settings.bankDetails && settings.bankDetails.bankName) {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(theme.primary).text('BANK DETAILS', 50, footerY);
        doc.font('Helvetica').fontSize(7.5).fillColor(theme.text)
           .text(`A/C Name: ${settings.bankDetails.accountName}`, 50, footerY + 12)
           .text(`A/C No: ${settings.bankDetails.accountNumber}`)
           .text(`Bank: ${settings.bankDetails.bankName}`)
           .text(`IFSC: ${settings.bankDetails.ifscCode}`)
           .text(`SWIFT: ${settings.bankDetails.swiftCode || 'N/A'}`);
      }

      // Notes (Bottom-Left underneath Bank details or parallel)
      if (invoice.notes) {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(theme.primary).text('NOTES & TERMS', 220, footerY);
        doc.font('Helvetica').fontSize(7.5).fillColor(theme.text).text(invoice.notes, 220, footerY + 12, { width: 160 });
      }

      // QR Code (Bottom-Right or Middle-Right)
      if (qrBuffer) {
        doc.image(qrBuffer, 395, footerY, { width: 60 });
        doc.font('Helvetica').fontSize(6.5).fillColor('#6b7280').text('Scan to View/Pay', 395, footerY + 62, { align: 'center', width: 60 });
      }

      // Signature (Bottom-Right)
      doc.strokeColor(theme.border).lineWidth(0.5).moveTo(470, footerY + 50).lineTo(545, footerY + 50).stroke();
      doc.font('Helvetica').fontSize(7.5).fillColor(theme.text).text('Authorized Signature', 470, footerY + 55, { align: 'center', width: 75 });

      if (settings.signatureUrl) {
        // If signatureUrl path is available, draw it (optional fallback placeholder text if files are empty)
        doc.font('Helvetica-Oblique').fontSize(10).fillColor(theme.primary).text(settings.name, 470, footerY + 35, { align: 'center', width: 75 });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
