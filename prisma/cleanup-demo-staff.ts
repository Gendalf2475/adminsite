import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.staffMember.deleteMany({
    where: { username: { in: ["AstraMajure", "NordKeeper"] } },
  });

  console.log(`Deleted demo staff records: ${result.count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
