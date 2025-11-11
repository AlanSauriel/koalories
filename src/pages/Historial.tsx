import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { ArrowLeft, TrendingUp, TrendingDown, Target, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart, Area } from 'recharts';
import { getDaysAgo, formatDateShort, dateToISOString } from '../utils/date';
import { IntakeEntry, FoodItem } from '../types';
import styles from './Historial.module.css';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Calendar } from "../components/ui/calendar";
import { useLocalStorage } from '../hooks/useLocalStorage'; 
import { IntakeItem } from '../components/IntakeItem'; 
import foodsData from '../data/foods.seed.json'; 
import { es } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { SearchBar } from '../components/SearchBar';
import { CategoryFilter } from '../components/CategoryFilter';
import { FoodCard } from '../components/FoodCard';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from 'framer-motion'; // --- IMPORTADO (IDEA 1) ---


interface HistoryPoint {
  date: string;
  kcal: number;
  goal: number;
}

const today = new Date();
const endOfToday = new Date(new Date().setHours(23, 59, 59, 999));


export default function Historial() {
  const navigate = useNavigate();
  const { activeProfile } = useSession();

  const [viewMode, setViewMode] = useState<'summary' | 'calendar'>('summary');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDayEntries, setSelectedDayEntries] = useState<IntakeEntry[]>([]);
  
  const [summaryData, setSummaryData] = useState<HistoryPoint[]>([]);

  const customFoodsKey = activeProfile ? `cc_customFoods_${activeProfile.id}` : '';
  const [customFoods, setCustomFoods] = useLocalStorage<FoodItem[]>(customFoodsKey, []);
  
  const combinedFoods = useMemo(() => {
    return [...foodsData, ...customFoods];
  }, [customFoods]);
  
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  
  const [showAddManual, setShowAddManual] = useState(false); 
  const [manualName, setManualName] = useState('');
  const [manualKcal, setManualKcal] = useState('');
  const [manualUnits, setManualUnits] = useState('1');
  const [saveToMyFoods, setSaveToMyFoods] = useState(false);
  
  const [isQuantityDialogOpen, setIsQuantityDialogOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('1');
  
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

  const writeEntriesForDate = (dateISO: string, entries: IntakeEntry[]) => {
    if (typeof window === 'undefined' || !activeProfile) return;
    const key = `cc_intake_${activeProfile.id}_${dateISO}`;
    try {
      window.localStorage.setItem(key, JSON.stringify(entries));
    } catch (error) {
      console.warn(`Error guardando datos en localStorage para ${key}`, error);
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

  const filteredFoods = useMemo(() => {
    const allFoods = [...foodsData, ...customFoods];
    let filtered = allFoods;
    
    if (selectedCategory !== 'Todas') {
      if (selectedCategory === 'Mis Alimentos') {
        filtered = customFoods;
      } else {
        filtered = filtered.filter(f => f.category === selectedCategory);
      }
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(query)
      );
    }
    
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [searchQuery, selectedCategory, customFoods]);
  

  const handleDeleteEntry = (entryId: string) => {
    if (!selectedDate) return;
    const dateISO = dateToISOString(selectedDate);
    
    const updatedEntries = selectedDayEntries.filter(entry => entry.id !== entryId);
    setSelectedDayEntries(updatedEntries);
    writeEntriesForDate(dateISO, updatedEntries);
  };

  const handleUpdateUnits = (entryId: string, newUnits: number) => {
    if (!selectedDate || newUnits < 1) return;
    const dateISO = dateToISOString(selectedDate);

    const updatedEntries = selectedDayEntries.map(entry =>
      entry.id === entryId ? { ...entry, units: newUnits } : entry
    );
    setSelectedDayEntries(updatedEntries);
    writeEntriesForDate(dateISO, updatedEntries);
  };

  const handleHistoryAddFood = (food: FoodItem, unitsToAdd: number) => {
    if (!selectedDate || unitsToAdd <= 0) return;
    const dateISO = dateToISOString(selectedDate);

    const existingEntry = selectedDayEntries.find(entry => entry.foodId === food.id);
    
    if (existingEntry) {
      handleUpdateUnits(existingEntry.id, existingEntry.units + unitsToAdd);
    } else {
      const newEntry: IntakeEntry = {
        id: `entry-${Date.now()}`,
        dateISO: dateISO,
        foodId: food.id,
        kcalPerUnit: food.kcalPerServing,
        units: unitsToAdd,
        timestamp: Date.now(),
      };
      const updatedEntries = [newEntry, ...selectedDayEntries];
      setSelectedDayEntries(updatedEntries);
      writeEntriesForDate(dateISO, updatedEntries);
    }
  };

  const handleHistoryOpenQuantityDialog = (food: FoodItem) => {
    setSelectedFood(food);
    setQuantity('1');
    setIsQuantityDialogOpen(true);
  };

  const handleHistorySubmitQuantity = () => {
    if (!selectedFood) return;
    const units = Number(quantity);
    if (units > 0) {
      handleHistoryAddFood(selectedFood, units);
    }
    setIsQuantityDialogOpen(false);
    setSelectedFood(null);
  };

  const handleHistoryAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualKcal || !selectedDate) return;

    const dateISO = dateToISOString(selectedDate);
    const units = Number(manualUnits) || 1;
    const kcal = Number(manualKcal);
    const name = manualName.trim();

    if (saveToMyFoods) {
      const newFoodItem: FoodItem = {
        id: `custom-${Date.now()}`,
        name: name,
        category: 'Mis Alimentos',
        kcalPerServing: kcal,
        servingName: '1 unidad',
        isCustom: true,
      };
      setCustomFoods(prev => [...prev, newFoodItem]);
      handleHistoryAddFood(newFoodItem, units);

    } else {
      const newEntry: IntakeEntry = {
        id: `entry-${Date.now()}`,
        dateISO: dateISO,
        customName: name,
        kcalPerUnit: kcal,
        units: units,
        timestamp: Date.now(),
      };
      const updatedEntries = [newEntry, ...selectedDayEntries];
      setSelectedDayEntries(updatedEntries);
      writeEntriesForDate(dateISO, updatedEntries);
    }
    
    setManualName('');
    setManualKcal('');
    setManualUnits('1');
    setSaveToMyFoods(false);
    setShowAddManual(false); 
  };

  if (!activeProfile) return null;

  const hasSummaryData = summaryData.some(d => d.kcal > 0);

  const totalKcal = summaryData.reduce((sum, d) => sum + d.kcal, 0);
  const avgKcal = totalKcal / (summaryData.length || 1);
  const daysOverGoal = summaryData.filter(d => d.kcal > d.goal * 1.05).length;
  const daysUnderGoal = summaryData.filter(d => d.kcal < d.goal * 0.95).length;

  const isFutureDate = selectedDate ? selectedDate > endOfToday : false;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        {/* ... (el JSX del header es igual) ... */}
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
              // ... (el JSX de 'emptyState' es igual) ...
              <div className={styles.emptyState}>
                <p>Aún no tienes datos registrados en los últimos 7 días.</p>
                <Link to="/dashboard" className={styles.buttonPrimary}>
                  Ir al dashboard
                </Link>
              </div>
            ) : (
              <>
                <div className={styles.statsGrid}>
                  {/* ... (el JSX de 'statsGrid' es igual) ... */}
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
                  {/* ... (el JSX de 'chartContainer' es igual) ... */}
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
                {/* ... (el JSX del 'Calendar' es igual) ... */}
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={es}
                  formatters={{
                    formatDay: (date) => date.getDate().toString() 
                  }}
                  className={styles.calendar}
                  disabled={{ after: today }}
                />
              </div>
              <div className={styles.selectedDayDetails}>
                <h3 className={styles.selectedDayHeader}>
                  <span>
                    Consumo del {selectedDate ? formatDateShort(dateToISOString(selectedDate)) : '...'}
                  </span>
                  
                  {!isFutureDate && (
                    <div className={styles.calendarActions}>
                      <button 
                        onClick={() => setIsCatalogOpen(true)}
                        className={styles.addDayButton}
                        aria-label="Añadir alimento a este día"
                      >
                        <Plus size={18} />
                        Añadir
                      </button>
                    </div>
                  )}
                </h3>
                {selectedDayEntries.length === 0 ? (
                  <p className={styles.emptyDay}>No hay registros para este día.</p>
                ) : (
                  <div className={styles.selectedDayList}>
                    {/* --- CAMBIO (IDEA 1): ANIMACIÓN DE LISTA --- */}
                    <AnimatePresence>
                      {selectedDayEntries.map(entry => {
                        const food = entry.foodId 
                          ? combinedFoods.find(f => f.id === entry.foodId) 
                          : undefined;
                        return (
                          <IntakeItem
                            key={entry.id}
                            entry={entry}
                            food={food}
                            onUpdateUnits={!isFutureDate ? handleUpdateUnits : undefined}
                            onDelete={!isFutureDate ? handleDeleteEntry : undefined}
                          />
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
                
                {isFutureDate && (
                  <p className={styles.emptyDay}>
                    No puedes registrar alimentos en una fecha futura.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* --- MODAL DEL CATÁLOGO --- */}
        <Dialog open={isCatalogOpen} onOpenChange={setIsCatalogOpen}>
          {/* ... (el JSX del 'Catalog Dialog' es igual) ... */}
          <DialogContent className={styles.catalogDialog}>
            <DialogHeader>
              <DialogTitle>Añadir a {selectedDate ? formatDateShort(dateToISOString(selectedDate)) : '...'}</DialogTitle>
            </DialogHeader>
            <div className={styles.catalogContent}>
              <div className={styles.catalogHeader}>
                <Dialog open={showAddManual} onOpenChange={setShowAddManual}>
                  <DialogTrigger asChild>
                    <button className={styles.buttonSecondary}>
                      <Plus size={18} />
                      Añadir Manual
                    </button>
                  </DialogTrigger>
                  <DialogContent className={styles.manualDialog}>
                    <DialogHeader>
                      <DialogTitle>Añadir alimento manual</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleHistoryAddManual} className={styles.manualForm}>
                      <div className={styles.manualFormGrid}>
                        <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Nombre del alimento" className={styles.input} required />
                        <input type="number" value={manualKcal} onChange={(e) => setManualKcal(e.target.value)} placeholder="Kcal por unidad" min="1" className={styles.input} required />
                        <input type="number" value={manualUnits} onChange={(e) => setManualUnits(e.target.value)} placeholder="Unidades" min="1" className={styles.input} required />
                      </div>
                      <div className={styles.saveFoodCheckbox}>
                        <input type="checkbox" id="saveToMyFoodsHistorial" checked={saveToMyFoods} onChange={(e) => setSaveToMyFoods(e.target.checked)} />
                        <label htmlFor="saveToMyFoodsHistorial">Guardar en "Mis Alimentos"</label>
                      </div>
                      <button type="submit" className={styles.buttonPrimary}>Agregar</button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className={styles.filters}>
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
                <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />
              </div>
              <div className={styles.foodGrid}>
                {filteredFoods.length === 0 ? (
                  <p className={styles.emptyState}>No se encontraron alimentos</p>
                ) : (
                  filteredFoods.map(food => (
                    <FoodCard 
                      key={food.id} 
                      food={food} 
                      onAdd={handleHistoryOpenQuantityDialog} 
                    />
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* --- MODAL (IDEA 1) --- */}
        <Dialog open={isQuantityDialogOpen} onOpenChange={setIsQuantityDialogOpen}>
          {/* ... (el JSX del Dialog 'Cantidad' es igual) ... */}
          <DialogContent className={styles.quantityDialog}>
            <DialogHeader>
              <DialogTitle>Añadir {selectedFood?.name}</DialogTitle>
              <DialogDescription>
                {selectedFood?.servingName} ({selectedFood?.kcalPerServing} kcal c/u)
              </DialogDescription>
            </DialogHeader>
            <div className={styles.quantityForm}>
              <label htmlFor="quantity-hist" className={styles.label}>
                Cantidad
              </label>
              <Input
                id="quantity-hist"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                className={styles.input}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleHistorySubmitQuantity();
                    e.preventDefault();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsQuantityDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleHistorySubmitQuantity}>Agregar {quantity}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
