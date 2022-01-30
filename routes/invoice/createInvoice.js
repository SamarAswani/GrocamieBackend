const PDFDocument = require('pdfkit');

function createInvoice(invoice, fileWriteStream, callback) {
  let doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.registerFont('Roboto', './routes/invoice/font/Roboto/Roboto-Regular.ttf');
  doc.registerFont('Roboto-Bold', './routes/invoice/font/Roboto/Roboto-Bold.ttf');

  generateHeader(doc);
  generateCustomerInformation(doc, invoice);
  generateInvoiceTable(doc, invoice);
  doc.pipe(fileWriteStream);

  let buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  if (callback) doc.on('end', () => callback(buffers));

  doc.end();
}

function generateHeader(doc) {
  doc
    .image('./routes/invoice/ltd.png', 50, 45, { width: 200 })
    .fillColor('#444444')
    // .fontSize(20)
    // .text("Grocamie", 110, 57)
    .fontSize(10)
    // .text("Grocamie", 200, 50, { align: "right" })
    .text('2-A/3, S/F FRONT SIDE', 200, 65, {
      align: 'right',
    })
    .text(' ASAF ALI ROAD TURKMAN GATE', 200, 80, {
      align: 'right',
    })
    .text('NEW DELHI, Central Delhi, Delhi, 110002', 200, 95, {
      align: 'right',
    })
    .text('info@grocamie.com | +91-8882066431', 200, 110, { align: 'right' })
    .text('GSTIN - 07AAICG6879N1ZO', 200, 125, { align: 'right' })
    .moveDown();
}

function generateCustomerInformation(doc, invoice) {
  doc.fillColor('#444444').fontSize(20).text('Tax Invoice', 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  var subtotal = 0;
  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    subtotal = subtotal + item.sp * item.quantity;
  }
  var balance = 0;
  var prepaid = 'Pre Paid';
  if (!invoice.paid) {
    balance = subtotal;
    prepaid = 'Pay on Delivery';
  }

  doc
    .fontSize(10)
    .text('Invoice Number:', 50, customerInformationTop)
    .font('Roboto-Bold')
    .text(invoice.invoice_nr, 150, customerInformationTop)
    .font('Roboto')
    .text('Invoice Date:', 50, customerInformationTop + 15)
    .text(formatDate(invoice.date), 150, customerInformationTop + 15)

    .text('Balance Due:', 50, customerInformationTop + 30)
    .text(formatCurrency(balance), 150, customerInformationTop + 30)
    .text('Payment Type:', 50, customerInformationTop + 45)
    .text(prepaid, 150, customerInformationTop + 45)

    .font('Roboto-Bold')
    .text(invoice.shipping.name, 300, customerInformationTop)
    .font('Roboto')
    .text(invoice.shipping.address, 300, customerInformationTop + 15)
    .text(
      invoice.shipping.state + ', ' + invoice.shipping.country,
      300,
      customerInformationTop + 30
    )
    .moveDown();

  generateHr(doc, 267);
}

function generateInvoiceTable(doc, invoice) {
  let i;
  const invoiceTableTop = 330;

  doc.font('Roboto-Bold');
  generateTableRow(
    doc,
    invoiceTableTop,
    'Item',
    'MRP',
    'Discounted Price',
    'Price without Tax',
    'Quantity',
    'Total'
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font('Roboto');

  var invmrp = 0;
  var taxMap = {};
  var subtotal = 0;
  var baseTotalGST0 = 0;
  var position = invoiceTableTop + 30;

  for (i = 0; i < invoice.items.length; i++) {
    if (position > doc.page.height - 100) {
      doc.addPage();
      doc.fillColor('#444444');
      position = 50;
    }
    const item = invoice.items[i];

    invmrp = invmrp + item.mrp * item.quantity;
    subtotal = subtotal + item.sp * item.quantity;
    if (!taxMap[item.gst]) {
      taxMap[item.gst] = 0;
    }

    let priceExcGST = Number((item.sp / (1 + item.gst / 100)).toFixed(2));
    taxMap[item.gst] += (item.sp - priceExcGST) * item.quantity;
    if (item.gst == 0) baseTotalGST0 += priceExcGST * item.quantity;

    generateTableRow(
      doc,
      position,
      item.name,
      item.mrp,
      item.sp,
      priceExcGST,
      item.quantity,
      formatCurrency(priceExcGST * item.quantity)
    );
    var height = doc.heightOfString(item.name, { width: 120 });
    generateHr(doc, position + height + 10);
    position = position + height + 20;
  }
  position += 20;

  if (position > doc.page.height - 100) {
    doc.addPage();
    doc.fillColor('#444444');
    position = 50;
  }

  const subtotalfield = position;
  var totalTax = Object.values(taxMap).reduce((acc, val) => acc + val, 0);
  generateTableRow(
    doc,
    subtotalfield,
    '',
    '',
    '',
    '',
    'Subtotal',
    formatCurrency(subtotal - totalTax)
  );

  position += 20;
  Object.keys(taxMap).forEach((key, index) => {
    if (position > doc.page.height - 100) {
      doc.addPage();
      doc.fillColor('#444444');
      position = 50;
    }

    const taxPrice = position;
    const basePrice = key == 0 ? baseTotalGST0 : (100 * taxMap[key]) / key;
    doc
      .fontSize(10)
      .text(
        `GST ${key}% on ${['\u20b9'] + ' ' + basePrice.toFixed(2)}`,
        320,
        taxPrice,
        {
          width: 160,
          align: 'right',
        }
      )
      .text(formatCurrency(taxMap[key]), 0, taxPrice, { align: 'right' });

    doc.font('Roboto');

    position += 20;
  });

  if (position > doc.page.height - 100) {
    doc.addPage();
    doc.fillColor('#444444');
    position = 50;
  }

  const duePosition = position;
  doc.font('Roboto-Bold');
  generateTableRow(
    doc,
    duePosition,
    '',
    '',
    '',
    '',
    'Grand Total',
    formatCurrency(subtotal)
  );
  doc.font('Roboto');

  position += 20;

  if (position > doc.page.height - 100) {
    doc.addPage();
    doc.fillColor('#444444');
    position = 50;
  }

  const savings = position;
  generateTableRow(
    doc,
    savings,
    '',
    '',
    '',
    '',
    'Savings',
    formatCurrency(invmrp - subtotal)
  );

  position += 40;

  if (position + 115 > doc.page.height - 100) {
    doc.addPage();
    doc.fillColor('#444444');
    position = 50;
  }

  generateHr2(doc, position);
  generateSide(doc, position);

  position += 10;

  if (position > doc.page.height - 100) {
    doc.addPage();
    doc.fillColor('#444444');
    position = 50;
  }

  const signature = position;
  doc.font('Roboto-Bold');
  generateTableRow(
    doc,
    signature,
    '',
    '',
    '',
    '',
    '',
    'For Grocamie India Private Limited:'
  );

  position += 20;

  if (position > doc.page.height - 100) {
    doc.addPage();
    doc.fillColor('#444444');
    position = 50;
  }

  doc.image('./routes/invoice/signature.jpg', 450, position, { width: 80 });

  position += 65;

  if (position > doc.page.height - 100) {
    doc.addPage();
    doc.fillColor('#444444');
    position = 50;
  }

  const signatory = position;
  doc.font('Roboto-Bold');
  generateTableRow(doc, signatory, '', '', '', '', '', 'Authorized Signatory');

  position += 20;

  if (position > doc.page.height - 100) {
    doc.addPage();
    doc.fillColor('#444444');
    position = 50;
  }

  generateHr2(doc, position);
}

function generateTableRow(doc, y, item, mrp, sp, gst, quantity, total) {
  doc
    .fontSize(10)
    .text(item, 50, y, { width: 120, align: 'left' })
    .text(mrp, 170, y, { width: 50, align: 'right' })
    .text(sp, 220, y, { width: 100, align: 'right' })
    .text(gst, 320, y, { width: 100, align: 'right' })
    .text(quantity, 400, y, { width: 80, align: 'right' })
    .text(total, 0, y, { align: 'right' });
}

function generateHr(doc, y) {
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}

function generateHr2(doc, y) {
  doc.strokeColor('#aaaaaa').lineWidth(2).moveTo(50, y).lineTo(550, y).stroke();
}

function generateSide(doc, y) {
  doc
    .strokeColor('#aaaaaa')
    .lineWidth(2)
    .moveTo(51, y)
    .lineTo(51, y + 115)
    .stroke()

    .strokeColor('#aaaaaa')
    .lineWidth(2)
    .moveTo(549, y)
    .lineTo(549, y + 115)
    .stroke();
}

function formatCurrency(rupee) {
  return ['\u20b9'] + '  ' + rupee.toFixed(2);
  // return (rupee).toFixed(2);
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return day + '/' + month + '/' + year;
}

module.exports = {
  createInvoice,
};
