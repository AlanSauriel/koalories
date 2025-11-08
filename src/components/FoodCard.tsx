import { FoodItem } from '../types';
import { Plus } from 'lucide-react';
import styles from './FoodCard.module.css';

interface FoodCardProps {
  food: FoodItem;
  onAdd: (food: FoodItem) => void;
}

export function FoodCard({ food, onAdd }: FoodCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.info}>
        <h4 className={styles.name}>{food.name}</h4>
        <p className={styles.serving}>{food.servingName}</p>
        <p className={styles.calories}>{food.kcalPerServing} kcal</p>
      </div>
      <button
        onClick={() => onAdd(food)}
        className={styles.addButton}
        aria-label={`Agregar ${food.name}`}
      >
        <Plus size={20} />
      </button>
    </div>
  );
}
