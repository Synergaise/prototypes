const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createApplication,
  advanceApplication,
  visibleStatus,
  progressFor
} = require('../tenancy-application-tracker');

test('creates a shared source-of-truth application with legal holding deposit cap', () => {
  const app = createApplication({
    id: 'app-1',
    property: 'Elephant & Castle flat',
    applicant: 'Jude',
    landlord: 'Landlord Ltd',
    weeklyRentPence: 65000,
    holdingDepositPence: 65000
  });

  assert.equal(app.stage, 'draft');
  assert.equal(app.holdingDepositPence, 65000);
  assert.equal(app.timeline.length, 1);
  assert.throws(() => createApplication({
    property: 'Flat',
    applicant: 'Tenant',
    landlord: 'Owner',
    weeklyRentPence: 50000,
    holdingDepositPence: 50001
  }), /one week of rent/);
});

test('advances linearly and exposes one next action', () => {
  const app = createApplication({
    id: 'app-2',
    property: 'Flat',
    applicant: 'Tenant',
    landlord: 'Owner',
    weeklyRentPence: 50000
  });

  const submitted = advanceApplication(app, 'submitted', { at: '2026-08-12T18:35:00Z' });
  const paid = advanceApplication(submitted, 'holding_deposit_paid');
  const referencing = advanceApplication(paid, 'referencing', {
    tasks: [{ id: 'bank', owner: 'tenant', label: 'Upload bank statement' }]
  });

  const tenantView = visibleStatus(referencing, 'tenant');
  assert.equal(tenantView.nextAction.owner, 'tenant');
  assert.equal(tenantView.blockers[0].label, 'Upload bank statement');
  assert.ok(progressFor('referencing') > progressFor('submitted'));
  assert.throws(() => advanceApplication(referencing, 'accepted'), /cannot move/);
});
