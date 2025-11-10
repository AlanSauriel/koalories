import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useCaloriesCalculator } from '../hooks/useCaloriesCalculator';
import { ThemeToggle } from '../components/ThemeToggle';
import { Sex, ActivityLevel } from '../types';
import { Save } from 'lucide-react';
import styles from './Registro.module.css';

export default function Registro() {
  const navigate = useNavigate();
  const { activeProfile, profiles, setProfiles } = useSession();
  const calculateCalories = useCaloriesCalculator();

  // --- 1. MODIFICAR ESTADOS ---
  // Los estados ahora guardarán un 'string' para permitir campos vacíos ("")
  // o valores a medio escribir (ej. "70.").
  const [sex, setSex] = useState<Sex>(activeProfile?.sex || 'male');
  
  const [age, setAge] = useState<string>(
    activeProfile?.age ? String(activeProfile.age) : ''
  );
  const [weightKg, setWeightKg] = useState<string>(
    activeProfile?.weightKg ? String(activeProfile.weightKg) : ''
  );
  const [heightCm, setHeightCm] = useState<string>(
    activeProfile?.heightCm ? String(activeProfile.heightCm) : ''
  );
  
  const [activity, setActivity] = useState<ActivityLevel>(activeProfile?.activity || 'moderado');

  useEffect(() => {
    if (!activeProfile) {
      navigate('/login');
    }
  }, [activeProfile, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;

    // --- 2. MODIFICAR SUBMIT ---
    // Convertimos los 'string' a 'number' solo al guardar.
    // Usamos parseFloat para peso (permite decimales) y Number para el resto.
    const ageNum = Number(age) || 0;
    const weightNum = parseFloat(weightKg) || 0;
    const heightNum = Number(heightCm) || 0;

    if (ageNum < 13 || weightNum < 30 || heightNum < 120) {
      alert("Por favor, ingresa valores válidos para edad (mín. 13), peso (mín. 30) y altura (mín. 120).");
      return;
    }

    const { tdee } = calculateCalories({ 
      sex, 
      age: ageNum, 
      weightKg: weightNum, 
      heightCm: heightNum, 
      activity 
    });

    const updatedProfile = {
      ...activeProfile,
      password: activeProfile.password || '',
      sex,
      age: ageNum,
      weightKg: weightNum,
      heightCm: heightNum,
      activity,
      tdee,
    };

    const updatedProfiles = profiles.map(p =>
      p.id === activeProfile.id ? updatedProfile : p
    );

    setProfiles(updatedProfiles);
    navigate('/dashboard');
  };

  if (!activeProfile) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <ThemeToggle />
      </div>

      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Datos Físicos</h1>
          <p className={styles.subtitle}>
            Ingresa tu información para calcular tus calorías diarias
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="sex">Sexo</label>
              <select
                id="sex"
                value={sex}
                onChange={(e) => setSex(e.target.value as Sex)}
                className={styles.select}
              >
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
              </select>
            </div>

            {/* --- 3. MODIFICAR INPUTS --- */}
            <div className={styles.field}>
              <label htmlFor="age">Edad (años)</label>
              <input
                id="age"
                type="number"
                min="13"
                max="80"
                value={age} // El valor es el 'string' del estado
                placeholder="Ej. 25"
                // El onChange ahora solo guarda el string
                onChange={(e) => setAge(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="weight">Peso (kg)</label>
              <input
                id="weight"
                type="number"
                min="30"
                max="250"
                step="0.1" // "step" permite los decimales
                value={weightKg} // El valor es el 'string' del estado
                placeholder="Ej. 70.5"
                // El onChange ahora solo guarda el string
                onChange={(e) => setWeightKg(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="height">Altura (cm)</label>
              <input
                id="height"
                type="number"
                min="120"
                max="220"
                value={heightCm} // El valor es el 'string' del estado
                placeholder="Ej. 175"
                // El onChange ahora solo guarda el string
                onChange={(e) => setHeightCm(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="activity">Nivel de actividad</label>
              <select
                id="activity"
                value={activity}
                onChange={(e) => setActivity(e.target.value as ActivityLevel)}
                className={styles.select}
              >
                <option value="sedentario">Sedentario (poco o sin ejercicio)</option>
                <option value="ligero">Ligero (ejercicio 1-3 días/semana)</option>
                <option value="moderado">Moderado (ejercicio 3-5 días/semana)</option>
                <option value="intenso">Intenso (ejercicio 6-7 días/semana)</option>
                <option value="muy_intenso">Muy intenso (ejercicio 2 veces/día)</option>
              </select>
            </div>

            <button type="submit" className={styles.buttonPrimary}>
              <Save size={20} />
              Guardar y continuar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
