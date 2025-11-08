import styles from './CategoryFilter.module.css';

const CATEGORIES = [
  'Todas',
  'Cereales sin grasa',
  'Cereales con grasa',
  'Verduras',
  'Frutas',
  'AOA muy bajos en grasa',
  'AOA bajos en grasa',
  'AOA moderados en grasa',
  'AOA altos en grasa',
  'Leche y sustitutos',
  'Leguminosas',
  'Grasas monoinsaturadas',
  'Grasas poliinsaturadas',
  'Grasas saturadas y trans',
  'Azúcares',
  'Libres de energía',
];

interface CategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className={styles.container}>
      <label htmlFor="category-filter" className="sr-only">
        Filtrar por categoría
      </label>
      <select
        id="category-filter"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className={styles.select}
      >
        {CATEGORIES.map(cat => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
}
