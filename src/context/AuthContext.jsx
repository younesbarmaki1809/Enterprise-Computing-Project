import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'
import { loginUser } from '../api/auth'

const AUTH_STORAGE_KEY = 'dms_auth'
const TOKEN_STORAGE_KEY = 'dms_token'

const AuthContext = createContext(null)

const initialState = {
  user: null,
  token: null,
  isLoading: true,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
      }
    case 'HYDRATE':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY)

      if (!raw) {
        dispatch({
          type: 'HYDRATE',
          payload: {
            user: null,
            token: null,
          },
        })
        return
      }

      const parsed = JSON.parse(raw)

      dispatch({
        type: 'HYDRATE',
        payload: {
          user: parsed.user,
          token: parsed.token,
        },
      })
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      dispatch({
        type: 'HYDRATE',
        payload: {
          user: null,
          token: null,
        },
      })
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const payload = await loginUser(email, password)

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload))
    localStorage.setItem(TOKEN_STORAGE_KEY, payload.token)
    dispatch({ type: 'LOGIN', payload })

    return payload.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    dispatch({ type: 'LOGOUT' })
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
    }),
    [state, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider')
  }

  return context
}
