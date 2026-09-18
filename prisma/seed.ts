import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/common/utils/password.util';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg(databaseUrl);
const prisma = new PrismaClient({ adapter });

const plans = [
  {
    name: 'Starter',
    membersCapacity: 5,
    planAmount: 0,
    description: 'Free Forever',
  },
  {
    name: 'Small',
    membersCapacity: 25,
    planAmount: 599,
    description: 'Best for intimate groups with up to 25 members',
  },
  {
    name: 'Medium',
    membersCapacity: 50,
    planAmount: 899,
    description: 'Ideal for growing communities with up to 50 members',
  },
  {
    name: 'Large',
    membersCapacity: 100,
    planAmount: 1199,
    description: 'Perfect for established mandals with up to 100 members',
  },
  {
    name: 'Jumbo',
    membersCapacity: 999,
    planAmount: 5999,
    description: 'Built for large communities with 100+ members',
  },
];

async function main() {
  console.log('Seeding plans...');

  for (const plan of plans) {
    const existingPlan = await prisma.plan.findFirst({
      where: { name: plan.name },
    });

    if (existingPlan) {
      await prisma.plan.update({
        where: { id: existingPlan.id },
        data: {
          membersCapacity: plan.membersCapacity,
          planAmount: plan.planAmount,
          description: plan.description,
        },
      });
      console.log(`  Updated plan: ${plan.name}`);
    } else {
      await prisma.plan.create({
        data: plan,
      });
      console.log(`  Created plan: ${plan.name}`);
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminFullName = process.env.ADMIN_FULL_NAME ?? 'Admin User';

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment');
  }

  console.log('Seeding admin user...');

  const existingAdmin = await prisma.adminUser.findFirst({
    where: { email: adminEmail, deletedAt: null },
  });

  if (existingAdmin) {
    await prisma.adminUser.update({
      where: { id: existingAdmin.id },
      data: {
        fullName: adminFullName,
        password: hashPassword(adminPassword),
        status: 'ACTIVE',
      },
    });
    console.log(`  Updated admin user: ${adminEmail}`);
  } else {
    await prisma.adminUser.create({
      data: {
        fullName: adminFullName,
        email: adminEmail,
        password: hashPassword(adminPassword),
        status: 'ACTIVE',
      },
    });
    console.log(`  Created admin user: ${adminEmail}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
