import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, UserPlus, LogIn } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { ThemeToggle } from '../components/ThemeToggle';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const {
    profiles,
    activeProfileId,
    registerProfile,
    login,
    deleteProfile,
  } = useSession();
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');
  const [registerError, setRegisterError] = useState('');
  const loginPasswordRef = useRef<HTMLInputElement | null>(null);
  const loginNameId = useId();
  const loginPasswordId = useId();
  const registerNameId = useId();
  const registerPasswordId = useId();
  const registerConfirmId = useId();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (activeProfileId && profiles.find(p => p.id === activeProfileId)) {
      navigate('/dashboard');
    }
  }, [activeProfileId, profiles, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const loginResult = login(loginName, loginPassword);

    if (!loginResult.success) {
      setLoginError(loginResult.error);
      return;
    }

    setLoginName('');
    setLoginPassword('');
    navigate('/dashboard');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (registerPassword !== registerConfirm) {
      setRegisterError('Las contraseñas no coinciden');
      return;
    }

    const registerResult = registerProfile(registerName, registerPassword);

    if (!registerResult.success) {
      setRegisterError(registerResult.error);
      return;
    }

    setRegisterName('');
    setRegisterPassword('');
    setRegisterConfirm('');
    navigate('/registro');
  };

  const handleDeleteProfile = (profileId: string) => {
    if (confirm('¿Seguro que deseas eliminar este perfil?')) {
      deleteProfile(profileId);
    }
  };

  const handleSelectProfile = (profileName: string) => {
    setLoginError('');
    setLoginName(profileName);
    setLoginPassword('');
    loginPasswordRef.current?.focus();
  };

  const formattedProfiles = useMemo(() => {
    const dateFormatter = new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return profiles
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(profile => ({
        ...profile,
        formattedDate: dateFormatter.format(new Date(profile.createdAt)),
      }));
  }, [profiles]);

  const trimmedLoginName = loginName.trim();
  const trimmedLoginPassword = loginPassword.trim();
  const trimmedRegisterName = registerName.trim();
  const trimmedRegisterPassword = registerPassword.trim();
  const trimmedRegisterConfirm = registerConfirm.trim();

  const hasSavedProfiles = formattedProfiles.length > 0;
  const normalizedLoginName = trimmedLoginName.toLowerCase();
  const isLoginDisabled = trimmedLoginName.length === 0 || trimmedLoginPassword.length === 0;
  const isRegisterDisabled =
    trimmedRegisterName.length === 0 ||
    trimmedRegisterPassword.length < 4 ||
    trimmedRegisterConfirm.length < 4 ||
    trimmedRegisterPassword !== trimmedRegisterConfirm;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <ThemeToggle />
      </div>

      <div className={styles.container}>
        <div className={styles.intro}>
          <img src="/images/kalories.png" alt="Kalories" className={styles.logo} />
          <p>Construye tu bienestar bocado a bocado y que tus metas iluminen tu camino.</p>
        </div>

        <div className={styles.cardsGrid}>
          <section className={`${styles.card} ${styles.loginCard}`}>
            <div className={styles.cardHeader}>
              <h2>Iniciar sesión</h2>
              <p>Accede con tu perfil guardado para continuar donde lo dejaste.</p>
            </div>

            {loginError && (
              <div className={styles.error} role="alert" aria-live="assertive">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className={styles.form} noValidate>
              <div className={styles.field}>
                <label htmlFor={loginNameId} className={styles.label}>
                  Nombre de usuario
                </label>
                <input
                  id={loginNameId}
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="Ej. MariaFit"
                  className={styles.input}
                  maxLength={50}
                  autoComplete="username"
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor={loginPasswordId} className={styles.label}>
                  Contraseña
                </label>
                <input
                  id={loginPasswordId}
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••"
                  className={styles.input}
                  minLength={4}
                  ref={loginPasswordRef}
                  autoComplete="current-password"
                  required
                />
              </div>
              <button type="submit" className={styles.buttonPrimary} disabled={isLoginDisabled}>
                <LogIn size={20} />
                Entrar
              </button>
            </form>

            {hasSavedProfiles ? (
              <div className={styles.profilesList}>
                <h3>Perfiles guardados</h3>
                {formattedProfiles.map(profile => {
                  const isSelected = normalizedLoginName === profile.name.toLowerCase();

                  return (
                    <div key={profile.id} className={styles.profileItem}>
                      <button
                        type="button"
                        onClick={() => handleSelectProfile(profile.name)}
                        className={`${styles.profileButton} ${isSelected ? styles.profileButtonActive : ''}`}
                        aria-pressed={isSelected}
                      >
                        <div className={styles.profileInfo}>
                          <span className={styles.profileName}>{profile.name}</span>
                          <span className={styles.profileMeta}>
                            Creado el {profile.formattedDate}
                          </span>
                          {profile.tdee > 0 && (
                            <span className={styles.profileMeta}>
                              Meta: {Math.round(profile.tdee)} kcal
                            </span>
                          )}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProfile(profile.id)}
                        className={styles.deleteButton}
                        aria-label={`Eliminar ${profile.name}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.helperText}>
                Aún no hay perfiles creados. Regístrate para comenzar a usar la app.
              </p>
            )}
          </section>

          <section className={`${styles.card} ${styles.registerCard}`}>
            <div className={styles.cardHeader}>
              <h2>Crear cuenta</h2>
              <p>Genera un perfil nuevo y guarda tus datos de progreso.</p>
            </div>

            {registerError && (
              <div className={styles.error} role="alert" aria-live="assertive">{registerError}</div>
            )}

            <form onSubmit={handleRegister} className={styles.form} noValidate>
              <div className={styles.field}>
                <label htmlFor={registerNameId} className={styles.label}>
                  Nombre para mostrar
                </label>
                <input
                  id={registerNameId}
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Tu nombre o apodo"
                  className={styles.input}
                  maxLength={50}
                  autoComplete="username"
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor={registerPasswordId} className={styles.label}>
                  Contraseña
                </label>
                <input
                  id={registerPasswordId}
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className={styles.input}
                  minLength={4}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor={registerConfirmId} className={styles.label}>
                  Confirmar contraseña
                </label>
                <input
                  id={registerConfirmId}
                  type="password"
                  value={registerConfirm}
                  onChange={(e) => setRegisterConfirm(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className={styles.input}
                  minLength={4}
                  autoComplete="new-password"
                  required
                />
              </div>
              <button type="submit" className={styles.buttonSecondary} disabled={isRegisterDisabled}>
                <UserPlus size={20} />
                Registrarme
              </button>
            </form>

            <p className={styles.helperText}>
              Tras crear tu cuenta completaremos tus datos físicos para personalizar las calorías.
            </p>
          </section>
        </div>

        <p className={styles.disclaimer} role="note">
          ⚠️ Demo educativa. No guarda datos sensibles. No sustituye asesoría médica.
        </p>
      </div>
    </div>
  );
}
