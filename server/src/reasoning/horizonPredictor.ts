import type { GhostNodeData, GhostVectorType } from './types';

export function generateHorizonGhostNodes(
  parentNodeId: string,
  userPrompt: string,
  domainContext: string
): GhostNodeData[] {
  const p = userPrompt.toLowerCase();

  let counter: { label: string; prompt: string; reasoning: string };
  let deepdive: { label: string; prompt: string; reasoning: string };
  let transfer: { label: string; prompt: string; reasoning: string };

  if (domainContext === 'distributed_systems' || p.includes('raft') || p.includes('paxos') || p.includes('consensus') || p.includes('clock')) {
    counter = {
      label: 'Byzantine Fault Stress-Test',
      prompt: 'What happens to safety and election validity if up to 33% of nodes exhibit Byzantine arbitrary message alteration?',
      reasoning: 'Stress-tests non-Byzantine crash fault tolerance assumptions under adversarial conditions.',
    };
    deepdive = {
      label: 'Formal TLA+ Verification',
      prompt: 'Construct the formal TLA+ state machine invariants proving LeaderCompleteness and LogMatching properties.',
      reasoning: 'Mathematical formal methods verification proving absence of deadlocks and state divergence.',
    };
    transfer = {
      label: 'P2P Gossip & Delta-CRDTs',
      prompt: 'Can leader leases be replaced by state-based CRDTs with causal vector clocks in partitioned edge topologies?',
      reasoning: 'Applies consensus invariants to decentralized, leaderless eventual consistency models.',
    };
  } else if (domainContext === 'genomics' || p.includes('crispr') || p.includes('cas9') || p.includes('dna')) {
    counter = {
      label: 'Non-Homologous End Joining Indel Errors',
      prompt: 'Evaluate off-target translocation risks caused by simultaneous DSBs at homologous genomic sites.',
      reasoning: 'Identifies oncogenic chromosomal rearrangement hazards inherent to wild-type Cas9 cleavage.',
    };
    deepdive = {
      label: 'Cryo-EM Conformational Checkpoints',
      prompt: 'Trace the allosteric triggering of HNH nuclease domain rotation from the catalytically inactive to active state.',
      reasoning: 'Structural biology breakdown of the conformational checkpoint locking onto the DNA backbone.',
    };
    transfer = {
      label: 'Epigenetic Repression (CRISPRi / dCas9)',
      prompt: 'How can catalytically dead dCas9 fused to KRAB domains achieve gene silencing without genomic sequence alteration?',
      reasoning: 'Transfers nuclease targeting precision to non-destructive epigenetic transcriptional regulation.',
    };
  } else if (domainContext === 'jurisprudence' || p.includes('court') || p.includes('immunity') || p.includes('executive')) {
    counter = {
      label: 'Separation of Powers Encroachment',
      prompt: 'Does presumptive immunity unduly insulate executive actions from Article III judicial review contrary to Marbury v. Madison?',
      reasoning: 'Examines constitutional tensions between executive autonomy and judicial supremacy.',
    };
    deepdive = {
      label: 'Grand Jury Evidentiary Exclusions',
      prompt: 'Detail the evidentiary hearing standard (Kastigar-style) required to purge official act evidence from an indictment.',
      reasoning: 'Procedural litigation mechanics for challenging evidence before grand jury presentation.',
    };
    transfer = {
      label: 'Comparative Foreign Immunity Standards',
      prompt: 'How does French Article 68 presidential high treason procedure compare with US Article II impeachment and immunity doctrines?',
      reasoning: 'Comparative constitutional law analysis of head-of-state accountability in civil law regimes.',
    };
  } else {
    counter = {
      label: 'Adversarial Edge-Case Stress Test',
      prompt: `Identify the weakest operational assumption in this paradigm and formulate a scenario where it degrades completely.`,
      reasoning: 'Exposes hidden boundary conditions and unverified assumptions.',
    };
    deepdive = {
      label: 'Mechanical Execution Trace',
      prompt: `Provide the step-by-step algorithm and complexity bounds for the underlying state transition.`,
      reasoning: 'Deconstructs the conceptual overview into concrete technical implementation details.',
    };
    transfer = {
      label: 'Interdisciplinary Cross-Domain Application',
      prompt: `How can this exact algorithmic pattern be repurposed to solve coordination problems in an adjacent discipline?`,
      reasoning: 'Discovers innovative architectural synergies across distant research domains.',
    };
  }

  const createGhost = (
    vectorType: GhostVectorType,
    data: { label: string; prompt: string; reasoning: string },
    index: number
  ): GhostNodeData => ({
    id: `ghost-${Date.now()}-${index}`,
    parentNodeId,
    label: data.label,
    suggestedPrompt: data.prompt,
    vectorType,
    reasoning: data.reasoning,
    isMaterialized: false,
  });

  return [
    createGhost('critical_counter', counter, 1),
    createGhost('mechanistic_deepdive', deepdive, 2),
    createGhost('adjacent_transfer', transfer, 3),
  ];
}
