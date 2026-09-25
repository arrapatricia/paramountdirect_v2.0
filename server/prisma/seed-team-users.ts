// Standalone, additive-only seed for the real named accounts requested for
// the System Development, Corporate Communications and Direct Marketing
// Head/Manager teams. Run with `npx tsx prisma/seed-team-users.ts`.
//
// Unlike seed.ts, this script never deletes anything - it only upserts Role
// and User rows by their unique keys (role name+productScope, user email),
// so it's safe to re-run against the shared dev DB without touching anyone
// else's data (sample applications, other users, etc).
//
// Every account gets the shared temporary password 'user123' below, pending
// the ZeptoMail integration that will let each person receive their own
// credentials directly. Kept in sync manually with the role catalog in
// paramountdirect_v2/src/lib/roles.ts.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TEMP_PASSWORD = 'user123';

type TeamAccount = {
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  products: string[];
  isDirectMarketing: boolean;
};

const TEAM_ACCOUNTS: TeamAccount[] = [
  // --- System Development Team -------------------------------------------
  { email: 'annabelle.morong@paramount.com.ph', firstName: 'Annabelle', lastName: 'Morong', roleName: 'SysDev Admin', products: ['PD Life', 'OFW', 'CTPL', 'GTP'], isDirectMarketing: false },
  { email: 'kevin.malabuyoc@paramount.com.ph', firstName: 'Kevin', lastName: 'Malabuyoc', roleName: 'Web Developer', products: ['PD Life', 'OFW', 'CTPL', 'GTP'], isDirectMarketing: false },
  { email: 'ervie.villareal@paramount.com.ph', firstName: 'Ervie', lastName: 'Villareal', roleName: 'Web Developer', products: ['PD Life', 'OFW', 'CTPL', 'GTP'], isDirectMarketing: false },
  { email: 'marnie.paraiso@paramount.com.ph', firstName: 'Marnie', lastName: 'Paraiso', roleName: 'Web Developer', products: ['PD Life', 'OFW', 'CTPL', 'GTP'], isDirectMarketing: false },
  { email: 'nikko.mayo@paramount.com.ph', firstName: 'Nikko', lastName: 'Mayo', roleName: 'Web Developer', products: ['PD Life', 'OFW', 'CTPL', 'GTP'], isDirectMarketing: false },
  { email: 'jayson.candelaria@paramount.com.ph', firstName: 'Jayson', lastName: 'Candelaria', roleName: 'Web Developer', products: ['PD Life', 'OFW', 'CTPL', 'GTP'], isDirectMarketing: false },
  { email: 'arra.delmundo@paramount.com.ph', firstName: 'Arra', lastName: 'Del Mundo', roleName: 'Main Developer', products: ['PD Life', 'OFW', 'CTPL', 'GTP'], isDirectMarketing: false },

  // --- Corporate Communications Team --------------------------------------
  { email: 'bernadetteclarice.cortes@paramount.com.ph', firstName: 'Bernadette Clarice', lastName: 'Cortes', roleName: 'Corporate Communications', products: ['PD Life', 'OFW', 'CTPL', 'GTP'], isDirectMarketing: false },
  { email: 'vanessa.ona@paramount.com.ph', firstName: 'Vanessa', lastName: 'Ona', roleName: 'Corporate Communications', products: ['PD Life', 'OFW', 'CTPL', 'GTP'], isDirectMarketing: false },
  { email: 'kim.victoriano@paramount.com.ph', firstName: 'Kim', lastName: 'Victoriano', roleName: 'Corporate Communications', products: ['PD Life', 'OFW', 'CTPL', 'GTP'], isDirectMarketing: false },

  // --- Direct Marketing Heads / Contact Center leads ----------------------
  { email: 'jehan.arceo@paramount.com.ph', firstName: 'Jehan', lastName: 'Arceo', roleName: 'DM Head', products: ['PD Life', 'OFW', 'CTPL', 'GTP'], isDirectMarketing: true },
  { email: 'christy.sumalinog@paramount.com.ph', firstName: 'Christy', lastName: 'Sumalinog', roleName: 'DM Operations Head', products: ['PD Life', 'OFW', 'CTPL', 'GTP'], isDirectMarketing: true },
  { email: 'jeoffrey.balaga@paramount.com.ph', firstName: 'Jeoffrey', lastName: 'Balaga', roleName: 'DM Marketing Head', products: ['PD Life', 'OFW', 'CTPL', 'GTP'], isDirectMarketing: true },
  { email: 'maria.enrile@paramount.com.ph', firstName: 'Maria', lastName: 'Enrile', roleName: 'DM Online Sales Head', products: ['PD Life', 'OFW', 'CTPL', 'GTP'], isDirectMarketing: true },
  { email: 'hialeah.veloso@paramount.com.ph', firstName: 'Hialeah', lastName: 'Veloso', roleName: 'DM Contact Center Manager', products: ['PD Life', 'OFW', 'CTPL', 'GTP'], isDirectMarketing: true },
  { email: 'ranie.ongoco@paramount.com.ph', firstName: 'Ranie', lastName: 'Ongoco', roleName: 'DM Contact Center Supervisor', products: ['PD Life', 'OFW', 'CTPL', 'GTP'], isDirectMarketing: true },
];

async function main() {
  const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 10);

  for (const account of TEAM_ACCOUNTS) {
    const role = await prisma.role.upsert({
      where: { name_productScope: { name: account.roleName, productScope: account.products[0] } },
      update: {},
      create: {
        name: account.roleName,
        productScope: account.products[0],
        isDirectMarketing: account.isDirectMarketing,
      },
    });

    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        firstName: account.firstName,
        lastName: account.lastName,
        passwordHash,
        assignedProducts: account.products,
        roleId: role.id,
        status: 'Active',
      },
      create: {
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        passwordHash,
        assignedProducts: account.products,
        roleId: role.id,
        status: 'Active',
      },
    });
  }

  console.log(`Seeded ${TEAM_ACCOUNTS.length} team accounts (password: ${TEMP_PASSWORD} for all, pending ZeptoMail).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
