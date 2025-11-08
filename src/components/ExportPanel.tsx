import { Download } from 'lucide-react';
import { Profile, IntakeEntry, FoodItem } from '../types';
import { getCurrentDateISO } from '../utils/date';
import { exportToPDF } from '../utils/pdf';
import styles from './ExportPanel.module.css';

interface ExportPanelProps {
  profile: Profile;
  entries: IntakeEntry[];
  foods: FoodItem[];
  totalConsumed: number;
}

export function ExportPanel({ profile, entries, foods, totalConsumed }: ExportPanelProps) {
  const handleExport = async () => {
    try {
      await exportToPDF({
        profile,
        date: getCurrentDateISO(),
        entries,
        foods,
        totalConsumed,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error al exportar el PDF. Por favor intenta de nuevo.');
    }
  };

  return (
    <button onClick={handleExport} className={styles.button}>
      <Download size={20} />
      Exportar PDF
    </button>
  );
}
