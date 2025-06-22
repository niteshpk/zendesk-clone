// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seed() {
  // Sample tenants
  const tenant1 = await prisma.tenant.create({
    data: {
      businessName: 'Tenant One Business',
      email: 'tenant1@email.com',
      passwordHash: await bcrypt.hash('password', 10),
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      businessName: 'Tenant Two Business',
      email: 'tenant2@email.com',
      passwordHash: await bcrypt.hash('password', 10),
    },
  });

  // Sample agents for tenant1
  await prisma.agent.createMany({
    data: [
      {
        username: 'agent1',
        passwordHash: await bcrypt.hash('password', 10),
        tenantId: tenant1.id,
      },
      {
        username: 'agent2',
        passwordHash: await bcrypt.hash('password', 10),
        tenantId: tenant1.id,
      },
    ],
  });

  // Sample agents for tenant2
  await prisma.agent.createMany({
    data: [
      {
        username: 'agentA',
        passwordHash: await bcrypt.hash('password', 10),
        tenantId: tenant2.id,
      },
      {
        username: 'agentB',
        passwordHash: await bcrypt.hash('password', 10),
        tenantId: tenant2.id,
      },
    ],
  });

  // Widget config for tenant1
  await prisma.widget.create({
    data: {
      tenantId: tenant1.id,
      color: '#FF5733',
      widgetTitle: 'Tenant One Support',
      welcomeText: 'Welcome to Tenant One!',
      logoUrl: 'https://picsum.photos/id/1/100/100',
    },
  });

  // Widget config for tenant2
  await prisma.widget.create({
    data: {
      tenantId: tenant2.id,
      color: '#33C3FF',
      widgetTitle: 'Tenant Two Support',
      welcomeText: 'Welcome to Tenant Two!',
      logoUrl: 'https://picsum.photos/id/2/100/100',
    },
  });

  console.log('🌱 Seed data inserted successfully');
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
