/**
 * Seed script to create demo VC user
 * Run with: npx ts-node prisma/seed-vc-demo.ts
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Seeding demo VC user...');

  const email = 'vc@demo.com';
  const password = 'demo123';
  const passwordHash = hashPassword(password);

  // Check if user already exists
  const existing = await prisma.vCUser.findUnique({
    where: { email }
  });

  if (existing) {
    console.log('✅ Demo VC user already exists');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    return;
  }

  // Create demo VC user
  const vcUser = await prisma.vCUser.create({
    data: {
      email,
      passwordHash,
      name: 'Demo Investor',
      firm: 'Demo Ventures',
      role: 'Partner',
      industries: ['B2B SaaS', 'Fintech', 'Climate Tech'],
      stages: ['Seed', 'Series A'],
      minCheckSize: 500000,
      maxCheckSize: 5000000,
      geographies: ['Sweden', 'Europe', 'USA']
    }
  });

  console.log('✅ Demo VC user created successfully!');
  console.log(`\nCredentials:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`\nLogin at: https://www.frejfund.com/vc/login`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

