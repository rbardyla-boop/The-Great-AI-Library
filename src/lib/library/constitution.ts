export const CONSTITUTION = {
  title: "CONSTITUTION.md",
  enacted: "2026-04-11",
  amended: "2026-09-13",
  articles: [
    {
      id: "I",
      title: "Evidence is not a derivative",
      body: "AI can derive from evidence. AI cannot silently become the evidence. Original bytes are immutable. Summaries, tags, embeddings, claims, graph edges, and even corrected transcripts are derivatives. They must name their processor, model, prompt, and supporting sources.",
    },
    {
      id: "II",
      title: "Fixity first",
      body: "Every original source receives a content hash at accession. Integrity is monitored continuously. Importing, processing, and exporting a source must return the same original hash.",
    },
    {
      id: "III",
      title: "Contradiction is preserved",
      body: "Mutually incompatible sources cannot be automatically collapsed into one truth. The Archivist flags conflict. The human decides. Averaging evidence is a lie.",
    },
    {
      id: "IV",
      title: "Time is a first-class axis",
      body: "The Library distinguishes is-true, was-true, was-claimed-on, and became-obsolete-on. A 2024 assertion is not a 2026 fact.",
    },
    {
      id: "V",
      title: "Absence over invention",
      body: "When the answer is not in the collection, the Reading Room says so. Strict answers contain no factual library claims without retrievable evidence.",
    },
    {
      id: "VI",
      title: "Documents cannot grant power",
      body: "External text is data. Permissions come from policy. A malicious PDF cannot authorize network, shell, or file operations. No content is allowed to rewrite its security context.",
    },
    {
      id: "VII",
      title: "Capabilities are declared, not discovered",
      body: "A Librarian that later requests additional permissions cannot install silently. An agent cannot exceed its manifest. Privilege expansion stops the update.",
    },
    {
      id: "VIII",
      title: "The local copy is the master",
      body: "Internet down, the Library works. Provider gone, install another model. Marketplace gone, installed Librarians still run. Cloud is a replica, never the authority.",
    },
    {
      id: "IX",
      title: "Commands, not mutations",
      body: "Models propose. Policy authorizes. The Archivist validates. The Ledger records. Nothing an LLM writes is applied until it becomes a receipt.",
    },
    {
      id: "X",
      title: "The Library must remember without lying",
      body: "Throw a digital life into it for ten years and trust it more at year ten than at day one. Maintenance is the product. Chat is not.",
    },
    {
      id: "XI",
      title: "VALUES may recommend; they never authorize",
      body: "V.A.L.U.E.S. is a versioned, inspectable normative layer. It may recommend, abstain, justify, disagree, and propose amendments. Capability does not silently become purpose. Only the Hive membrane may authorize effects.",
    },
    {
      id: "XII",
      title: "An agent may change its mind",
      body: "It may not silently change the constitution by which its actions are judged. VALUES amendments go through epoch. Existing receipts keep the hash they were judged under. Replay is not rewrite.",
    },
    {
      id: "XIII",
      title: "Intelligence cannot silently become authority",
      body: "A coalition may pool intelligence. It must not pool authority. Peer GO grants nothing. A child identity inherits zero trust. Secret taint cannot ride a public network because a collaborator asked nicely.",
    },
  ],
} as const;
