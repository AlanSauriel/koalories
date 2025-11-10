// Type definitions for Calorie Counter App

export type Sex = "male" | "female";

export type ActivityLevel = "sedentario" | "ligero" | "moderado" | "intenso" | "muy_intenso";

export type Goal = "deficit" | "maintenance" | "surplus";

export interface Profile {
  id: string;
  name: string;
  password: string;
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activity: ActivityLevel;
  tdee: number;
  goal: Goal; 
  createdAt: string;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  kcalPerServing: number;
  servingName: string;
  kcalPer100g?: number;
  isCustom?: boolean; // --- PROPIEDAD AÑADIDA ---
}

export interface IntakeEntry {
  id: string;
  dateISO: string;
  foodId?: string;
  customName?: string;
  kcalPerUnit: number;
  units: number;
  timestamp: number;
}

export interface DailyLog {
  date: string;
  entries: IntakeEntry[];
  totalKcal: number;
}

export interface HistoryDay {
  date: string;
  totalKcal: number;
  tdee: number;
  percentOfGoal: number;
}

export type ProgressState = "ok" | "near" | "over";

export interface CaloriesCalculation {
  tmb: number;
  tdee: number;
}
