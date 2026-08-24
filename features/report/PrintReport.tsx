'use client';

import { useScanStore } from '@/lib/store/scanStore';
import { computeOverviewStats } from '@/lib/analysis';
import { SEVERITIES } from '@/types';
import { SEVERITY_META, CONFIDENCE_META } from '@/lib/presentation';

/**
 * A print-only, light-colored layout kept in the DOM at all times so the
 * browser's print dialog (Export → Print report, or Ctrl/Cmd+P) always has
 * something correct to render — independent of the app's dark theme, which
 * would otherwise print near-invisible light text on a white page.
 */
export function PrintReport() {
  const scan = useScanStore((s) => s.scan);
  if (!scan) return null;
  const stats = computeOverviewStats(scan);

  return (
    <div className="hidden bg-white p-10 font-sans text-black print:block">
      <h1 className="text-2xl font-bold">LinPEASer Report</h1>
      <div className="mt-2 space-y-0.5 text-sm text-gray-700">
        {scan.metadata.hostname && <p>Host: {scan.metadata.hostname}</p>}
        {scan.metadata.operatingSystem && <p>OS: {scan.metadata.operatingSystem}</p>}
        {scan.metadata.currentUser && (
          <p>
            User: {scan.metadata.currentUser} {scan.metadata.isRoot ? '(root)' : ''}
          </p>
        )}
        <p>Generated: {new Date(scan.metadata.parsedAt).toLocaleString()}</p>
        <p>Total findings: {stats.totalFindings}</p>
      </div>

      <h2 className="mt-6 border-b border-gray-300 pb-1 text-lg font-semibold">Summary</h2>
      <table className="mt-2 text-sm">
        <tbody>
          {SEVERITIES.map((sev) => (
            <tr key={sev}>
              <td className="pr-6 font-medium">{SEVERITY_META[sev].label}</td>
              <td>{stats.bySeverity[sev]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-6 border-b border-gray-300 pb-1 text-lg font-semibold">Findings</h2>
      <div className="mt-2 space-y-3">
        {scan.findings.map((finding) => (
          <div key={finding.id} className="break-inside-avoid border-b border-gray-200 pb-2">
            <p className="font-semibold">
              [{SEVERITY_META[finding.severity].label.toUpperCase()}] {finding.title}
            </p>
            <p className="text-xs text-gray-600">
              {finding.category} · {CONFIDENCE_META[finding.confidence].label} · {finding.sectionPath.join(' / ')}
            </p>
            <p className="mt-1 text-sm">{finding.description}</p>
            <p className="mt-1 text-sm italic text-gray-700">{finding.rationale}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
