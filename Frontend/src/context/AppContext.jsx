import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'
import { getCategories } from '../api/categories'
import { getDepartments } from '../api/departments'

const AppContext = createContext(null)

const initialState = {
  users: [],
  documents: [],
  departments: [],
  categories: [],
  notifications: [],
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USERS':
      return { ...state, users: action.payload }
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload }
    case 'SET_DEPARTMENTS':
      return { ...state, departments: action.payload }
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload }
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      }
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload,
        ),
      }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    let isMounted = true

    async function loadReferenceData() {
      try {
        const [departments, categories] = await Promise.all([
          getDepartments(),
          getCategories(),
        ])

        if (!isMounted) {
          return
        }

        dispatch({ type: 'SET_DEPARTMENTS', payload: departments })
        dispatch({ type: 'SET_CATEGORIES', payload: categories })
      } catch {
        if (!isMounted) {
          return
        }

        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            id: crypto.randomUUID(),
            type: 'error',
            message: 'Failed to load categories and departments.',
          },
        })
      }
    }

    loadReferenceData()

    return () => {
      isMounted = false
    }
  }, [])

  const removeNotification = useCallback((id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }, [])

  const addNotification = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID()

    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id,
        type,
        message,
      },
    })

    window.setTimeout(() => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
    }, 3500)
  }, [])

  const value = useMemo(
    () => ({
      state,
      dispatch,
      addNotification,
      removeNotification,
    }),
    [state, addNotification, removeNotification],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('useApp must be used inside AppProvider')
  }

  return context
}
