function normaliseMoney(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.round(number * 100) / 100 : 0;
}

function hasSettledPayment(events, engagementId) {
  return events.some((event) => {
    return event.engagement_id === engagementId && ["paid", "settled", "succeeded"].includes(event.status);
  });
}

function reconcilePayments({ documents = [], proposals = [], engagements = [], paymentEvents = [] }) {
  const proposalsById = new Map(proposals.map((proposal) => [proposal.id, proposal]));
  const engagementsById = new Map(engagements.map((engagement) => [engagement.id, engagement]));
  const issues = [];

  for (const document of documents) {
    const proposal = proposalsById.get(document.proposal_id);
    const engagement = engagementsById.get(document.engagement_id);
    const paidSignal = ["paid", "completed_paid"].includes(document.payment_status) || document.pandadoc_paid === true;
    const completed = ["completed", "paid"].includes(document.status);

    if (!engagement || !proposal || !(completed && paidSignal)) {
      continue;
    }

    const paidToDate = normaliseMoney(engagement.paid_to_date);
    const expectedTotal = normaliseMoney(proposal.total);
    const settledEvent = hasSettledPayment(paymentEvents, engagement.id);
    const discount = normaliseMoney(proposal.discount || document.discount);

    if (!settledEvent || paidToDate <= 0) {
      issues.push({
        severity: "blocker",
        code: "paid_signal_without_cash_record",
        engagement_id: engagement.id,
        proposal_id: proposal.id,
        message: "PandaDoc indicates payment, but CRM cash evidence is missing.",
        required_action: "Founder or accounting verification before delivery/revenue state advances."
      });
    }

    if (settledEvent && expectedTotal > 0 && paidToDate > 0 && paidToDate !== expectedTotal) {
      issues.push({
        severity: "warning",
        code: "paid_total_mismatch",
        engagement_id: engagement.id,
        expected_total: expectedTotal,
        paid_to_date: paidToDate
      });
    }

    if (discount > 0 && document.discount_authorised !== true) {
      issues.push({
        severity: "warning",
        code: "unverified_discount",
        proposal_id: proposal.id,
        discount
      });
    }
  }

  return { ok: issues.length === 0, issues };
}

module.exports = { reconcilePayments };
