import { PrismaClient, RoleKind } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/&/g, "and")
    .replace(/\//g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const baseRoles: { name: string; kind: RoleKind }[] = [
  { name: "Unassigned", kind: "basic" },
  { name: "Basic Cadet", kind: "basic" },
  { name: "Admin", kind: "admin" }
];

const departmentRoles: string[] = [
  "Corps Commander",
  "Vice Corps Commander",
  "Executive Officer",
  "Superintendent",
  "1st Sergeant",
  "Inspector General",
  "Stan Eval Officer",
  "Director of Operations",
  "Personnel Officer",
  "Training Officer",
  "Finance Officer",
  "Public Affairs Officer (Communications)",
  "Director of Mission Support",
  "Logistics Officer",
  "Uniform Custodian",
  "Equipment Custodian",
  "Information Management Officer",
  "Health & Wellness Officer",
  "Special Teams Officer",
  "Cadet Project Manager (CPM)"
];

const ldrRoles: string[] = [
  "Drill Team",
  "Color Guard",
  "Raiders (Physical Fitness Team)",
  "Saber Team",
  "Marksmanship Team (where authorized)",
  "Academic Bowl / JLAB",
  "CyberPatriot",
  "StellarXplorers",
  "Model Rocketry Team",
  "Unmanned Aircraft Systems (Drone Team)",
  "Robotics Team",
  "Orienteering Team",
  "Planning Committees (Military Ball, Awards Ceremony, Parades, Community Service, etc.)"
];

async function upsertRole(name: string, kind: RoleKind) {
  const slug = slugify(name);
  return prisma.role.upsert({
    where: { slug },
    update: { name, kind },
    create: { name, slug, kind }
  });
}

async function main() {
  console.log("Seeding roles...");

  for (const r of baseRoles) {
    await upsertRole(r.name, r.kind);
  }
  for (const name of departmentRoles) {
    await upsertRole(name, "department");
  }
  for (const name of ldrRoles) {
    await upsertRole(name, "ldr");
  }

  console.log(
    `Seeded ${baseRoles.length + departmentRoles.length + ldrRoles.length} roles.`
  );

  // Optional: seed a first admin user from env vars, if provided.
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const adminRole = await prisma.role.findUnique({ where: { slug: "admin" } });

    const admin = await prisma.user.upsert({
      where: { email: adminEmail.toLowerCase() },
      update: {},
      create: {
        name: "Site Admin",
        email: adminEmail.toLowerCase(),
        passwordHash,
        status: "approved"
      }
    });

    if (adminRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
        update: {},
        create: { userId: admin.id, roleId: adminRole.id }
      });
    }

    console.log(`Seeded admin user: ${adminEmail}`);
  } else {
    console.log(
      "No SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD set — skipping admin user creation."
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
