import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { config } from './config.js';

const adapter = new PrismaPg({ connectionString: config.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export interface SignupData {
  name: string;
  businessName: string;
  businessType: string;
  whatsapp: string;
  email?: string | undefined;
}

export async function createEntry(data: SignupData) {
  return prisma.waitlistEntry.create({
    data: {
      ...data,
      email: data.email ?? null
    }
  });
}

export async function getAllEntries() {
  return prisma.waitlistEntry.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function checkDatabaseConnection() {
  await prisma.$queryRaw`SELECT 1`;
}

export async function disconnect() {
  await prisma.$disconnect();
}