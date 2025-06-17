import React from 'react'


const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Accounts = React.lazy(() => import('./views/accounts/Accounts'))
const Profiles = React.lazy(() => import('./views/profiles/Profiles'))
const Proxies = React.lazy(() => import('./views/proxies/Proxies'))
const Phones = React.lazy(() => import('./views/phones/Phones'))
const Projects = React.lazy(() => import('./views/projects/Projects'))
const Activity = React.lazy(() => import('./views/activity/Activity'))
const OTPGenerator = React.lazy(() => import('./views/otp/OTPGenerator'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  
  // Наши основные страницы
  { path: '/accounts', name: 'Аккаунты', element: Accounts },
  { path: '/profiles', name: 'Профили', element: Profiles },
  { path: '/proxies', name: 'Прокси', element: Proxies },
  { path: '/phones', name: 'Телефоны', element: Phones },
  { path: '/projects', name: 'Проекты', element: Projects },
  { path: '/activity', name: 'Активность', element: Activity },
  { path: '/otp', name: 'OTP Генератор', element: OTPGenerator },
]

export default routes