const STAGE_ORDER = [
  'draft',
  'submitted',
  'holding_deposit_paid',
  'referencing',
  'landlord_review',
  'accepted',
  'deposit_protection',
  'move_in_ready',
  'rejected'
];

const TERMINAL_STAGES = new Set(['move_in_ready', 'rejected']);

function createApplication(input = {}) {
  const weeklyRentPence = positiveInt(input.weeklyRentPence, 'weeklyRentPence');
  const holdingDepositPence = input.holdingDepositPence == null
    ? weeklyRentPence
    : positiveInt(input.holdingDepositPence, 'holdingDepositPence');

  if (holdingDepositPence > weeklyRentPence) {
    throw new Error('holding deposit must not exceed one week of rent');
  }

  return {
    id: input.id || `app_${Date.now()}`,
    property: required(input.property, 'property'),
    applicant: required(input.applicant, 'applicant'),
    landlord: required(input.landlord, 'landlord'),
    weeklyRentPence,
    holdingDepositPence,
    stage: 'draft',
    timeline: [{
      stage: 'draft',
      at: input.createdAt || new Date().toISOString(),
      actor: input.actor || 'system',
      note: 'Application opened'
    }],
    tasks: normaliseTasks(input.tasks || [])
  };
}

function advanceApplication(application, nextStage, details = {}) {
  if (!STAGE_ORDER.includes(nextStage)) throw new Error(`unknown stage: ${nextStage}`);
  if (TERMINAL_STAGES.has(application.stage)) {
    throw new Error(`application is terminal at ${application.stage}`);
  }
  if (!canMove(application.stage, nextStage)) {
    throw new Error(`cannot move ${application.stage} to ${nextStage}`);
  }

  const updated = {
    ...application,
    stage: nextStage,
    timeline: [
      ...application.timeline,
      {
        stage: nextStage,
        at: details.at || new Date().toISOString(),
        actor: details.actor || 'system',
        note: details.note || defaultStageNote(nextStage)
      }
    ],
    tasks: normaliseTasks(details.tasks || application.tasks)
  };

  return {
    ...updated,
    nextAction: nextActionFor(updated)
  };
}

function visibleStatus(application, viewer = 'tenant') {
  const nextAction = nextActionFor(application);
  return {
    applicationId: application.id,
    viewer,
    property: application.property,
    stage: application.stage,
    progress: progressFor(application.stage),
    nextAction,
    blockers: application.tasks.filter((task) => task.status !== 'done'),
    timeline: application.timeline.map(({ stage, at, note }) => ({ stage, at, note }))
  };
}

function nextActionFor(application) {
  const open = application.tasks.find((task) => task.status !== 'done');
  if (open) return { owner: open.owner, label: open.label, dueAt: open.dueAt || null };

  switch (application.stage) {
    case 'draft':
      return { owner: 'tenant', label: 'Complete application details', dueAt: null };
    case 'submitted':
      return { owner: 'tenant', label: 'Pay holding deposit', dueAt: null };
    case 'holding_deposit_paid':
      return { owner: 'referencing', label: 'Run referencing checks', dueAt: null };
    case 'referencing':
      return { owner: 'landlord', label: 'Review referencing result', dueAt: null };
    case 'landlord_review':
      return { owner: 'landlord', label: 'Accept or reject applicant', dueAt: null };
    case 'accepted':
      return { owner: 'system', label: 'Register security deposit protection', dueAt: null };
    case 'deposit_protection':
      return { owner: 'tenant', label: 'Confirm move-in readiness', dueAt: null };
    default:
      return { owner: 'none', label: 'No action required', dueAt: null };
  }
}

function progressFor(stage) {
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx < 0) return 0;
  if (stage === 'rejected') return 100;
  return Math.round((idx / (STAGE_ORDER.length - 2)) * 100);
}

function canMove(current, next) {
  if (next === 'rejected') return current !== 'draft';
  return STAGE_ORDER.indexOf(next) === STAGE_ORDER.indexOf(current) + 1;
}

function normaliseTasks(tasks) {
  return tasks.map((task) => ({
    id: required(task.id, 'task.id'),
    owner: required(task.owner, 'task.owner'),
    label: required(task.label, 'task.label'),
    status: task.status || 'open',
    dueAt: task.dueAt || null
  }));
}

function required(value, name) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${name} is required`);
  return value.trim();
}

function positiveInt(value, name) {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

function defaultStageNote(stage) {
  return stage.split('_').join(' ');
}

module.exports = {
  STAGE_ORDER,
  createApplication,
  advanceApplication,
  visibleStatus,
  nextActionFor,
  progressFor
};
