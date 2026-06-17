import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg(databaseUrl);
const prisma = new PrismaClient({ adapter });

const plans = [
  {
    name: 'Small',
    minUsers: 1,
    maxUsers: 25,
    pricePerPerson: 60,
    description: 'Best for intimate groups with 1–25 members',
  },
  {
    name: 'Medium',
    minUsers: 26,
    maxUsers: 50,
    pricePerPerson: 48,
    description: 'Ideal for growing communities with 26–50 members',
  },
  {
    name: 'Large',
    minUsers: 51,
    maxUsers: 100,
    pricePerPerson: 36,
    description: 'Perfect for established mandals with 51–100 members',
  },
  {
    name: 'Jumbo',
    minUsers: 101,
    maxUsers: 999,
    pricePerPerson: 24,
    description: 'Built for large communities with 100+ members',
  },
];

async function main() {
  console.log('Seeding plans...');

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {
        minUsers: plan.minUsers,
        maxUsers: plan.maxUsers,
        pricePerPerson: plan.pricePerPerson,
        description: plan.description,
      },
      create: plan,
    });
    console.log(`  Upserted plan: ${plan.name}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
