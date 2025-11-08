import { CaloriesCalculation, Sex, ActivityLevel } from '../types';

interface CaloriesInput {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activity: ActivityLevel;
}

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  intenso: 1.725,
  muy_intenso: 1.9,
};

/**
 * Calculate TMB using Mifflin-St Jeor equation
 * Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
 * Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
 */
export function useCaloriesCalculator(): (input: CaloriesInput) => CaloriesCalculation {
  return (input: CaloriesInput): CaloriesCalculation => {
    const { sex, age, weightKg, heightCm, activity } = input;

    // Calculate BMR (Basal Metabolic Rate / TMB)
    const baseTmb = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    const tmb = sex === 'male' ? baseTmb + 5 : baseTmb - 161;

    // Calculate TDEE (Total Daily Energy Expenditure)
    const activityFactor = ACTIVITY_FACTORS[activity];
    const tdee = Math.round(tmb * activityFactor);

    return {
      tmb: Math.round(tmb),
      tdee,
    };
  };
}
