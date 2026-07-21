function normaliseSalesRows(rows) {
  return rows.map((row) => ({
    retailer: row.retailer || row.account || row.customer,
    sku: row.sku || row.product_code || row.product,
    units: Number(row.units_sold || row.units || row.quantity || 0),
    date: row.date || row.week || row.period
  })).filter((row) => row.retailer && row.sku && row.units >= 0 && row.date);
}

function forecastReorders({ salesRows, inventory = [], leadDays = 7, alertDays = 10 }) {
  const normalised = normaliseSalesRows(salesRows);
  const grouped = new Map();

  for (const row of normalised) {
    const key = `${row.retailer}::${row.sku}`;
    const item = grouped.get(key) || { retailer: row.retailer, sku: row.sku, units: 0, observations: 0 };
    item.units += row.units;
    item.observations += 1;
    grouped.set(key, item);
  }

  return Array.from(grouped.values()).map((item) => {
    const stock = inventory.find((entry) => entry.retailer === item.retailer && entry.sku === item.sku)?.on_hand || 0;
    const dailyVelocity = item.units / Math.max(item.observations, 1);
    const daysOfCover = dailyVelocity > 0 ? stock / dailyVelocity : Infinity;
    const reorderInDays = Math.max(0, Math.floor(daysOfCover - leadDays));

    return {
      retailer: item.retailer,
      sku: item.sku,
      daily_velocity: Math.round(dailyVelocity * 100) / 100,
      days_of_cover: Number.isFinite(daysOfCover) ? Math.round(daysOfCover * 10) / 10 : null,
      reorder_in_days: Number.isFinite(daysOfCover) ? reorderInDays : null,
      alert: Number.isFinite(daysOfCover) && reorderInDays <= alertDays
    };
  });
}

module.exports = { normaliseSalesRows, forecastReorders };
