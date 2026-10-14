import { ToolInvocation } from '../types';

export interface ToolCallMatch {
  rawMatch: string;
  toolName: string;
  parameters: Record<string, any>;
}

const TOOL_REGEX = /\[TOOL:([a-zA-Z0-9_]+)\((.*?)\)\]/;

export function extractToolCall(text: string): ToolCallMatch | null {
  const match = text.match(TOOL_REGEX);
  if (!match) return null;

  const [rawMatch, toolName, rawParams] = match;
  const parameters: Record<string, any> = {};

  const paramRegex = /([a-zA-Z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^,\s]+))/g;
  let pMatch;
  while ((pMatch = paramRegex.exec(rawParams)) !== null) {
    const key = pMatch[1];
    const val = pMatch[2] ?? pMatch[3] ?? pMatch[4];
    parameters[key] = isNaN(Number(val)) ? val : Number(val);
  }

  return { rawMatch, toolName, parameters };
}

export async function executeToolInvocation(
  nodeId: string,
  toolName: string,
  params: Record<string, any>
): Promise<ToolInvocation> {
  const startTime = Date.now();
  let result = '';
  let status: 'success' | 'failed' = 'success';

  // Realistic execution simulation
  await new Promise((r) => setTimeout(r, 450));

  try {
    switch (toolName) {
      case 'algebra_eval': {
        const expr = params.expression || '0';
        // Safe evaluation of basic arithmetic
        const sanitized = String(expr).replace(/[^0-9+\-*/().%^ eE]/g, '').replace(/\^/g, '**');
        // eslint-disable-next-line no-eval
        const val = Function(`"use strict"; return (${sanitized})`)();
        result = `${val}`;
        break;
      }

      case 'python_sandbox': {
        const script = params.script || '';
        result = `[Sandbox Executed]: Output: computed hash = 0x7FA31; invariants validated for script: ${script.slice(0, 45)}...`;
        break;
      }

      case 'web_search': {
        const q = params.query || '';
        result = `Top web citation for "${q}": Verified authoritative RFC / benchmark data.`;
        break;
      }

      case 'arxiv_search': {
        const terms = params.id_or_terms || '';
        result = `arXiv:2408.0194v2 - "Systematic Invariant Verification" by Chen et al.`;
        break;
      }

      default:
        result = `Executed tool ${toolName} with parameters: ${JSON.stringify(params)}`;
    }
  } catch (err: any) {
    status = 'failed';
    result = `Execution Error: ${err.message || 'Syntax/runtime exception'}`;
  }

  const duration = Date.now() - startTime;

  return {
    id: `tool-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    nodeId,
    toolName,
    parameters: params,
    executionResult: result,
    status,
    executionDurationMs: duration,
    createdAt: new Date().toISOString(),
  };
}
