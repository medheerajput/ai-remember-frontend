import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

import {profileApi} from '../api/profileApi';
import type {ProfileResponse} from '../types/api.types';
import {GOOGLE_WEB_CLIENT_ID} from '../config/google';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
});

interface AuthContextValue {
  firebaseUser: FirebaseAuthTypes.User | null;
  profile: ProfileResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  continueWithGoogle: () => Promise<void>;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;

  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [firebaseUser, setFirebaseUser] =
    useState<FirebaseAuthTypes.User | null>(null);

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncBackendProfile = useCallback(
    async (user: FirebaseAuthTypes.User) => {
      const profileData = await profileApi.createProfile(
        user.displayName ?? undefined,
      );

      setProfile(profileData);
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async user => {
      try {
        setIsLoading(true);
        setFirebaseUser(user);

        if (user) {
          await syncBackendProfile(user);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.log('Auth sync error:', error);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [syncBackendProfile]);

  const continueWithGoogle = useCallback(async () => {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    const signInResult = await GoogleSignin.signIn();

    const idToken = signInResult?.idToken;

    if (!idToken) {
      throw new Error('Google Sign-In failed. No ID token received.');
    }

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    await auth().signInWithCredential(googleCredential);
  }, []);

  // Keep these for now. We can remove later if Google-only final.
  const login = useCallback(async (email: string, password: string) => {
    await auth().signInWithEmailAndPassword(email.trim(), password);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await auth().createUserWithEmailAndPassword(
        email.trim(),
        password,
      );

      await result.user.updateProfile({
        displayName: name.trim(),
      });

      await syncBackendProfile(result.user);
    },
    [syncBackendProfile],
  );

  const logout = useCallback(async () => {
    setProfile(null);

    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.log('Google sign out skipped:', error);
    }

    await auth().signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    const data = await profileApi.getProfile();
    setProfile(data);
  }, []);

  const updateProfileName = useCallback(async (name: string) => {
    const data = await profileApi.updateProfile(name);
    setProfile(data);

    const currentUser = auth().currentUser;

    if (currentUser) {
      await currentUser.updateProfile({
        displayName: name,
      });
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    await profileApi.deleteProfile();

    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.log('Google sign out skipped:', error);
    }

    const currentUser = auth().currentUser;

    if (currentUser) {
      await currentUser.delete();
    }

    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      profile,
      isLoading,
      isAuthenticated: Boolean(firebaseUser && profile),

      continueWithGoogle,

      login,
      register,

      logout,
      refreshProfile,
      updateProfileName,
      deleteAccount,
    }),
    [
      firebaseUser,
      profile,
      isLoading,
      continueWithGoogle,
      login,
      register,
      logout,
      refreshProfile,
      updateProfileName,
      deleteAccount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};