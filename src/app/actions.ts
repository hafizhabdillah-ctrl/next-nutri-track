"use server";

import { MealType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";

const nutritionFields = { calories: true, protein: true, carbs: true, fat: true, sugar: true, sodium: true } as const;

type FoodLogInput = {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  sugar?: number;
  sodium?: number;
  mealType: MealType;
  loggedAt: string;
};

function dayRange(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { gte: start, lt: end };
}

function normalizeInput(data: FoodLogInput) {
  if (!data.name.trim() || data.calories < 0 || !data.loggedAt) throw new Error("Invalid food log");
  return { ...data, name: data.name.trim(), loggedAt: new Date(data.loggedAt) };
}

export async function getFoodLogs(dateStr: string) {
  try {
    const logs = await prisma.foodLog.findMany({ where: { loggedAt: dayRange(dateStr) }, orderBy: { loggedAt: "asc" } });
    return { success: true, data: logs };
  } catch (error) {
    console.error("Failed to fetch food logs:", error);
    return { success: false, error: "Failed to fetch food logs." };
  }
}

export async function getHistoricalData(daysLimit: number) {
  try {
    const end = new Date();
    end.setHours(24, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - Math.max(1, daysLimit));
    const logs = await prisma.foodLog.findMany({
      where: { loggedAt: { gte: start, lt: end } },
      select: { loggedAt: true, ...nutritionFields },
      orderBy: { loggedAt: "asc" },
    });
    const totals = new Map<string, { date: string; calories: number; sugar: number; sodium: number }>();
    for (let index = daysLimit - 1; index >= 0; index -= 1) {
      const date = new Date(end);
      date.setDate(date.getDate() - index - 1);
      const key = date.toISOString().slice(0, 10);
      totals.set(key, { date: key, calories: 0, sugar: 0, sodium: 0 });
    }
    logs.forEach((log) => {
      const day = new Date(log.loggedAt).toISOString().slice(0, 10);
      const total = totals.get(day);
      if (total) {
        total.calories += log.calories;
        total.sugar += log.sugar;
        total.sodium += log.sodium;
      }
    });
    return { success: true, data: Array.from(totals.values()) };
  } catch (error) {
    console.error("Failed to fetch historical data:", error);
    return { success: false, error: "Failed to fetch historical data." };
  }
}

export async function createFoodLog(data: FoodLogInput) {
  try {
    const log = await prisma.foodLog.create({ data: normalizeInput(data) });
    revalidatePath("/");
    return { success: true, data: log };
  } catch (error) {
    console.error("Failed to create food log:", error);
    return { success: false, error: "Failed to create food log." };
  }
}

export async function updateFoodLog(id: string, data: Partial<FoodLogInput>) {
  try {
    const normalized = data.loggedAt ? { ...data, loggedAt: new Date(data.loggedAt) } : data;
    const log = await prisma.foodLog.update({ where: { id }, data: normalized });
    revalidatePath("/");
    return { success: true, data: log };
  } catch (error) {
    console.error("Failed to update food log:", error);
    return { success: false, error: "Failed to update food log." };
  }
}

export async function deleteFoodLog(id: string) {
  try {
    await prisma.foodLog.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete food log:", error);
    return { success: false, error: "Failed to delete food log." };
  }
}

export async function deleteAllFoodLogs() {
  try {
    const result = await prisma.foodLog.deleteMany();
    revalidatePath("/");
    return { success: true, count: result.count };
  } catch (error) {
    console.error("Failed to delete all food logs:", error);
    return { success: false, error: "Failed to delete all food logs." };
  }
}
