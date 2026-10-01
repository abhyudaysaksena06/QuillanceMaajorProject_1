import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged, signInWithPopup, signOut, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, EmailAuthProvider,
  linkWithCredential, linkWithPopup, reauthenticateWithCredential, reauthenticateWithPopup, updatePassword,
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

  const register = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    setProfile(await api('/auth/me', { method: 'PATCH', body: { name } }));
  };
  const logout = () => signOut(auth);

  const providers = () => (auth.currentUser?.providerData || []).map((p) => p.providerId);

  const withRecentLogin = async (action) => {
    try {
      return await action();
    } catch (err) {
      if (err.code !== 'auth/requires-recent-login') throw err;
      await reauthenticateWithPopup(auth.currentUser, googleProvider);
      return action();
    }
  };

  const createPassword = (password) => withRecentLogin(() =>
    linkWithCredential(auth.currentUser, EmailAuthProvider.credential(auth.currentUser.email, password)));

  const changePassword = async (currentPassword, newPassword) => {
    await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(auth.currentUser.email, currentPassword));
    await updatePassword(auth.currentUser, newPassword);
  };

  const linkGoogle = async () => {
    const result = await linkWithPopup(auth.currentUser, googleProvider);
    if (result.user.email?.toLowerCase() !== auth.currentUser.email?.toLowerCase()) {
      throw new Error('Choose the Google account with the same email address.');
    }
    return result;
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, user: profile, setUser: setProfile, loading, error, login, loginWithEmail, register, resetPassword, logout, refreshProfile, providers, createPassword, changePassword, linkGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
