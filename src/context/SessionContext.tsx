import { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Profile } from '../types';

type SetValue<T> = (value: T | ((val: T) => T)) => void;

type AuthResult =
  | { success: true; profile: Profile }
  | { success: false; error: string };

interface SessionContextType {
  profiles: Profile[];
  activeProfileId: string | null;
  activeProfile: Profile | null;
  setProfiles: SetValue<Profile[]>;
  setActiveProfileId: SetValue<string | null>;
  registerProfile: (name: string, password: string) => AuthResult;
  login: (name: string, password: string) => AuthResult;
  deleteProfile: (profileId: string) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useLocalStorage<Profile[]>('cc_profiles', []);
  const [activeProfileId, setActiveProfileId] = useLocalStorage<string | null>('cc_activeProfileId', null);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || null;

  const registerProfile = (name: string, password: string): AuthResult => {
    const trimmedName = name.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedPassword) {
      return { success: false, error: 'Por favor completa todos los campos' };
    }

    if (trimmedPassword.length < 4) {
      return { success: false, error: 'La contraseña debe tener al menos 4 caracteres' };
    }

    const nameAlreadyExists = profiles.some(
      (profile) => profile.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (nameAlreadyExists) {
      return { success: false, error: 'Este nombre de usuario ya existe' };
    }

    const newProfile: Profile = {
      id: `profile-${Date.now()}`,
      name: trimmedName,
      password: trimmedPassword,
      sex: 'male',
      age: 0,
      weightKg: 0,
      heightCm: 0,
      activity: 'sedentario',
      tdee: 0,
      createdAt: new Date().toISOString(),
    };

    setProfiles((prevProfiles) => [...prevProfiles, newProfile]);
    setActiveProfileId(newProfile.id);

    return { success: true, profile: newProfile };
  };

  const login = (name: string, password: string): AuthResult => {
    const trimmedName = name.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedPassword) {
      return { success: false, error: 'Por favor completa todos los campos' };
    }

    const profile = profiles.find(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (!profile) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    if (profile.password !== trimmedPassword) {
      return { success: false, error: 'Contraseña incorrecta' };
    }

    setActiveProfileId(profile.id);

    return { success: true, profile };
  };

  const deleteProfile = (profileId: string) => {
    setProfiles((prevProfiles) => prevProfiles.filter((profile) => profile.id !== profileId));

    if (activeProfileId === profileId) {
      setActiveProfileId(null);
    }

    if (typeof window !== 'undefined') {
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith(`cc_intake_${profileId}_`))
        .forEach((key) => {
          try {
            window.localStorage.removeItem(key);
          } catch (error) {
            console.warn(`Error removing localStorage key "${key}":`, error);
          }
        });
    }
  };

  const logout = () => {
    setActiveProfileId(null);
  };

  return (
    <SessionContext.Provider value={{
      profiles,
      activeProfileId,
      activeProfile,
      setProfiles,
      setActiveProfileId,
      registerProfile,
      login,
      deleteProfile,
      logout,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
