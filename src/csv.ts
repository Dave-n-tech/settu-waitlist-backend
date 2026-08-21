import type { WaitlistEntry } from '../generated/prisma/client.js';

const escapeCsvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;

export function waitlistEntriesToCsv(entries: WaitlistEntry[]) {
  const headers = [
    'ID',
    'Name',
    'Business Name',
    'Business Type',
    'WhatsApp',
    'Email',
    'Signed Up At'
  ];

  const rows = entries.map(entry => [
    entry.id,
    entry.name,
    entry.businessName,
    entry.businessType,
    entry.whatsapp,
    entry.email ?? '',
    entry.createdAt.toISOString()
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => escapeCsvCell(cell)).join(','))
    .join('\n');
}