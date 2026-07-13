require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const roles = await prisma.role.findMany();
    console.log("Roles in DB:", roles);

    const users = await prisma.user.findMany({
      include: {
        role: true
      }
    });
    console.log("Users in DB:", users.map(u => ({ email: u.email, role: u.role.name })));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
