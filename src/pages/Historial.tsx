import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { ArrowLeft, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart, Area } from 'recharts';
import { getDaysAgo, formatDateShort, dateToISOString } from '../utils/date';
// --- CORRECCIÓN LÍNEA 8: Quitamos HistoryPoint de aquí ---
import { IntakeEntry, FoodItem } from '../types';
import styles from './Historial.module.css';

// --- IMPORTS AÑADIDOS ---
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Calendar } from "../components/ui/calendar";
import { useLocalStorage } from '../hooks/useLocalStorage'; 
import { IntakeItem } from '../components/IntakeItem'; 
import foodsData from '../data/foods.seed.json'; 
import { es } from 'date-fns/locale';

// --- CORRECCIÓN LÍNEA 22: Añadimos la definición local ---
interface HistoryPoint {
  date: string;
  kcal: number;
  goal: number;
}

export default function Historial() {
  const navigate = useNavigate();
  const { activeProfile } = useSession();

  const [viewMode, setViewMode] = useState<'summary' | 'calendar'>('summary');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDayEntries, setSelectedDayEntries] = useState<IntakeEntry[]>([]);
  
  const [summaryData, setSummaryData] = useState<HistoryPoint[]>([]);

  const customFoodsKey = activeProfile ? `cc_customFoods_${activeProfile.id}` : '';
  const [customFoods] = useLocalStorage<FoodItem[]>(customFoodsKey, []);
  
  const combinedFoods = useMemo(() => {
    return [...foodsData, ...customFoods];
  }, [customFoods]);
  
  useEffect(() => {
    if (!activeProfile) {
      navigate('/login');
      return;
    }
    if (activeProfile.tdee === 0 && viewMode === 'summary') {
      navigate('/registro');
    }
  }, [activeProfile, navigate, viewMode]);

  const readEntriesForDate = (dateISO: string): IntakeEntry[] => {
    if (typeof window === 'undefined' || !activeProfile) {
      return [];
    }
    const key = `cc_intake_${activeProfile.id}_${dateISO}`;
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) as IntakeEntry[] : [];
    } catch (error) {
      console.warn(`Error leyendo datos de localStorage para ${key}`, error);
      return [];
    }
  };

  useEffect(() => {
    if (!activeProfile || activeProfile.tdee === 0) {
      setSummaryData([]);
      return;
    }
    const { tdee } = activeProfile;
    
    const computeSummary = () => {
      const points: HistoryPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const dateISO = getDaysAgo(i);
        const entries = readEntriesForDate(dateISO);
        const totalKcal = entries.reduce((sum, entry) => sum + (entry.kcalPerUnit * entry.units), 0);

        points.push({
          date: formatDateShort(dateISO),
          kcal: totalKcal,
          goal: tdee,
        });
      }
      setSummaryData(points);
    };
    computeSummary();
  }, [activeProfile]);

  useEffect(() => {
    if (viewMode === 'calendar' && selectedDate && activeProfile) {
      const dateISO = dateToISOString(selectedDate);
      const entries = readEntriesForDate(dateISO);
      entries.sort((a, b) => b.timestamp - a.timestamp);
      setSelectedDayEntries(entries);
    }
  }, [viewMode, selectedDate, activeProfile]);


  if (!activeProfile) return null;

  const hasSummaryData = summaryData.some(d => d.kcal > 0);

  const totalKcal = summaryData.reduce((sum, d) => sum + d.kcal, 0);
  const avgKcal = totalKcal / (summaryData.length || 1);
  const daysOverGoal = summaryData.filter(d => d.kcal > d.goal * 1.05).length;
  const daysUnderGoal = summaryData.filter(d => d.kcal < d.goal * 0.95).length;

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
          <h1>Historial de Consumo</h1>
          <p className={styles.subtitle}>Analiza tu progreso semanal o explora por día</p>
        </div>

        <Tabs defaultValue="summary" onValueChange={(value) => setViewMode(value as any)} className={styles.tabsContainer}>
          <TabsList className={styles.tabsList}>
            <TabsTrigger value="summary" className={styles.tabsTrigger}>
              Resumen Semanal
            </TabsTrigger>
            <TabsTrigger value="calendar" className={styles.tabsTrigger}>
              Calendario Completo
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary">
            {!hasSummaryData ? (
              <div className={styles.emptyState}>
                <p>Aún no tienes datos registrados en los últimos 7 días.</p>
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
                      <p className={styles.statLabel}>Promedio (7 días)</p>
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
                        {((daysUnderGoal / summaryData.length) * 100).toFixed(0)}% del periodo
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
                        {((daysOverGoal / summaryData.length) * 100).toFixed(0)}% del periodo
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.chartContainer}>
                  <h2 className={styles.chartTitle}>Consumo vs Meta (Últimos 7 días)</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={summaryData}>
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
              </>
            )}
          </TabsContent>

          <TabsContent value="calendar">
            <div className={styles.calendarViewContainer}>
              <div className={styles.calendarWrapper}>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={es}
                  formatters={{
                    formatDay: (date) => date.getDate().toString() 
                  }}
                  className={styles.calendar}
                />
              </div>
              <div className={styles.selectedDayDetails}>
                <h3>
                  Consumo del {selectedDate ? formatDateShort(dateToISOString(selectedDate)) : '...'}
                </h3>
                {selectedDayEntries.length === 0 ? (
                  <p className={styles.emptyDay}>No hay registros para este día.</p>
                ) : (
                  <div className={styles.selectedDayList}>
                    {selectedDayEntries.map(entry => {
                      const food = entry.foodId 
                        ? combinedFoods.find(f => f.id === entry.foodId) 
                        : undefined;
                      return (
                        <IntakeItem
                          key={entry.id}
                          entry={entry}
                          food={food}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
