const DEFAULT_DEADLINES = [
  { id: "q1", label: "Q1", dueDate: "2026-08-07" },
  { id: "q2", label: "Q2", dueDate: "2026-11-07" },
  { id: "q3", label: "Q3", dueDate: "2027-02-07" },
  { id: "q4", label: "Q4", dueDate: "2027-05-07" },
];

const STATUS_RANK = {
  red: 0,
  amber: 1,
  green: 2,
  filed: 3,
};

function buildQuarterChaseBoard(input = {}) {
  const today = toDateOnly(input.today || new Date().toISOString().slice(0, 10));
  const deadlines = normaliseDeadlines(input.deadlines || DEFAULT_DEADLINES);
  const clients = Array.isArray(input.clients) ? input.clients : [];
  const rows = clients.map((client) => buildClientRow(client, deadlines, today));
  const chaseQueue = rows
    .filter((row) => row.nextAction !== "none")
    .sort(compareChasePriority)
    .map((row) => ({
      clientId: row.clientId,
      clientName: row.clientName,
      segment: row.segment,
      deadlineId: row.nextDeadline.id,
      dueDate: row.nextDeadline.dueDate,
      rag: row.rag,
      daysUntilDue: row.daysUntilDue,
      valueAtRiskPence: row.valueAtRiskPence,
      nextAction: row.nextAction,
      draft: draftChaseMessage(row),
    }));

  return {
    apiVersion: "quarterchase/v0",
    generatedFor: today,
    deadlines,
    summary: summariseRows(rows),
    rows,
    chaseQueue,
  };
}

function buildClientRow(client, deadlines, today) {
  const obligations = client.obligations && typeof client.obligations === "object" ? client.obligations : {};
  const nextDeadline = findNextDeadline(deadlines, obligations, today);
  const obligation = obligations[nextDeadline.id] || {};
  const daysUntilDue = daysBetween(today, nextDeadline.dueDate);
  const documentsReceived = Number(obligation.documentsReceived || 0);
  const documentsExpected = Math.max(Number(obligation.documentsExpected || client.documentsExpected || 0), 0);
  const missingDocuments = Math.max(documentsExpected - documentsReceived, 0);
  const filed = Boolean(obligation.filedAt);
  const approved = Boolean(obligation.approvedAt);
  const lastChasedAt = obligation.lastChasedAt || client.lastChasedAt || null;
  const rag = scoreRag({ filed, approved, missingDocuments, daysUntilDue, lastChasedAt, today });

  return {
    clientId: String(client.id || client.name || "unknown"),
    clientName: String(client.name || "Unknown client"),
    segment: client.segment || "general",
    contactName: client.contactName || client.name || "there",
    email: client.email || null,
    nextDeadline,
    daysUntilDue,
    documentsExpected,
    documentsReceived,
    missingDocuments,
    valueAtRiskPence: Number(client.valueAtRiskPence || 0),
    rag,
    nextAction: chooseNextAction({ rag, filed, approved, missingDocuments, lastChasedAt, today }),
    lastChasedAt,
  };
}

function scoreRag({ filed, approved, missingDocuments, daysUntilDue, lastChasedAt, today }) {
  if (filed) return "filed";
  if (approved && missingDocuments === 0) return "green";
  if (daysUntilDue < 0) return "red";
  if (daysUntilDue <= 7 && missingDocuments > 0) return "red";
  if (daysUntilDue <= 21 && missingDocuments > 0) return "amber";
  if (lastChasedAt && daysBetween(lastChasedAt, today) <= 3 && missingDocuments > 0) return "amber";
  if (missingDocuments > 0) return "amber";
  return "green";
}

function chooseNextAction({ rag, filed, approved, missingDocuments, lastChasedAt, today }) {
  if (filed || (approved && missingDocuments === 0)) return "none";
  if (lastChasedAt && daysBetween(lastChasedAt, today) < 3) return "wait_for_reply";
  if (rag === "red") return "urgent_chase";
  if (missingDocuments > 0) return "standard_chase";
  return "approval_chase";
}

function draftChaseMessage(row) {
  const itemText = row.missingDocuments === 1 ? "one item" : `${row.missingDocuments} items`;
  const due = formatUkDate(row.nextDeadline.dueDate);
  if (row.nextAction === "approval_chase") {
    return `Hi ${row.contactName}, we have what we need for your ${row.nextDeadline.label} MTD update. Please confirm we can proceed before ${due}.`;
  }
  if (row.nextAction === "urgent_chase") {
    return `Hi ${row.contactName}, your ${row.nextDeadline.label} MTD update is due on ${due}. We still need ${itemText} to keep this on track.`;
  }
  return `Hi ${row.contactName}, quick reminder that we still need ${itemText} for your ${row.nextDeadline.label} MTD update due ${due}.`;
}

function findNextDeadline(deadlines, obligations, today) {
  return (
    deadlines.find((deadline) => {
      const obligation = obligations[deadline.id] || {};
      return !obligation.filedAt && daysBetween(today, deadline.dueDate) >= -30;
    }) || deadlines[deadlines.length - 1]
  );
}

function summariseRows(rows) {
  const byRag = rows.reduce(
    (acc, row) => {
      acc[row.rag] += 1;
      return acc;
    },
    { red: 0, amber: 0, green: 0, filed: 0 },
  );
  const valueAtRiskPence = rows
    .filter((row) => row.rag === "red" || row.rag === "amber")
    .reduce((sum, row) => sum + row.valueAtRiskPence, 0);

  return {
    totalClients: rows.length,
    byRag,
    needsChase: rows.filter((row) => row.nextAction === "urgent_chase" || row.nextAction === "standard_chase").length,
    valueAtRiskPence,
  };
}

function compareChasePriority(a, b) {
  if (STATUS_RANK[a.rag] !== STATUS_RANK[b.rag]) return STATUS_RANK[a.rag] - STATUS_RANK[b.rag];
  if (a.daysUntilDue !== b.daysUntilDue) return a.daysUntilDue - b.daysUntilDue;
  return b.valueAtRiskPence - a.valueAtRiskPence;
}

function normaliseDeadlines(deadlines) {
  return deadlines.map((deadline) => ({
    id: String(deadline.id),
    label: String(deadline.label || deadline.id).toUpperCase(),
    dueDate: toDateOnly(deadline.dueDate),
  }));
}

function daysBetween(start, end) {
  const millis = Date.parse(toDateOnly(end)) - Date.parse(toDateOnly(start));
  return Math.round(millis / 86400000);
}

function formatUkDate(date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(Date.parse(date));
}

function toDateOnly(value) {
  const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
  if (!match) throw new Error(`Invalid date: ${value}`);
  return match[0];
}

module.exports = { DEFAULT_DEADLINES, buildQuarterChaseBoard };
