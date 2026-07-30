import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { ensureUserProfile, getUserProfile } from '../lib/data'
import type { AppUserProfile } from '../types/models'

interface AuthContextValue {
  firebaseUser: User | null
  user: AppUserProfile | null
  loading: boolean
  register: (name: string, email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function fallbackName(email: string | null): string {
  if (!email) return 'Member'
  const local = email.split('@')[0]
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : 'Member'
}

function buildFallbackProfile(firebaseUser: User): AppUserProfile {
  return {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || fallbackName(firebaseUser.email),
    email: (firebaseUser.email || '').toLowerCase(),
  }
}

async function loadOrCreateProfile(firebaseUser: User): Promise<AppUserProfile> {
  const existing = await getUserProfile(firebaseUser.uid)
  if (existing) return existing

  const profile: AppUserProfile = buildFallbackProfile(firebaseUser)
  await ensureUserProfile(profile)
  return profile
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [user, setUser] = useState<AppUserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setFirebaseUser(nextUser)

      if (!nextUser) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const profile = await loadOrCreateProfile(nextUser)
        setUser(profile)
      } catch (error) {
        console.error('Failed to load user profile:', error)
        setUser(buildFallbackProfile(nextUser))
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true)
    try {
      const cleanEmail = email.trim().toLowerCase()
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password)
      const cleanName = name.trim()

      if (cleanName) {
        await updateProfile(credential.user, { displayName: cleanName })
      }

      const profile: AppUserProfile = {
        uid: credential.user.uid,
        name: cleanName || fallbackName(cleanEmail),
        email: cleanEmail,
      }

      await ensureUserProfile(profile)
      setFirebaseUser(credential.user)
      setUser(profile)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      setFirebaseUser(credential.user)

      try {
        const profile = await loadOrCreateProfile(credential.user)
        setUser(profile)
      } catch (error) {
        console.error('Failed to hydrate user profile during login:', error)
        setUser(buildFallbackProfile(credential.user))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      user,
      loading,
      register,
      login,
      logout,
    }),
    [firebaseUser, user, loading, register, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return value
}
