import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { ArrowLeft, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart, Area } from 'recharts';
import { getDaysAgo, formatDateShort } from '../utils/date';
import { IntakeEntry } from '../types';
import styles from './Historial.module.css';

interface HistoryPoint {
  date: string;
  kcal: number;
  goal: number;
}

export default function Historial() {
  const navigate = useNavigate();
  const { activeProfile } = useSession();
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    if (!activeProfile) {
      navigate('/login');
      return;
    }
    if (activeProfile.tdee === 0) {
      navigate('/registro');
    }
  }, [activeProfile, navigate]);

  useEffect(() => {
    if (!activeProfile) {
      setHistoryData([]);
      return;
    }

    const { id, tdee } = activeProfile;

    const readEntriesForDate = (dateISO: string): IntakeEntry[] => {
      if (typeof window === 'undefined') {
        return [];
      }

      const key = `cc_intake_${id}_${dateISO}`;

      try {
        const stored = window.localStorage.getItem(key);
        return stored ? JSON.parse(stored) as IntakeEntry[] : [];
      } catch (error) {
        console.warn(`Error leyendo datos de localStorage para ${key}`, error);
        return [];
      }
    };

    const computeHistory = () => {
      const points: HistoryPoint[] = [];

      for (let i = 4; i >= 0; i--) {
        const dateISO = getDaysAgo(i);
        const entries = readEntriesForDate(dateISO);
        const totalKcal = entries.reduce((sum, entry) => sum + (entry.kcalPerUnit * entry.units), 0);

        points.push({
          date: formatDateShort(dateISO),
          kcal: totalKcal,
          goal: tdee,
        });
      }

      setHistoryData(points);
    };

    computeHistory();

    if (typeof window === 'undefined') return;

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || !event.key.startsWith(`cc_intake_${id}_`)) {
        return;
      }
      computeHistory();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [activeProfile]);

  if (!activeProfile) return null;

  const hasData = historyData.some(d => d.kcal > 0);

  // Calculate statistics
  const totalKcal = historyData.reduce((sum, d) => sum + d.kcal, 0);
  const avgKcal = totalKcal / historyData.length;
  const daysOverGoal = historyData.filter(d => d.kcal > d.goal * 1.05).length;
  const daysUnderGoal = historyData.filter(d => d.kcal < d.goal * 0.95).length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/dashboard" className={styles.backButton}>
            <ArrowLeft size={20} />
            Volver
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.titleSection}>
          <h1>Historial de 5 días</h1>
          <p className={styles.subtitle}>Análisis de tu consumo calórico</p>
        </div>

        {!hasData ? (
          <div className={styles.emptyState}>
            <p>Aún no tienes datos registrados.</p>
            <Link to="/dashboard" className={styles.buttonPrimary}>
              Ir al dashboard
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Target size={24} />
                </div>
                <div className={styles.statContent}>
                  <p className={styles.statLabel}>Promedio diario</p>
                  <p className={styles.statValue}>{Math.round(avgKcal)} kcal</p>
                  <p className={styles.statSubtext}>
                    Meta: {Math.round(activeProfile.tdee)} kcal
                  </p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.iconSuccess}`}>
                  <TrendingDown size={24} />
                </div>
                <div className={styles.statContent}>
                  <p className={styles.statLabel}>Días bajo meta</p>
                  <p className={styles.statValue}>{daysUnderGoal}</p>
                  <p className={styles.statSubtext}>
                    {((daysUnderGoal / historyData.length) * 100).toFixed(0)}% del periodo
                  </p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.iconWarning}`}>
                  <TrendingUp size={24} />
                </div>
                <div className={styles.statContent}>
                  <p className={styles.statLabel}>Días sobre meta</p>
                  <p className={styles.statValue}>{daysOverGoal}</p>
                  <p className={styles.statSubtext}>
                    {((daysOverGoal / historyData.length) * 100).toFixed(0)}% del periodo
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.chartContainer}>
              <h2 className={styles.chartTitle}>Consumo vs Meta</h2>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={historyData}>
                  <defs>
                    <linearGradient id="colorKcal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(204, 88%, 52%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(204, 88%, 52%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--text-secondary)"
                    style={{ fontSize: '13px', fontWeight: 500 }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="var(--text-secondary)"
                    style={{ fontSize: '13px' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      boxShadow: 'var(--shadow-lg)',
                      padding: '12px 16px'
                    }}
                    labelStyle={{
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      marginBottom: '8px'
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'kcal') return [`${Math.round(value)} kcal`, 'Consumo'];
                      return [`${Math.round(value)} kcal`, 'Meta'];
                    }}
                  />
                  <ReferenceLine 
                    y={activeProfile.tdee} 
                    stroke="hsl(142, 70%, 45%)" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="kcal"
                    fill="url(#colorKcal)"
                    stroke="hsl(204, 88%, 52%)"
                    strokeWidth={0}
                  />
                  <Bar 
                    dataKey="kcal" 
                    fill="hsl(204, 88%, 52%)" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={50}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="goal" 
                    stroke="hsl(142, 70%, 45%)" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(142, 70%, 45%)', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Consumo</th>
                    <th>Meta</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((day, idx) => {
                    const percent = (day.kcal / day.goal) * 100;
                    let stateClass = styles.stateOk;
                    let stateText = 'Dentro';
                    
                    if (percent > 105) {
                      stateClass = styles.stateOver;
                      stateText = 'Excedido';
                    } else if (percent > 95) {
                      stateClass = styles.stateNear;
                      stateText = 'Cerca';
                    }

                    return (
                      <tr key={idx}>
                        <td>{day.date}</td>
                        <td>{Math.round(day.kcal)} kcal</td>
                        <td>{Math.round(day.goal)} kcal</td>
                        <td>
                          <span className={`${styles.stateBadge} ${stateClass}`}>
                            {stateText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
