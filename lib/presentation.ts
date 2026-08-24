import type { Confidence, Severity } from '@/types';

export const SEVERITY_META: Record<Severity, { label: string; text: string; bg: string; border: string; dot: string }> = {
  critical: { label: 'Critical', text: 'text-critical', bg: 'bg-critical/10', border: 'border-critical/30', dot: 'bg-critical' },
  high: { label: 'High', text: 'text-high', bg: 'bg-high/10', border: 'border-high/30', dot: 'bg-high' },
  medium: { label: 'Medium', text: 'text-medium', bg: 'bg-medium/10', border: 'border-medium/30', dot: 'bg-medium' },
  low: { label: 'Low', text: 'text-low', bg: 'bg-low/10', border: 'border-low/30', dot: 'bg-low' },
  interesting: {
    label: 'Interesting',
    text: 'text-interesting',
    bg: 'bg-interesting/10',
    border: 'border-interesting/30',
    dot: 'bg-interesting',
  },
  info: { label: 'Info', text: 'text-info', bg: 'bg-info/10', border: 'border-info/30', dot: 'bg-info' },
};

export const CONFIDENCE_META: Record<Confidence, { label: string; hint: string }> = {
  confirmed: { label: 'Confirmed', hint: 'Deterministically parsed from structured output' },
  probable: { label: 'Probable', hint: 'Strong heuristic match — worth a quick manual confirmation' },
  possible: { label: 'Possible', hint: 'Weak signal — review carefully before relying on it' },
};
