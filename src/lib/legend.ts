export interface LegendItem {
  id: string;
  label: string;
  color: string;
  iconShape: 'circle' | 'square' | 'diamond' | 'triangle';
  description: string;
}

export const statusLegend: LegendItem[] = [
  {
    id: 'confirmed_active',
    label: 'Confirmed active',
    color: '#ef4444',
    iconShape: 'circle',
    description: 'Public records confirm an active ALPR program',
  },
  {
    id: 'confirmed_approved_pending',
    label: 'Confirmed approved / pending',
    color: '#f97316',
    iconShape: 'circle',
    description: 'Program approved but not yet operational (or status unclear)',
  },
  {
    id: 'proposed',
    label: 'Proposed',
    color: '#eab308',
    iconShape: 'circle',
    description: 'Program has been proposed but not yet approved',
  },
  {
    id: 'previously_deployed_removed',
    label: 'Previously deployed / removed',
    color: '#8b95a5',
    iconShape: 'circle',
    description: 'Program was previously active but has been discontinued or removed',
  },
  {
    id: 'exact_location_disclosed',
    label: 'Exact location officially disclosed',
    color: '#38bdf8',
    iconShape: 'diamond',
    description: 'Specific camera location published in an official government record',
  },
  {
    id: 'exact_location_verified',
    label: 'Exact location verified',
    color: '#a78bfa',
    iconShape: 'diamond',
    description: 'Specific camera location corroborated by independent verification',
  },
  {
    id: 'no_public_disclosure',
    label: 'No public disclosure located',
    color: '#64748b',
    iconShape: 'square',
    description:
      'We searched but found no public records about ALPR use. This does not mean no cameras exist',
  },
  {
    id: 'under_review',
    label: 'Under review',
    color: '#fbbf24',
    iconShape: 'square',
    description: 'Information is being verified and has not yet been confirmed',
  },
];

export function getLegendItem(statusId: string): LegendItem | undefined {
  return statusLegend.find((item) => item.id === statusId);
}
