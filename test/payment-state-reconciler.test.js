const test = require("node:test");
const assert = require("node:assert/strict");
const { reconcilePayments } = require("../payment-state-reconciler");

test("flags PandaDoc paid signal when cash evidence is missing", () => {
  const result = reconcilePayments({
    documents: [{ id: "doc_1", proposal_id: "prop_1", engagement_id: "eng_1", status: "completed", pandadoc_paid: true }],
    proposals: [{ id: "prop_1", total: 995 }],
    engagements: [{ id: "eng_1", paid_to_date: 0 }],
    paymentEvents: []
  });

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, "paid_signal_without_cash_record");
});

test("passes when payment event and CRM total agree", () => {
  const result = reconcilePayments({
    documents: [{ id: "doc_1", proposal_id: "prop_1", engagement_id: "eng_1", status: "completed", payment_status: "paid" }],
    proposals: [{ id: "prop_1", total: 1200 }],
    engagements: [{ id: "eng_1", paid_to_date: 1200 }],
    paymentEvents: [{ engagement_id: "eng_1", status: "succeeded" }]
  });

  assert.deepEqual(result, { ok: true, issues: [] });
});
