import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { queryClient } from "@/App";

export interface CustomUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

interface AuthContextValue {
  user: CustomUser | User | null;
  loading: boolean;
  setLocalUser: (user: CustomUser | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  setLocalUser: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [localUser, setLocalUserState] = useState<CustomUser | null>(() => {
    try {
      const saved = localStorage.getItem("aerodiag_local_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        localStorage.removeItem("aerodiag_local_user");
        localStorage.setItem("aerodiag_user_uid", user.uid);
        setLocalUserState(null);
      } else {
        localStorage.removeItem("aerodiag_user_uid");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const setLocalUser = (u: CustomUser | null) => {
    setLocalUserState(u);
    if (u) {
      localStorage.setItem("aerodiag_local_user", JSON.stringify(u));
      localStorage.setItem("aerodiag_user_uid", u.uid);
    } else {
      localStorage.removeItem("aerodiag_local_user");
      localStorage.removeItem("aerodiag_user_uid");
    }
  };

  const signOut = async () => {
    setLocalUser(null);
    queryClient.clear();
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  const effectiveUser = firebaseUser || localUser;

  return (
    <AuthContext.Provider value={{ user: effectiveUser, loading, setLocalUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
