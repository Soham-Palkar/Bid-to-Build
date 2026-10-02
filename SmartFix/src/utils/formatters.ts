export function formatTimestamp(isoOrFormatted: string): string {
  if (!isoOrFormatted) return '—';
  // If already formatted human string like "02 Oct 2026, 10:25 AM", return as-is
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

export const CAMPUS_BUILDINGS: Record<string, { floors: string[]; roomsByFloor: Record<string, string[]> }> = {
  'Engineering Block': {
    floors: ['Floor 1', 'Floor 2', 'Floor 3'],
    roomsByFloor: {
      'Floor 1': ['Lab 101', 'Lab 102', 'Lecture Hall 1A'],
      'Floor 2': ['Lab 203', 'Lab 204', 'Server Room 2B'],
      'Floor 3': ['Lab 301', 'CAD Studio 304', 'Faculty Cabin 3C'],
    },
  },
  'Science Wing': {
    floors: ['Floor 1', 'Floor 2'],
    roomsByFloor: {
      'Floor 1': ['Room 101', 'Chemistry Lab 102', 'Prep Room 105'],
      'Floor 2': ['Physics Lab 201', 'Bio Lab 202', 'Room 205'],
    },
  },
  'Library Building': {
    floors: ['Floor 1', 'Floor 2', 'Floor 3'],
    roomsByFloor: {
      'Floor 1': ['Main Reading Hall', 'Circulation Desk', 'Archive Room 104'],
      'Floor 2': ['Lab 201', 'Digital Media Room 202', 'Quiet Zone 2B'],
      'Floor 3': ['Periodical Section', 'Group Study 301'],
    },
  },
  'Central Complex': {
    floors: ['Floor 1', 'Floor 2'],
    roomsByFloor: {
      'Floor 1': ['Seminar Hall 1', 'Auditorium Foyer'],
      'Floor 2': ['Seminar Hall 3', 'Conference Room 2A'],
    },
  },
  'Admin Tower': {
    floors: ['Ground Floor', 'Floor 1', 'Floor 2'],
    roomsByFloor: {
      'Ground Floor': ['Reception Lobby', 'Records Office'],
      'Floor 1': ['Main Staircase B', 'Accounts Section'],
      'Floor 2': ['Dean Office', 'Boardroom 201'],
    },
  },
  'Mechanical Yard': {
    floors: ['Ground Floor'],
    roomsByFloor: {
      'Ground Floor': ['Workshop 12', 'CNC Bay 4', 'Substation Room B'],
    },
  },
};
