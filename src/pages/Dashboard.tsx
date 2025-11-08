import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ThemeToggle } from '../components/ThemeToggle';
import { ProgressRing } from '../components/ProgressRing';
import { FoodCard } from '../components/FoodCard';
import { IntakeItem } from '../components/IntakeItem';
import { SearchBar } from '../components/SearchBar';
import { CategoryFilter } from '../components/CategoryFilter';
import { ExportPanel } from '../components/ExportPanel';
import { FoodItem, IntakeEntry } from '../types';
import { getCurrentDateISO } from '../utils/date';
import { LogOut, Plus, RotateCcw, History } from 'lucide-react';
import foodsData from '../data/foods.seed.json';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeProfile, logout } = useSession();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualKcal, setManualKcal] = useState('');
  const [manualUnits, setManualUnits] = useState('1');

  const today = getCurrentDateISO();
  const intakeKey = activeProfile ? `cc_intake_${activeProfile.id}_${today}` : '';
  
  const [intakeEntries, setIntakeEntries] = useLocalStorage<IntakeEntry[]>(intakeKey, []);
  const [, setFoodsCache] = useLocalStorage<FoodItem[]>('cc_foodsCache', foodsData);

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
    // Initialize foods cache
    setFoodsCache(foodsData);
  }, [setFoodsCache]);

  const filteredFoods = useMemo(() => {
    let filtered = foodsData as FoodItem[];
    
    if (selectedCategory !== 'Todas') {
      filtered = filtered.filter(f => f.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [searchQuery, selectedCategory]);

  const totalConsumed = useMemo(() => {
    return intakeEntries.reduce((sum, entry) => sum + (entry.kcalPerUnit * entry.units), 0);
  }, [intakeEntries]);

  const handleUpdateUnits = (id: string, units: number) => {
    setIntakeEntries(
      intakeEntries.map(entry =>
        entry.id === id ? { ...entry, units } : entry
      )
    );
  };

  const handleAddFood = (food: FoodItem) => {
    // 1. Buscar si ya existe una entrada para este foodId
    const existingEntry = intakeEntries.find(entry => entry.foodId === food.id);

    if (existingEntry) {
      // 2. Si existe, usa la función que ya tienes para actualizar las unidades
      handleUpdateUnits(existingEntry.id, existingEntry.units + 1);
    } else {
      // 3. Si no existe, crea la nueva entrada (como antes)
      const newEntry: IntakeEntry = {
        id: `entry-${Date.now()}`,
        dateISO: today,
        foodId: food.id,
        kcalPerUnit: food.kcalPerServing,
        units: 1,
        timestamp: Date.now(),
      };
      setIntakeEntries([...intakeEntries, newEntry]);
    }
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualKcal) return;

    const newEntry: IntakeEntry = {
      id: `entry-${Date.now()}`,
      dateISO: today,
      customName: manualName.trim(),
      kcalPerUnit: Number(manualKcal),
      units: Number(manualUnits),
      timestamp: Date.now(),
    };
    
    setIntakeEntries([...intakeEntries, newEntry]);
    setManualName('');
    setManualKcal('');
    setManualUnits('1');
    setShowAddManual(false);
  };

  const handleDeleteEntry = (id: string) => {
    setIntakeEntries(intakeEntries.filter(entry => entry.id !== id));
  };

  const handleReset = () => {
    if (confirm('¿Seguro que deseas reiniciar el día?')) {
      setIntakeEntries([]);
    }
  };

  const handleLogout = () => {
    if (confirm('¿Deseas cambiar de perfil?')) {
      logout();
      navigate('/login');
    }
  };

  if (!activeProfile) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>Hola, {activeProfile.name}</h1>
            <p className={styles.subtitle}>Tu meta: {Math.round(activeProfile.tdee)} kcal/día</p>
          </div>
          <div className={styles.headerActions}>
            <Link to="/historial" className={styles.iconButton} aria-label="Ver historial">
              <History size={20} />
            </Link>
            <ThemeToggle />
            <button onClick={handleLogout} className={styles.iconButton} aria-label="Cambiar perfil">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.progressSection}>
          <ProgressRing consumed={totalConsumed} goal={activeProfile.tdee} />
        </section>

        <section className={styles.intakeSection}>
          <div className={styles.sectionHeader}>
            <h2>Consumo de hoy</h2>
            <div className={styles.sectionActions}>
              <ExportPanel
                profile={activeProfile}
                entries={intakeEntries}
                foods={foodsData}
                totalConsumed={totalConsumed}
              />
              <button onClick={() => setShowAddManual(!showAddManual)} className={styles.buttonSecondary}>
                <Plus size={18} />
                Manual
              </button>
              {intakeEntries.length > 0 && (
                <button onClick={handleReset} className={styles.buttonDanger}>
                  <RotateCcw size={18} />
                  Reiniciar
                </button>
              )}
            </div>
          </div>

          {showAddManual && (
            <form onSubmit={handleAddManual} className={styles.manualForm}>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Nombre del alimento"
                className={styles.input}
                required
              />
              <input
                type="number"
                value={manualKcal}
                onChange={(e) => setManualKcal(e.target.value)}
                placeholder="Kcal por unidad"
                min="1"
                className={styles.input}
                required
              />
              <input
                type="number"
                value={manualUnits}
                onChange={(e) => setManualUnits(e.target.value)}
                placeholder="Unidades"
                min="1"
                className={styles.input}
                required
              />
              <button type="submit" className={styles.buttonPrimary}>
                Agregar
              </button>
            </form>
          )}

          {intakeEntries.length === 0 ? (
            <p className={styles.emptyState}>
              Aún no registras alimentos. Busca "manzana" o "arroz" para empezar.
            </p>
          ) : (
            <div className={styles.intakeList}>
              {intakeEntries.map(entry => {
                const food = entry.foodId ? foodsData.find(f => f.id === entry.foodId) : undefined;
                return (
                  <IntakeItem
                    key={entry.id}
                    entry={entry}
                    food={food}
                    onUpdateUnits={handleUpdateUnits}
                    onDelete={handleDeleteEntry}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.catalogSection}>
          <h2>Catálogo de alimentos</h2>
          
          <div className={styles.filters}>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />
          </div>

          <div className={styles.foodGrid}>
            {filteredFoods.length === 0 ? (
              <p className={styles.emptyState}>No se encontraron alimentos</p>
            ) : (
              filteredFoods.map(food => (
                <FoodCard key={food.id} food={food} onAdd={handleAddFood} />
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
