import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged, signInWithPopup, signOut, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile,
} from 'firebase/auth';
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
  const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  // Firebase stores and hashes the password; we then save the display name to our profile.
  const register = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    setProfile(await api('/auth/me', { method: 'PATCH', body: { name } }));
  };
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ firebaseUser, user: profile, setUser: setProfile, loading, error, login, loginWithEmail, register, resetPassword, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
