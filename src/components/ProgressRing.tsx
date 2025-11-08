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
  const percent = Math.min(Math.max(rawPercent, 0), 200);
  const remaining = goal > 0 ? goal - consumed : 0;

  let state: ProgressState;
  let pathColor: string;
  let trailColor: string;
  
  if (percent <= 95) {
    state = 'ok';
    pathColor = 'hsl(142, 70%, 45%)';
    trailColor = 'hsla(142, 70%, 45%, 0.1)';
  } else if (percent <= 105) {
    state = 'near';
    pathColor = 'hsl(36, 94%, 55%)';
    trailColor = 'hsla(36, 94%, 55%, 0.1)';
  } else {
    state = 'over';
    pathColor = 'hsl(0, 84%, 58%)';
    trailColor = 'hsla(0, 84%, 58%, 0.1)';
  }

  const lastMessage = useRef<{ state: ProgressState; message: string } | null>(null);

  const message = useMemo(() => {
    const messages = MESSAGES[state];

    if (!messages || messages.length === 0) {
      return '';
    }

    if (lastMessage.current?.state === state) {
      return lastMessage.current.message;
    }

    const nextMessage = messages[Math.floor(Math.random() * messages.length)];
    lastMessage.current = { state, message: nextMessage };
    return nextMessage;
  }, [state]);

  return (
    <div className={styles.container}>
      <div className={styles.ring}>
        <CircularProgressbar
          value={percent}
          maxValue={100}
          text={`${Math.round(percent)}%`}
          styles={buildStyles({
            pathColor,
            textColor: 'var(--text-primary)',
            trailColor,
            pathTransitionDuration: 0.5,
          })}
        />
      </div>
      
      <div className={styles.info}>
        <div className={styles.stats}>
          <span className={styles.consumed}>{formatCalories(consumed)}</span>
          <span className={styles.divider}>/</span>
          <span className={styles.goal}>{formatCalories(goal)}</span>
        </div>
        
        {remaining > 0 ? (
          <p className={styles.remaining}>
            Te faltan <strong>{formatCalories(remaining)}</strong>
          </p>
        ) : (
          <p className={styles.over}>
            Excediste por <strong>{formatCalories(Math.abs(remaining))}</strong>
          </p>
        )}
        
        <p className={styles.message} aria-live="polite">
          {message}
        </p>
      </div>
    </div>
  );
}
