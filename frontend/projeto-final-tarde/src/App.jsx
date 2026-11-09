import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import Configuracoes from './Configuracoes'
import Feed from './Feed'
import Login from './Login'
import Perfil from './Perfil'
import { hasAuthToken } from './api'

function RequireAuth({ children }) {
  if (!hasAuthToken()) {
    return <Navigate to="/login" replace />
  }

  return children
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/feed',
    element: <RequireAuth><Feed /></RequireAuth>,
  },
  {
    path: '/perfil',
    element: <RequireAuth><Perfil /></RequireAuth>,
  },
  {
    path: '/configuracoes',
    element: <RequireAuth><Configuracoes /></RequireAuth>,
  },
  {
    path: '/config',
    element: <RequireAuth><Configuracoes /></RequireAuth>,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
