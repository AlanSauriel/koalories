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
import { FoodItem, IntakeEntry, Goal } from '../types'; 
import { getCurrentDateISO } from '../utils/date';
import { LogOut, Plus, RotateCcw, BarChart3, Download } from 'lucide-react';
import { exportToPDF } from '../utils/pdf'; 
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"; 
import foodsData from '../data/foods.seed.json';
import styles from './Dashboard.module.css';

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  deficit: -500,
  maintenance: 0,
  surplus: 300,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeProfile, logout, updateActiveProfile } = useSession(); 
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showAddManual, setShowAddManual] = useState(false); 
  const [manualName, setManualName] = useState('');
  const [manualKcal, setManualKcal] = useState('');
  const [manualUnits, setManualUnits] = useState('1');
  const [saveToMyFoods, setSaveToMyFoods] = useState(false);

  const today = getCurrentDateISO();
  const intakeKey = activeProfile ? `cc_intake_${activeProfile.id}_${today}` : '';
  const customFoodsKey = activeProfile ? `cc_customFoods_${activeProfile.id}` : '';
  
  const [intakeEntries, setIntakeEntries] = useLocalStorage<IntakeEntry[]>(intakeKey, []);
  const [customFoods, setCustomFoods] = useLocalStorage<FoodItem[]>(customFoodsKey, []);
  const [, setFoodsCache] = useLocalStorage<FoodItem[]>('cc_foodsCache', foodsData);

  useEffect(() => {
    if (!activeProfile) {
      navigate('/login');
      return;
    }
  }, [activeProfile, navigate]);

  // --- CORRECCIÓN AQUÍ ---
  // Se eliminó el guion bajo (_) después de ()
  useEffect(() => {
    setFoodsCache(foodsData);
  }, [setFoodsCache]);
  // --- FIN CORRECIÓN ---

  const filteredFoods = useMemo(() => {
    const combinedFoods = [...foodsData, ...customFoods];
    let filtered = combinedFoods;
    
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

  const totalConsumed = useMemo(() => {
    return intakeEntries.reduce((sum, entry) => sum + (entry.kcalPerUnit * entry.units), 0);
  }, [intakeEntries]);

  const targetKcal = useMemo(() => {
    if (!activeProfile) return 0;
    if (activeProfile.tdee === 0) return 0;
    const adjustment = GOAL_ADJUSTMENTS[activeProfile.goal || 'maintenance'];
    return Math.round(activeProfile.tdee + adjustment);
  }, [activeProfile]);

  const { motivationalPhrase, remainingText } = useMemo(() => {
    if (!activeProfile) {
      return { 
        motivationalPhrase: "Inicia sesión para empezar.",
        remainingText: "" 
      };
    }
    const goal = targetKcal;
    if (goal === 0) {
      return {
        motivationalPhrase: "Ve a 'Mis Datos' para calcular tu meta.",
        remainingText: "Meta no calculada"
      };
    }
    const consumed = Math.round(totalConsumed);
    const remaining = goal - consumed;
    const caloriesOver = consumed - goal;
    const percentage = goal > 0 ? (consumed / goal) * 100 : 0; 
    let phrase = "";
    let remText = "";

    if (percentage === 0) {
      phrase = "¡Un gran viaje empieza con un bocado!";
      remText = `Te faltan ${remaining} kcal`;
    } else if (percentage < 25) {
      phrase = "¡Buen comienzo! Sigue así.";
      remText = `Te faltan ${remaining} kcal`;
    } else if (percentage < 50) {
      phrase = "Vas a mitad de camino, ¡no te detengas!";
      remText = `Te faltan ${remaining} kcal`;
    } else if (percentage < 75) {
      phrase = "Estás haciendo un gran trabajo.";
      remText = `Te faltan ${remaining} kcal`;
    } else if (percentage < 90) {
      phrase = "Estás muy cerca, ¡no te detengas!";
      remText = `Te faltan ${remaining} kcal`;
    } else if (percentage < 100) { 
      phrase = "Ya casi llegas, ¡sigue así!";
      remText = `Te faltan ${remaining} kcal`;
    } else if (percentage === 100) { 
      phrase = "¡Felicidades! ¡Meta alcanzada!";
      remText = "¡Justo en la meta!";
    } else { 
      remText = `Te has pasado por ${caloriesOver} kcal`;
      if (caloriesOver > 50) {
        phrase = "Te pasaste del límite. ¡Mañana volvemos al plan!";
      } else {
        phrase = "Meta superada. Un día no define tu progreso. ¡Ánimo!";
      }
    }
    return { 
      motivationalPhrase: phrase, 
      remainingText: remText
    };
  }, [totalConsumed, activeProfile, targetKcal]);

  const handleUpdateUnits = (id: string, units: number) => {
    setIntakeEntries(
      intakeEntries.map(entry =>
        entry.id === id ? { ...entry, units } : entry
      )
    );
  };

  const handleAddFood = (food: FoodItem) => {
    const existingEntry = intakeEntries.find(entry => entry.foodId === food.id);
    if (existingEntry) {
      handleUpdateUnits(existingEntry.id, existingEntry.units + 1);
    } else {
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
      if (units > 1) {
        const newEntry: IntakeEntry = {
          id: `entry-${Date.now()}`,
          dateISO: today,
          foodId: newFoodItem.id,
          kcalPerUnit: newFoodItem.kcalPerServing,
          units: units,
          timestamp: Date.now(),
        };
        setIntakeEntries([...intakeEntries, newEntry]);
      } else {
        handleAddFood(newFoodItem);
      }
    } else {
      const newEntry: IntakeEntry = {
        id: `entry-${Date.now()}`,
        dateISO: today,
        customName: name,
        kcalPerUnit: kcal,
        units: units,
        timestamp: Date.now(),
      };
      setIntakeEntries([...intakeEntries, newEntry]);
    }
    
    setManualName('');
    setManualKcal('');
    setManualUnits('1');
    setSaveToMyFoods(false);
    setShowAddManual(false); // Cierra el diálogo
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

  const handleGoalChange = (newGoal: Goal) => {
    if (!activeProfile) return;
    if (activeProfile.tdee === 0) {
      alert("Primero necesitas calcular tus datos en la página de registro.");
      navigate('/registro');
      return;
    }
    updateActiveProfile({ goal: newGoal });
  };

  const handleExport = async () => {
    if (!activeProfile) return;
    try {
      await exportToPDF({
        profile: activeProfile,
        date: getCurrentDateISO(),
        entries: intakeEntries,
        foods: [...foodsData, ...customFoods],
        totalConsumed: totalConsumed,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error al exportar el PDF. Por favor intenta de nuevo.');
    }
  };

  if (!activeProfile) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>Bienvenido, {activeProfile.name}</h1>
            <p className={styles.subtitle}>Tu meta: {targetKcal} kcal/día</p>
          </div>
          <div className={styles.headerActions}>
            <Link to="/historial" className={styles.iconButton} aria-label="Ver historial">
              <BarChart3 size={20} />
            </Link>
            <Link to="/registro" className={styles.iconButton} aria-label="Editar mis datos">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </Link>
            <ThemeToggle />
            <button onClick={handleLogout} className={styles.iconButton} aria-label="Cambiar perfil">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.dashboardLayout}>
        
        <main className={styles.mainContent}>
          <section className={styles.catalogSection}>
            
            <div className={styles.sectionHeader}>
              <h2>Catálogo de alimentos</h2>
              <Dialog open={showAddManual} onOpenChange={setShowAddManual}>
                <DialogTrigger asChild>
                  <button className={styles.buttonSecondary}>
                    <Plus size={18} />
                    Añadir Manual
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Añadir alimento manual</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddManual} className={styles.manualForm}>
                    <div className={styles.manualFormGrid}>
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
                    </div>
                    
                    <div className={styles.saveFoodCheckbox}>
                      <input 
                        type="checkbox"
                        id="saveToMyFoods"
                        checked={saveToMyFoods}
                        onChange={(e) => setSaveToMyFoods(e.target.checked)}
                      />
                      <label htmlFor="saveToMyFoods">
                        Guardar en "Mis Alimentos"
                      </label>
                    </div>

                    <button type="submit" className={styles.buttonPrimary}>
                      Agregar
                    </button>
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
                  <FoodCard key={food.id} food={food} onAdd={handleAddFood} />
                ))
              )}
            </div>
          </section>
        </main>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarContent}>
            
            <section className={styles.goalSection}>
              <h3 className={styles.goalTitle}>🎯 Tu Objetivo</h3>
              <div className={styles.goalOptions}>
                <button
                  className={`${styles.goalButton} ${activeProfile.goal === 'deficit' ? styles.goalButtonActive : ''}`}
                  onClick={() => handleGoalChange('deficit')}
                  aria-pressed={activeProfile.goal === 'deficit'}
                >
                  Perder Peso
                  <span>(Déficit ~500 kcal)</span>
                </button>
                <button
                  className={`${styles.goalButton} ${(!activeProfile.goal || activeProfile.goal === 'maintenance') ? styles.goalButtonActive : ''}`}
                  onClick={() => handleGoalChange('maintenance')}
                  aria-pressed={!activeProfile.goal || activeProfile.goal === 'maintenance'}
                >
                  Mantener
                  <span>(TDEE)</span>
                </button>
                <button
                  className={`${styles.goalButton} ${activeProfile.goal === 'surplus' ? styles.goalButtonActive : ''}`}
                  onClick={() => handleGoalChange('surplus')}
                  aria-pressed={activeProfile.goal === 'surplus'}
                >
                  Ganar Peso
                  <span>(Superávit ~300 kcal)</span>
                </button>
              </div>
            </section>
            
            <section className={styles.progressSection}>
              <ProgressRing 
                consumed={totalConsumed} 
                goal={targetKcal} 
              />
              <div className={styles.progressText}>
                <p className={styles.remainingText}>{remainingText}</p>
                <p className={styles.motivationalPhrase}>{motivationalPhrase}</p>

              </div>
            </section>


            <section className={styles.intakeSection}>
              
              <div className={styles.sectionHeader}>
                <h2>Consumo de hoy</h2>
                <div className={styles.intakeHeaderActions}>
                  <button onClick={handleExport} className={styles.iconButton} aria-label="Exportar PDF">
                    <Download size={18} />
                  </button>
                  {intakeEntries.length > 0 && (
                    <button onClick={handleReset} className={`${styles.iconButton} ${styles.iconButtonDanger}`} aria-label="Reiniciar día">
                      <RotateCcw size={18} />
                    </button>
                  )}
                </div>
              </div>

              {intakeEntries.length === 0 ? (
                <p className={styles.emptyState}>
                  Aún no registras alimentos. Busca "manzana" o "arroz" para empezar.
                </p>
              ) : (
                <div className={styles.intakeList}>
                  {intakeEntries.map(entry => {
                    const food = entry.foodId 
                      ? [...foodsData, ...customFoods].find(f => f.id === entry.foodId) 
                      : undefined;
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
          </div>
        </aside>
      </div>
    </div>
  );
}
