const { PrismaClient, MealType } = require("@prisma/client");

const prisma = new PrismaClient();

function dateAt(year, month, day, hour) {
  return new Date(year, month, day, hour, 0, 0, 0);
}

async function main() {
  const existingSample = await prisma.foodLog.findFirst({ where: { name: { startsWith: "Monthly sample" } } });
  if (existingSample) {
    console.log("Monthly sample data already exists; skipping dummy data.");
    return;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const data = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const variation = day % 5;
    data.push(
      { name: `Monthly sample breakfast ${day}`, calories: 320 + variation * 24, protein: 18 + variation, carbs: 34 + variation * 2, fat: 10 + variation, sugar: 9 + variation, sodium: 260 + variation * 35, mealType: MealType.BREAKFAST, loggedAt: dateAt(year, month, day, 8) },
      { name: `Monthly sample lunch ${day}`, calories: 520 + variation * 30, protein: 30 + variation * 2, carbs: 52 + variation * 3, fat: 16 + variation, sugar: 6 + variation, sodium: 610 + variation * 50, mealType: MealType.LUNCH, loggedAt: dateAt(year, month, day, 13) },
      { name: `Monthly sample dinner ${day}`, calories: 610 + variation * 28, protein: 36 + variation, carbs: 48 + variation * 2, fat: 22 + variation, sugar: 7 + variation, sodium: 720 + variation * 45, mealType: MealType.DINNER, loggedAt: dateAt(year, month, day, 19) },
    );
  }

  await prisma.foodLog.createMany({ data });
  console.log(`Created ${data.length} dummy nutrition entries across the current month.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
