const test = require("node:test");
const assert = require("node:assert");
const { buildQuarterChaseBoard } = require("../quarterchase/index.js");

test("buildQuarterChaseBoard creates a quarter-aware RAG board", () => {
  const board = buildQuarterChaseBoard({
    today: "2026-10-31",
    clients: [
      {
        id: "landlord-1",
        name: "Pat Landlord",
        contactName: "Pat",
        segment: "landlord",
        documentsExpected: 4,
        valueAtRiskPence: 40000,
        obligations: {
          q1: { filedAt: "2026-08-03" },
          q2: { documentsReceived: 1, lastChasedAt: "2026-10-21" },
        },
      },
      {
        id: "cis-1",
        name: "Sam CIS",
        contactName: "Sam",
        segment: "cis",
        documentsExpected: 3,
        valueAtRiskPence: 30000,
        obligations: {
          q1: { filedAt: "2026-08-04" },
          q2: { documentsReceived: 3, approvedAt: "2026-10-25" },
        },
      },
    ],
  });

  assert.strictEqual(board.apiVersion, "quarterchase/v0");
  assert.strictEqual(board.summary.totalClients, 2);
  assert.strictEqual(board.summary.byRag.red, 1);
  assert.strictEqual(board.summary.byRag.green, 1);
  assert.strictEqual(board.rows[0].nextDeadline.id, "q2");
  assert.strictEqual(board.rows[0].missingDocuments, 3);
  assert.strictEqual(board.chaseQueue[0].nextAction, "urgent_chase");
  assert.match(board.chaseQueue[0].draft, /7 November 2026/);
});

test("buildQuarterChaseBoard respects the no-double-chase guard", () => {
  const board = buildQuarterChaseBoard({
    today: "2026-10-31",
    clients: [
      {
        id: "recently-chased",
        name: "Recently Chased",
        documentsExpected: 2,
        obligations: {
          q1: { filedAt: "2026-08-01" },
          q2: { documentsReceived: 0, lastChasedAt: "2026-10-30" },
        },
      },
    ],
  });

  assert.strictEqual(board.rows[0].rag, "red");
  assert.strictEqual(board.rows[0].nextAction, "wait_for_reply");
  assert.strictEqual(board.chaseQueue[0].nextAction, "wait_for_reply");
});
