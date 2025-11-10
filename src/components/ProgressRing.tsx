import { useMemo, useRef } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { ProgressState } from '../types';
import { formatCalories } from '../utils/format';
import styles from './ProgressRing.module.css';

interface ProgressRingProps {
  consumed: number;
  goal: number;
}

// Los mensajes ahora se manejan en Dashboard.tsx,
// pero mantenemos la lógica de estado para los colores del anillo.
const MESSAGES = {
  ok: [
    'Vas muy bien, sigue así',
    'Excelente progreso',
    'Mantén el ritmo',
    'Gran trabajo hasta ahora',
  ],
  near: [
    'Casi alcanzas tu meta',
    'Estás muy cerca',
    'Un poco más y lo logras',
    'Ya casi llegas',
  ],
  over: [
    'Excediste tu meta, pero mañana será mejor',
    'No te preocupes, mañana es un nuevo día',
    'Todos tenemos días así',
    'Lo importante es seguir intentando',
  ],
};

export function ProgressRing({ consumed, goal }: ProgressRingProps) {
  const safeGoal = goal > 0 ? goal : 1;
  const rawPercent = goal > 0 ? (consumed / safeGoal) * 100 : 0;
  // Modificamos 'percent' para que el anillo se detenga en 100%
  // El texto del Dashboard manejará los porcentajes mayores a 100
  const percent = Math.min(Math.max(rawPercent, 0), 100); 

  let state: ProgressState;
  let pathColor: string;
  let trailColor: string;
  
  // Usamos 'rawPercent' (el porcentaje real) para determinar el color
  if (rawPercent <= 95) {
    state = 'ok';
    pathColor = 'hsl(142, 70%, 45%)';
    trailColor = 'hsla(142, 70%, 45%, 0.1)';
  } else if (rawPercent <= 105) {
    state = 'near';
    pathColor = 'hsl(36, 94%, 55%)';
    trailColor = 'hsla(36, 94%, 55%, 0.1)';
  } else {
    state = 'over';
    pathColor = 'hsl(0, 84%, 58%)';
    trailColor = 'hsla(0, 84%, 58%, 0.1)';
  }

  // --- MODIFICACIÓN ---
  // El 'text' del anillo ahora mostrará el porcentaje real (puede ser > 100%)
  const displayPercent = Math.round(rawPercent);

  return (
    <div className={styles.container}>
      <div className={styles.ring}>
        <CircularProgressbar
          value={percent} // El visual se detiene en 100
          maxValue={100}
          text={`${displayPercent}%`} // El texto muestra el % real
          styles={buildStyles({
            pathColor,
            textColor: 'var(--text-primary)',
            trailColor,
            pathTransitionDuration: 0.5,
          })}
        />
      </div>
      
      {/* --- MODIFICACIÓN --- */}
      {/* Eliminamos el texto estático de aquí */}
      <div className={styles.info}>
        <div className={styles.stats}>
          <span className={styles.consumed}>{formatCalories(consumed)}</span>
          <span className={styles.divider}>/</span>
          <span className={styles.goal}>{formatCalories(goal)}</span>
        </div>
        
        {/* Las frases "Te faltan..." y "Vas muy bien..."
          fueron eliminadas de este componente.
          Ahora se muestran desde Dashboard.tsx
        */}
      </div>
    </div>
  );
}
