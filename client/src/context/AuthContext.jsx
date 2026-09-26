import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshProfile = useCallback(async () => {
    const me = await api('/auth/me');
    setProfile(me);
    return me;
  }, []);

  useEffect(() => onAuthStateChanged(auth, async (fbUser) => {
    setFirebaseUser(fbUser);
    setError(null);
    if (fbUser) {
      try {
        await refreshProfile();
      } catch (err) {
        setError(err.message);
        setProfile(null);
      }
    } else {
      setProfile(null);
    }
    setLoading(false);
  }), [refreshProfile]);

  const login = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ firebaseUser, user: profile, setUser: setProfile, loading, error, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
