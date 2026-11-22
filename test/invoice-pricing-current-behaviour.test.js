var test = require('node:test');
var assert = require('node:assert/strict');

var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');
var reports = require('../lib/reports');

function riceOrder() {
  return {
    id: 9001,
    date: '01/01/2022',
    customer: 'Test Customer',
    coupon: 'SAVE10',
    items: [{
      id: 1,
      sku: 'RICE-1',
      name: 'Rice',
      hsn: '1006',
      price: 1000,
      qty: 1
    }]
  };
}

test('invoice total and GST breakdown match the billed order for HSN-priced items', function () {
  var order = riceOrder();
  var billed = pricing.computeTotals(order.items, order.coupon);
  var printed = invoice.computeInvoiceFigures(order);

  assert.equal(printed.tax, billed.tax);
  assert.equal(printed.cgst, billed.cgst);
  assert.equal(printed.sgst, billed.sgst);
  assert.equal(printed.total, billed.total);
});

test('invoice uses the HSN GST slab and coupon totals used for billing', function () {
  var order = riceOrder();
  var billed = pricing.computeTotals(order.items, order.coupon);
  var printed = invoice.computeInvoiceFigures(order);

  assert.deepEqual(billed, {
    subtotal: 1000,
    discount: 100,
    taxable: 900,
    tax: 45,
    cgst: 22.5,
    sgst: 22.5,
    total: 945,
    lines: [{
      id: 1,
      name: 'Rice',
      hsn: '1006',
      gstPercent: 5,
      gross: 1000,
      discount: 100,
      taxable: 900,
      tax: 45,
      net: 945
    }]
  });
  assert.deepEqual(printed, {
    subtotal: 1000,
    discount: 100,
    tax: 45,
    cgst: 22.5,
    sgst: 22.5,
    total: 945,
    rows: [{
      name: 'Rice',
      sku: 'RICE-1',
      hsn: '1006',
      qty: 1,
      price: 1000,
      gstPercent: 5,
      line: 1000,
      lineTax: 45
    }]
  });
});

test('invoice preserves a decimal gstRate used by billing', function () {
  var items = [{
    id: 2,
    name: 'Rice with decimal rate',
    hsn: '1006',
    gstRate: 0.05,
    price: 1000,
    qty: 1
  }];

  var billed = pricing.computeTotals(items, '');
  var printed = invoice.computeInvoiceFigures({ items: items, coupon: '' });

  assert.equal(billed.tax, 50);
  assert.equal(billed.total, 1050);
  assert.equal(printed.rows[0].gstPercent, 5);
  assert.equal(printed.tax, 50);
  assert.equal(printed.total, 1050);
});

test('invoice applies coupon caps and calculates tax on the discounted value', function () {
  var items = [{
    id: 3,
    name: 'Tea',
    hsn: '0902',
    price: 3000,
    qty: 1
  }];

  var billed = pricing.computeTotals(items, 'SAVE10');
  var printed = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });

  assert.equal(billed.discount, 150);
  assert.equal(billed.tax, 513);
  assert.equal(billed.total, 3363);
  assert.equal(printed.discount, 150);
  assert.equal(printed.tax, 513);
  assert.equal(printed.total, 3363);
});

test('reconciliation marks matching billed and invoice figures as matched', function () {
  var order = riceOrder();
  var billed = pricing.computeTotals(order.items, order.coupon);
  order.subtotal = billed.subtotal;
  order.discount = billed.discount;
  order.tax = billed.tax;
  order.total = billed.total;

  var reconciliation = reports.getGstReconciliation({ orders: [order] });

  assert.equal(reconciliation.totalChecked, 1);
  assert.equal(reconciliation.mismatchCount, 0);
  assert.equal(reconciliation.totalDelta, 0);
  assert.deepEqual(reconciliation.rows[0], {
    orderId: 9001,
    date: '01/01/2022',
    customer: 'Test Customer',
    coupon: 'SAVE10',
    ledgerSubtotal: 1000,
    ledgerDiscount: 100,
    ledgerTax: 45,
    ledgerTotal: 945,
    invoiceDiscount: 100,
    invoiceTax: 45,
    invoiceTotal: 945,
    delta: 0,
    matched: true
  });
});
