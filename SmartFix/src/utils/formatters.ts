export function formatTimestamp(isoOrFormatted: string): string {
  if (!isoOrFormatted) return '—';
  if (isoOrFormatted.includes('AM') || isoOrFormatted.includes('PM')) {
    return isoOrFormatted;
  }
  const date = new Date(isoOrFormatted);
  if (isNaN(date.getTime())) return isoOrFormatted;

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatShortTime(isoOrFormatted: string): string {
  if (!isoOrFormatted) return 'Pending';
  if (isoOrFormatted.includes('AM') || isoOrFormatted.includes('PM')) {
    return isoOrFormatted;
  }
  const date = new Date(isoOrFormatted);
  if (isNaN(date.getTime())) return isoOrFormatted;

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function getInitials(name: string): string {
  if (!name) return 'NA';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}
