import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { listFelines } from "./api";
import { useStorageState } from "./useStorageState";

const AuthContext = createContext<{
  signIn: (token: string) => void;
  signOut: () => void;
  session?: string | null;
  hasFeline: boolean | null;
  markHasFeline: () => void;
  isLoading: boolean;
} | null>(null);

export function useSession() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useSession must be wrapped in a <SessionProvider />");
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isStorageLoading, session], setSession] = useStorageState("session");
  const [hasFeline, setHasFeline] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) {
      setHasFeline(null);
      return;
    }

    let cancelled = false;
    listFelines(session)
      .then((felines) => {
        if (!cancelled) setHasFeline(felines.length > 0);
      })
      .catch(() => {
        // We don't know whether this household has Felines — treating it as zero would
        // risk trapping an existing user in the onboarding gate with no way out. Signing
        // out is the safe fallback: a bad/expired session gets corrected, and a transient
        // network error just asks the user to sign back in and re-check.
        if (!cancelled) setSession(null);
      });

    return () => {
      cancelled = true;
    };
  }, [session, setSession]);

  return (
    <AuthContext.Provider
      value={{
        signIn: (token: string) => {
          setSession(token);
        },
        signOut: () => {
          setSession(null);
        },
        session,
        hasFeline,
        markHasFeline: () => setHasFeline(true),
        isLoading: isStorageLoading || (!!session && hasFeline === null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
