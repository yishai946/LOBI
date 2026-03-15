afterAll(async () => {
  const { default: prisma } = await import("../src/lib/prisma");
  await prisma.$disconnect();
});
