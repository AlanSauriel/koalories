import { IntakeEntry, FoodItem } from '../types';
import { Trash2, Minus, Plus } from 'lucide-react';
import styles from './IntakeItem.module.css';

interface IntakeItemProps {
  entry: IntakeEntry;
  food?: FoodItem;
  // --- PROPS HECHAS OPCIONALES ---
  onUpdateUnits?: (id: string, units: number) => void;
  onDelete?: (id: string) => void;
}

export function IntakeItem({ entry, food, onUpdateUnits, onDelete }: IntakeItemProps) {
  const name = food?.name || entry.customName || 'Alimento personalizado';
  const totalKcal = entry.kcalPerUnit * entry.units;
  // Determinamos si es una entrada personalizada (sin foodId) o un item de catálogo
  const detailText = food?.servingName
    ? `${food.servingName} (${entry.kcalPerUnit} kcal) × ${entry.units}`
    : `${entry.kcalPerUnit} kcal × ${entry.units}`;

  return (
    <div className={styles.item}>
      <div className={styles.info}>
        <h4 className={styles.name}>{name}</h4>
        <p className={styles.detail}>
          {detailText} = <strong>{totalKcal} kcal</strong>
        </p>
      </div>

      {/* --- RENDERIZADO CONDICIONAL DE BOTONES --- */}
      {/* Solo se muestran los controles si las funciones existen */}
      {onUpdateUnits && onDelete && (
        <div className={styles.controls}>
          <button
            onClick={() => onUpdateUnits(entry.id, Math.max(1, entry.units - 1))}
            className={styles.controlButton}
            aria-label="Disminuir cantidad"
          >
            <Minus size={16} />
          </button>
          <span className={styles.units}>{entry.units}</span>
          <button
            onClick={() => onUpdateUnits(entry.id, entry.units + 1)}
            className={styles.controlButton}
            aria-label="Aumentar cantidad"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className={styles.deleteButton}
            aria-label="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
