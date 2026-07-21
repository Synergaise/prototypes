const test = require("node:test");
const assert = require("node:assert/strict");
const { normaliseSalesRows, forecastReorders } = require("../booze-distributor-sales-data");

test("normalises common retailer sell-out field names", () => {
  assert.deepEqual(normaliseSalesRows([{ account: "Retailer A", product_code: "IPA-24", quantity: "12", week: "2026-W29" }]), [
    { retailer: "Retailer A", sku: "IPA-24", units: 12, date: "2026-W29" }
  ]);
});

test("forecasts reorder risk from velocity and stock", () => {
  const result = forecastReorders({
    salesRows: [
      { retailer: "Retailer A", sku: "IPA-24", units: 10, date: "2026-07-01" },
      { retailer: "Retailer A", sku: "IPA-24", units: 14, date: "2026-07-02" }
    ],
    inventory: [{ retailer: "Retailer A", sku: "IPA-24", on_hand: 96 }],
    leadDays: 5,
    alertDays: 4
  });

  assert.equal(result[0].daily_velocity, 12);
  assert.equal(result[0].reorder_in_days, 3);
  assert.equal(result[0].alert, true);
});
