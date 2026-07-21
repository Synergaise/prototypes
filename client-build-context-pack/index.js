const REQUIRED_SECTIONS = [
  "architecture",
  "field_maps",
  "formulas",
  "decisions",
  "risks",
  "access_state",
  "source_links",
  "next_actions"
];

function compactList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function createBuildContextPack({ client, build, notes = [], transcripts = [], externalRefs = [] }) {
  const pack = {
    client: {
      id: client.id,
      name: client.name,
      owner: client.owner,
      stage: client.stage
    },
    build: {
      id: build.id,
      name: build.name,
      stage: build.stage,
      summary: build.summary || "",
      architecture: build.architecture || "",
      blockers: build.blockers || ""
    },
    architecture: build.architecture || "",
    field_maps: compactList(build.field_maps),
    formulas: compactList(build.formulas),
    decisions: compactList(build.decisions).concat(notes.filter((note) => note.kind === "decision").map((note) => note.body)),
    risks: compactList(build.risks).concat(notes.filter((note) => note.kind === "risk").map((note) => note.body)),
    access_state: build.access_state || "unknown",
    source_links: externalRefs.map((ref) => ({ system: ref.system, url: ref.url || ref.external_id })),
    next_actions: compactList(build.next_actions || build.next_action ? [build.next_action] : []),
    recent_context: notes.slice(0, 5).map((note) => note.body).concat(transcripts.slice(0, 2).map((item) => item.summary)).filter(Boolean)
  };

  return { pack, completeness: scoreCompleteness(pack) };
}

function scoreCompleteness(pack) {
  const present = REQUIRED_SECTIONS.filter((section) => {
    const value = pack[section];
    return Array.isArray(value) ? value.length > 0 : Boolean(value && value !== "unknown");
  });

  return {
    required: REQUIRED_SECTIONS.length,
    present: present.length,
    missing: REQUIRED_SECTIONS.filter((section) => !present.includes(section))
  };
}

module.exports = { createBuildContextPack, scoreCompleteness, REQUIRED_SECTIONS };
