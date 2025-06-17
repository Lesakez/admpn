import React from 'react'

// Наши страницы
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Accounts = React.lazy(() => import('./views/accounts/Accounts'))
const Profiles = React.lazy(() => import('./views/profiles/Profiles'))
const Proxies = React.lazy(() => import('./views/proxies/Proxies'))

// Стандартные CoreUI страницы (оставляем некоторые для примера)
const Colors = React.lazy(() => import('./views/theme/colors/Colors'))
const Typography = React.lazy(() => import('./views/theme/typography/Typography'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  
  // Наши основные страницы
  { path: '/accounts', name: 'Аккаунты', element: Accounts },
  { path: '/profiles', name: 'Профили', element: Profiles },
  { path: '/proxies', name: 'Прокси', element: Proxies },
  
  // Примеры CoreUI (оставляем для справки)
  { path: '/theme', name: 'Theme', element: Colors, exact: true },
  { path: '/theme/colors', name: 'Colors', element: Colors },
  { path: '/theme/typography', name: 'Typography', element: Typography },
]

export default routes