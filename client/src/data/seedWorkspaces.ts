import { Workspace } from '../types';

export const SEED_WORKSPACES: Record<string, Workspace> = {
  'workspace-distributed-systems': {
    id: 'workspace-distributed-systems',
    title: 'Distributed Consensus: Raft vs Paxos & Consistency Frontiers',
    domainContext: 'distributed_systems',
    description: 'Deep-dive investigation of leader leases, linearizability bounds, clock drift under TrueTime, and crash-recovery protocols.',
    activeNodeId: 'node-ds-2a',
    viewport: { x: 50, y: 150, zoom: 0.9 },
    nodes: {
      'node-ds-root': {
        id: 'node-ds-root',
        workspaceId: 'workspace-distributed-systems',
        parentId: null,
        branchId: 'branch-main',
        branchName: 'Main Lineage',
        depth: 0,
        role: 'user',
        status: 'completed',
        rawContent: 'Analyze the architectural trade-offs between Multi-Paxos and Raft regarding leader leases, split-brain mitigation during network partitions, and commit-wait latencies.',
        tokenCount: 42,
        position: { x: 50, y: 220 },
        createdAt: '2026-10-12T10:00:00Z',
      },
      'node-ds-1': {
        id: 'node-ds-1',
        workspaceId: 'workspace-distributed-systems',
        parentId: 'node-ds-root',
        branchId: 'branch-main',
        branchName: 'Main Lineage',
        depth: 1,
        role: 'assistant',
        status: 'completed',
        rawContent: `### Consensus Foundations: Raft vs. Multi-Paxos

Both Multi-Paxos and Raft establish **State Machine Replication (SMR)** across fail-stop nodes over asynchronous networks with bounded message loss. However, their structural invariants diverge significantly:

1. **Leader Primacy & Log Discrepancies:**
   - **Raft:** Enforces the strict *Leader Completeness Property*. A candidate can only be elected if its log contains all committed entries from prior terms. Logs never have holes; followers overwrite uncommitted indices monotonically.
   - **Multi-Paxos:** Decouples consensus from continuous log ordering. Independent consensus instances run per log slot. Unchosen proposals can create log holes that must be resolved via no-op proposals during leader catch-up.

2. **Leader Lease Guarantees & Split-Brain:**
   To serve linearizable read queries without quorum roundtrips, the primary maintains a **leader lease**. If a minority partition occurs, the partitioned leader relies on its local monotonic clock to serve reads until lease expiration.

3. **Crash Recovery Protocols:**
   Upon crash-recovery, a Raft replica must replay its write-ahead log (WAL) and preserve term metadata to prevent granting duplicate votes. System X requires pessimistic 2PL with WAL replay to preserve serializability during snapshot restoration.`,
        tokenCount: 285,
        retrievalRecord: {
          id: 'ret-ds-1',
          nodeId: 'node-ds-1',
          queryText: 'Multi-Paxos vs Raft leader lease linearizability SMR properties',
          retrievalTrigger: 'SAIL_INIT',
          rawPassages: [
            'Ongaro & Ousterhout (USENIX ATC 2014): In Search of an Understandable Consensus Algorithm.',
            'Lamport (ACM TOCS 1998): The Part-Time Parliament.',
          ],
          evaluationStatus: 'correct',
          evaluationScore: 0.94,
          refinedEvidence: 'Leader leases require bounded clock drift; Raft log completeness ensures monotonically increasing term validation.',
          createdAt: '2026-10-12T10:00:05Z',
        },
        ghostNodes: [
          {
            id: 'ghost-ds-1',
            parentNodeId: 'node-ds-1',
            label: 'Byzantine Fault Injection',
            suggestedPrompt: 'Stress-test Byzantine fault conditions: Can Raft guarantee safety under adversarial message fabrication without BFT signatures?',
            vectorType: 'critical_counter',
            reasoning: 'Probes fundamental vulnerability of crash-fault tolerance models when confronted with active Byzantine manipulation.',
            isMaterialized: false,
            position: { x: 780, y: 110 },
          },
          {
            id: 'ghost-ds-2',
            parentNodeId: 'node-ds-1',
            label: 'TLA+ Invariant Specification',
            suggestedPrompt: 'Formulate the TLA+ temporal logic specification proving Raft ElectionSafety and LeaderCompleteness invariants.',
            vectorType: 'mechanistic_deepdive',
            reasoning: 'Drills down into mechanical mathematical proofs verifying state transition invariants.',
            isMaterialized: false,
            position: { x: 780, y: 220 },
          },
          {
            id: 'ghost-ds-3',
            parentNodeId: 'node-ds-1',
            label: 'CRDT Gossip Synthesis',
            suggestedPrompt: 'Map Raft term changes to distributed delta-CRDT counter epochs in partially-connected P2P gossip networks.',
            vectorType: 'adjacent_transfer',
            reasoning: 'Cross-applies leader election concepts to peer-to-peer event-driven convergence systems.',
            isMaterialized: false,
            position: { x: 780, y: 330 },
          },
        ],
        position: { x: 420, y: 220 },
        createdAt: '2026-10-12T10:00:06Z',
      },
      'node-ds-fork-2a': {
        id: 'node-ds-fork-2a',
        workspaceId: 'workspace-distributed-systems',
        parentId: 'node-ds-1',
        branchId: 'branch-truetime',
        branchName: 'TrueTime & Clock Drift',
        depth: 2,
        role: 'user',
        status: 'completed',
        rawContent: 'How does physical clock drift invalidate leader leases, and how does Google Spanner TrueTime calculate commit-wait latency?',
        tokenCount: 34,
        selectionAnchor: {
          parentNodeId: 'node-ds-1',
          selectedText: 'leader lease. If a minority partition occurs, the partitioned leader relies on its local monotonic clock to serve reads until lease expiration.',
          startOffset: 610,
          endOffset: 775,
          contextSnippet: {
            prefix: 'quorum roundtrips, the primary maintains a ',
            suffix: '\n\n3. **Crash Recovery Protocols:**',
          },
        },
        position: { x: 800, y: 80 },
        createdAt: '2026-10-12T10:01:20Z',
      },
      'node-ds-2a': {
        id: 'node-ds-2a',
        workspaceId: 'workspace-distributed-systems',
        parentId: 'node-ds-fork-2a',
        branchId: 'branch-truetime',
        branchName: 'TrueTime & Clock Drift',
        depth: 3,
        role: 'assistant',
        status: 'completed',
        rawContent: `### Clock Drift Vulnerabilities & TrueTime Commit-Wait Mechanics

When a network partition isolates a Raft leader, relying purely on unsynchronized local quartz clocks risks **stale reads** or dual-leader split-brain if the leader's clock runs slower than the remaining quorum electing a new leader.

#### 1. Clock Uncertainty Bounds ($\\epsilon$)
In conventional NTP environments, clock drift uncertainty can spike to hundreds of milliseconds. Google Spanner resolves this using **TrueTime API**, which returns time as an interval $[t.earliest, t.latest]$ where:

$$\\text{uncertainty } \\epsilon = \\frac{t.latest - t.earliest}{2} \\approx 1\\text{ to } 7\\,\\text{ms}$$

#### 2. Commit-Wait Rule Formula
To guarantee external consistency (linearizability across transactions $T_1 \\to T_2$ where $T_1$ commits before $T_2$ starts):

$$\\text{Commit Wait} = 2 \\times \\epsilon$$

[TOOL:algebra_eval(expression="2 * 7 + 3")]
[RESULT: 17ms]

With standard GPS receiver sync and drift safety buffer, the transaction coordinator intentionally delays releasing its locks by **17ms**, guaranteeing that any timestamp assigned by future coordinators will strictly exceed $T_1$'s timestamp without atomic cross-datacenter clock negotiations.`,
        tokenCount: 240,
        toolInvocations: [
          {
            id: 'tool-ds-alg-1',
            nodeId: 'node-ds-2a',
            toolName: 'algebra_eval',
            parameters: { expression: '2 * 7 + 3' },
            executionResult: '17',
            status: 'success',
            executionDurationMs: 4,
            createdAt: '2026-10-12T10:01:25Z',
          },
        ],
        retrievalRecord: {
          id: 'ret-ds-2a',
          nodeId: 'node-ds-2a',
          queryText: 'Google Spanner TrueTime commit wait formula epsilon bounded clock drift',
          retrievalTrigger: 'FLARE',
          rawPassages: [
            'Corbett et al. (OSDI 2012): Spanner: Google\'s Globally-Distributed Database.',
          ],
          evaluationStatus: 'correct',
          evaluationScore: 0.98,
          refinedEvidence: 'TrueTime guarantees linearizability by enforcing commit wait duration exceeding twice the maximum clock error bound epsilon.',
          createdAt: '2026-10-12T10:01:24Z',
        },
        ghostNodes: [
          {
            id: 'ghost-ds-2a-1',
            parentNodeId: 'node-ds-2a',
            label: 'Hybrid Logical Clocks (HLC)',
            suggestedPrompt: 'Analyze how CockroachDB implements Hybrid Logical Clocks (HLC) to mitigate physical clock drift without GPS hardware.',
            vectorType: 'mechanistic_deepdive',
            reasoning: 'Explores hardware-independent software clock synchronization protocols.',
            isMaterialized: false,
            position: { x: 1180, y: 50 },
          },
        ],
        position: { x: 1180, y: 80 },
        createdAt: '2026-10-12T10:01:28Z',
      },
      'node-ds-fork-2b': {
        id: 'node-ds-fork-2b',
        workspaceId: 'workspace-distributed-systems',
        parentId: 'node-ds-1',
        branchId: 'branch-wal-recovery',
        branchName: 'WAL Crash Recovery',
        depth: 2,
        role: 'user',
        status: 'completed',
        rawContent: 'Explain disk persistence guarantees if a node experiences power loss during fsync. Why did you specify pessimistic 2PL in your earlier turn?',
        tokenCount: 30,
        selectionAnchor: {
          parentNodeId: 'node-ds-1',
          selectedText: 'System X requires pessimistic 2PL with WAL replay to preserve serializability during snapshot restoration.',
          startOffset: 890,
          endOffset: 1005,
          contextSnippet: {
            prefix: 'granting duplicate votes. ',
            suffix: '',
          },
        },
        position: { x: 800, y: 380 },
        createdAt: '2026-10-12T10:02:40Z',
      },
      'node-ds-2b': {
        id: 'node-ds-2b',
        workspaceId: 'workspace-distributed-systems',
        parentId: 'node-ds-fork-2b',
        branchId: 'branch-wal-recovery',
        branchName: 'WAL Crash Recovery',
        depth: 3,
        role: 'assistant',
        status: 'completed',
        rawContent: `### Crash-Recovery Invariants & Concurrency Contrasts

In crash-fault-tolerant (CFT) clusters, write durability is anchored on the OS barrier guarantees of \`fsync()\`:

1. **Write-Ahead Log (WAL) Guarantees:**
   Before a Raft follower acknowledges an \`AppendEntries\` RPC, the log payload and the active term must be flushed to non-volatile media. If power cuts mid-sync, sector corruption is detected via CRC32 checksums, and the trailing uncommitted partial entry is truncated.

2. **Concurrency Control Architecture:**
   While classic state machines apply committed log commands deterministically (single-threaded state transition), high-throughput systems like Spanner or TiDB decouple consensus from execution using optimistic MVCC or distributed 2-Phase Locking (2PL). 
   
   *Notice:* In branch 1A we detailed optimistic commit-wait ordering, whereas here pessimistic 2PL requires exclusive write locks held across network roundtrips.`,
        tokenCount: 215,
        toolInvocations: [
          {
            id: 'tool-ds-py-1',
            nodeId: 'node-ds-2b',
            toolName: 'python_sandbox',
            parameters: { script: 'def check_wal_crc(payload): return sum(payload.encode()) % 65535\nprint("CRC Checksum:", check_wal_crc("term=4;idx=1202"))' },
            executionResult: 'CRC Checksum: 14210 (Integrity Validated)',
            status: 'success',
            executionDurationMs: 12,
            createdAt: '2026-10-12T10:02:45Z',
          },
        ],
        position: { x: 1180, y: 380 },
        createdAt: '2026-10-12T10:02:47Z',
      },
    },
    insightEdges: [
      {
        id: 'insight-ds-1',
        workspaceId: 'workspace-distributed-systems',
        sourceNodeId: 'node-ds-2a',
        targetNodeId: 'node-ds-2b',
        insightType: 'contradiction',
        title: 'Concurrency Model Divergence: Optimistic TrueTime vs. Pessimistic 2PL',
        analysis: 'Branch 1A grounds serializability in wait-free optimistic timestamp ordering bounded by TrueTime epsilon windows, whereas Branch 1B mandates pessimistic 2-Phase Locking with exclusive write lock holds during WAL replay.',
        similarityScore: 0.86,
      },
      {
        id: 'insight-ds-2',
        workspaceId: 'workspace-distributed-systems',
        sourceNodeId: 'node-ds-1',
        targetNodeId: 'node-ds-2a',
        insightType: 'dependency',
        title: 'Lease Validity Prerequisite',
        analysis: 'Linearizable local reads in Node 1 fundamentally depend on the hardware clock drift bounds proven in Node 2A.',
        similarityScore: 0.91,
      },
    ],
  },

  'workspace-crispr-genomics': {
    id: 'workspace-crispr-genomics',
    title: 'CRISPR-Cas9 Precision: Epigenetics & Off-Target Cleavage',
    domainContext: 'genomics',
    description: 'Mechanistic investigation of SpCas9 PAM recognition, mismatch tolerance, nickase base editors (BE4), and chromatin accessibility.',
    activeNodeId: 'node-cr-1',
    viewport: { x: 50, y: 150, zoom: 0.9 },
    nodes: {
      'node-cr-root': {
        id: 'node-cr-root',
        workspaceId: 'workspace-crispr-genomics',
        parentId: null,
        branchId: 'branch-cr-main',
        branchName: 'Main Lineage',
        depth: 0,
        role: 'user',
        status: 'completed',
        rawContent: 'Explain the biophysical kinetics of SpCas9 R-loop formation, PAM recognition dynamics, and how guide-RNA mismatch tolerance leads to genome-wide off-target cleavages.',
        tokenCount: 38,
        position: { x: 50, y: 200 },
        createdAt: '2026-10-12T11:00:00Z',
      },
      'node-cr-1': {
        id: 'node-cr-1',
        workspaceId: 'workspace-crispr-genomics',
        parentId: 'node-cr-root',
        branchId: 'branch-cr-main',
        branchName: 'Main Lineage',
        depth: 1,
        role: 'assistant',
        status: 'completed',
        rawContent: `### Biophysical Mechanics of SpCas9 Target Search and Cleavage

Streptococcus pyogenes Cas9 (SpCas9) locates genomic target sites through a **two-phase sequential interrogation protocol**:

1. **PAM Interrogation (3D Diffusion & 1D Sliding):**
   The SpCas9-gRNA ribonucleoprotein (RNP) samples DNA by transiently binding canonical **5'-NGG-3'** Protospacer Adjacent Motifs (PAM) via its C-terminal PAM-interacting (PI) domain. Binding occurs without DNA unwinding and takes $\\approx 30\\text{ ms}$.

2. **R-loop Propagation & Seed Region Stringency:**
   Upon PAM engagement, SpCas9 initiates local DNA duplex melting at positions 1–8 proximal to the PAM (the *seed region*). R-loop extension proceeds directionally:
   - **Seed mismatches:** Abort R-loop propagation and disengage Cas9.
   - **PAM-distal mismatches (bases 9–20):** High tolerance; often permit complete R-loop formation and trigger HNH and RuvC catalytic nicking, causing deleterious off-target double-strand breaks (DSBs).

3. **High-Fidelity Engineering:**
   Variants such as **SpCas9-HF1** and **eSpCas9(1.1)** introduce alanine substitutions that weaken non-specific contacts with the non-target DNA strand, raising the energetic barrier for cleavage activation on mismatched substrates.`,
        tokenCount: 260,
        retrievalRecord: {
          id: 'ret-cr-1',
          nodeId: 'node-cr-1',
          queryText: 'SpCas9 R-loop kinetics PAM recognition seed sequence mismatch cleavage',
          retrievalTrigger: 'SAIL_INIT',
          rawPassages: [
            'Sternberg et al. (Nature 2014): DNA interrogation by the CRISPR RNA-guided endonuclease Cas9.',
            'Kleinstiver et al. (Nature 2016): High-fidelity CRISPR-Cas9 nucleases with no detectable genome-wide off-target effects.',
          ],
          evaluationStatus: 'correct',
          evaluationScore: 0.96,
          refinedEvidence: 'R-loop formation exhibits high energetic stringency in bases 1-8 PAM-proximal seed, whereas distal mismatches frequently escape conformational checkpoints.',
          createdAt: '2026-10-12T11:00:05Z',
        },
        ghostNodes: [
          {
            id: 'ghost-cr-1',
            parentNodeId: 'node-cr-1',
            label: 'Base Editing vs Prime Editing',
            suggestedPrompt: 'Compare cytosine base editors (CBE) vs prime editing (PE2/PE3) indel frequencies and bystander editing windows.',
            vectorType: 'adjacent_transfer',
            reasoning: 'Explores non-DSB gene correction paradigms that bypass classic non-homologous end joining (NHEJ).',
            isMaterialized: false,
            position: { x: 780, y: 120 },
          },
          {
            id: 'ghost-cr-2',
            parentNodeId: 'node-cr-1',
            label: 'Chromatin Accessibility & ATAC-seq',
            suggestedPrompt: 'How does heterochromatin compaction (H3K9me3) inhibit Cas9 on-target binding in closed genomic loci?',
            vectorType: 'mechanistic_deepdive',
            reasoning: 'Investigates epigenetic barriers to endonuclease diffusion and nucleosome occupancy.',
            isMaterialized: false,
            position: { x: 780, y: 250 },
          },
        ],
        position: { x: 420, y: 200 },
        createdAt: '2026-10-12T11:00:06Z',
      },
    },
    insightEdges: [],
  },

  'workspace-jurisprudence': {
    id: 'workspace-jurisprudence',
    title: 'Constitutional Jurisprudence: Executive Immunity & Subpoena Limits',
    domainContext: 'jurisprudence',
    description: 'Constitutional doctrines governing Article II executive power, absolute vs qualified immunity, and legislative oversight.',
    activeNodeId: 'node-jur-1',
    viewport: { x: 50, y: 150, zoom: 0.9 },
    nodes: {
      'node-jur-root': {
        id: 'node-jur-root',
        workspaceId: 'workspace-jurisprudence',
        parentId: null,
        branchId: 'branch-jur-main',
        branchName: 'Main Lineage',
        depth: 0,
        role: 'user',
        status: 'completed',
        rawContent: 'Synthesize the constitutional framework governing presidential immunity from criminal prosecution and Congressional subpoenas under Nixon, Vance, and Trump v. United States.',
        tokenCount: 35,
        position: { x: 50, y: 200 },
        createdAt: '2026-10-12T12:00:00Z',
      },
      'node-jur-1': {
        id: 'node-jur-1',
        workspaceId: 'workspace-jurisprudence',
        parentId: 'node-jur-root',
        branchId: 'branch-jur-main',
        branchName: 'Main Lineage',
        depth: 1,
        role: 'assistant',
        status: 'completed',
        rawContent: `### Constitutional Evolution of Executive Immunity

The Supreme Court's Article II jurisprudence distinguishes between **civil liability**, **judicial subpoenas in criminal proceedings**, and **direct criminal indictment**:

1. **Executive Privilege & Judicial Subpoenas (*United States v. Nixon*, 1974):**
   A unanimous Court rejected absolute, unqualified presidential privilege. Generalized claims of confidentiality must yield to a demonstrated, specific need for evidence in pending criminal trials (*Fifth and Sixth Amendment imperatives*).

2. **State Criminal Subpoenas (*Trump v. Vance*, 2020):**
   Affirmed that Article II does not shield a sitting or former president from state grand jury subpoenas for private financial records, rejecting heightened evidentiary burdens for non-official actions.

3. **Criminal Immunity for Official Acts (*Trump v. United States*, 2024):**
   Established a tripartite framework:
   - **Absolute Immunity:** For actions within core constitutional authority (e.g., pardon power, diplomatic recognition).
   - **Presumptive Immunity:** For acts within the outer perimeter of official responsibility; rebuttable only if prosecution poses no danger of intruding upon executive authority.
   - **No Immunity:** For unofficial, private conduct.`,
        tokenCount: 245,
        retrievalRecord: {
          id: 'ret-jur-1',
          nodeId: 'node-jur-1',
          queryText: 'Trump v United States 2024 official acts presidential immunity tripartite framework',
          retrievalTrigger: 'FLARE',
          rawPassages: [
            'Supreme Court of the United States, Trump v. United States, 603 U.S. ___ (2024).',
          ],
          evaluationStatus: 'correct',
          evaluationScore: 0.97,
          refinedEvidence: 'Chief Justice Roberts established absolute immunity for core constitutional executive duties and presumptive immunity for outer-perimeter official conduct.',
          fallbackSearchQuery: 'Trump v US official acts rebuttable presumption test',
          createdAt: '2026-10-12T12:00:05Z',
        },
        ghostNodes: [
          {
            id: 'ghost-jur-1',
            parentNodeId: 'node-jur-1',
            label: 'Evidentiary Admissibility Bar',
            suggestedPrompt: 'Analyze footnote 3 and the evidentiary prohibition against introducing official act testimony to prove unofficial intent.',
            vectorType: 'mechanistic_deepdive',
            reasoning: 'Critical procedural doctrine shielding official records from being admitted as motive evidence in private conduct indictments.',
            isMaterialized: false,
            position: { x: 780, y: 150 },
          },
        ],
        position: { x: 420, y: 200 },
        createdAt: '2026-10-12T12:00:06Z',
      },
    },
    insightEdges: [],
  },
};
