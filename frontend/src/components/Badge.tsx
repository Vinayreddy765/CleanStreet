import React from 'react';
import { Severity, ReportStatus, WasteCategory, CATEGORY_LABELS, SEVERITY_LABELS, STATUS_LABELS } from '../lib/types';
import { severityColor, statusColor, categoryColor, categoryIcon } from '../lib/utils';

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`badge ${severityColor(severity)}`}>
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={`badge ${statusColor(status)}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function CategoryBadge({ category }: { category: WasteCategory }) {
  return (
    <span className={`badge ${categoryColor(category)}`}>
      {categoryIcon(category)} {CATEGORY_LABELS[category]}
    </span>
  );
}
