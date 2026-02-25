import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { logAuthEvent, AUDIT_ACTIONS } from '../lib/auditLog';
import { notifyAdmins } from '../lib/notifications';

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  // Isolated async operations - never called from auth callbacks
  const profileOperations = {
    async load(userId) {
      if (!userId) return
      setProfileLoading(true)
      try {
        const { data, error } = await supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single()
        if (!error) setUserProfile(data)
      } catch (error) {
        console.error('Profile load error:', error)
      } finally {
        setProfileLoading(false)
      }
    },

    clear() {
      setUserProfile(null)
      setProfileLoading(false)
    }
  }

  // Auth state handlers - PROTECTED from async modification
  const authStateHandlers = {
    // This handler MUST remain synchronous - Supabase requirement
    onChange: (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (session?.user) {
        profileOperations?.load(session?.user?.id) // Fire-and-forget
      } else {
        profileOperations?.clear()
      }
    }
  }

  useEffect(() => {
    // Safety timeout: if auth check takes too long (e.g. mobile browser
    // restrictions on cookies/storage), stop loading so the app doesn't
    // hang on a spinner forever.
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false)
      }
    }, 5000)

    // Initial session check
    supabase?.auth?.getSession()?.then(({ data: { session } }) => {
      authStateHandlers?.onChange(null, session)
    }).catch(() => {
      setLoading(false)
    })

    // CRITICAL: This must remain synchronous
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange(
      authStateHandlers?.onChange
    )

    return () => {
      clearTimeout(timeout)
      subscription?.unsubscribe()
    }
  }, [])

  // Auth methods
  const signUp = async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase?.auth?.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata.full_name || email.split('@')[0],
            role: metadata.role || 'recruiter'
          }
        }
      })
      return { data, error }
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase?.auth?.signInWithPassword({ email, password })

      if (!error && data?.user) {
        // Fire-and-forget: log login event and notify admins
        logAuthEvent(AUDIT_ACTIONS.LOGIN, {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role
        }, true, { loginMethod: 'email_password' });

        notifyAdmins(
          'login',
          'User Logged In',
          `${data.user.user_metadata?.full_name || data.user.email} has logged in.`,
          { userId: data.user.id, userEmail: data.user.email }
        );
      }

      return { data, error }
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } }
    }
  }

  const signOut = async () => {
    try {
      // Log logout before clearing session so we still have user context
      if (user) {
        logAuthEvent(AUDIT_ACTIONS.LOGOUT, {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role
        }, true);
      }
      const { error } = await supabase?.auth?.signOut()
      if (!error) {
        setUser(null)
        profileOperations?.clear()
      }
      return { error }
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } }
    }
  }

  const getSession = async () => {
    try {
      const { data: { session }, error } = await supabase?.auth?.getSession()
      return { session, error }
    } catch (error) {
      return { session: null, error: { message: 'Network error. Please try again.' } }
    }
  }

  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase?.auth?.refreshSession()
      if (error) {
        // Session expired or invalid - clear state
        setUser(null)
        profileOperations?.clear()
      }
      return { session, error }
    } catch (error) {
      return { session: null, error: { message: 'Network error. Please try again.' } }
    }
  }

  const updateProfile = async (updates) => {
    if (!user) return { error: { message: 'No user logged in' } }
    
    try {
      const { data, error } = await supabase?.from('user_profiles')?.update(updates)?.eq('id', user?.id)?.select()?.single()
      if (!error) setUserProfile(data)
      return { data, error }
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } }
    }
  }

  const checkEmailExists = async (email) => {
    try {
      const { data, error } = await supabase
        ?.from('user_profiles')
        ?.select('id')
        ?.eq('email', email)
        ?.maybeSingle()
      if (error) throw error
      return { exists: !!data, error: null }
    } catch (error) {
      return { exists: false, error }
    }
  }

  const sendOtp = async (email) => {
    try {
      const { error } = await supabase?.auth?.signInWithOtp({
        email,
        options: { shouldCreateUser: false }
      })
      return { error }
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } }
    }
  }

  const sendOtpNewUser = async (email) => {
    try {
      const { error } = await supabase?.auth?.signInWithOtp({
        email,
        options: { shouldCreateUser: true }
      })
      return { error }
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } }
    }
  }

  const verifyOtp = async (email, token) => {
    try {
      const { data, error } = await supabase?.auth?.verifyOtp({
        email,
        token,
        type: 'email'
      })
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error. Please try again.' } }
    }
  }

  const setPassword = async (password) => {
    try {
      const { data, error } = await supabase?.auth?.updateUser({ password })
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Network error. Please try again.' } }
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    profileLoading,
    signUp,
    signIn,
    signOut,
    getSession,
    refreshSession,
    updateProfile,
    checkEmailExists,
    sendOtp,
    sendOtpNewUser,
    verifyOtp,
    setPassword,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
