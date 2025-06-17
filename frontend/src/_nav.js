import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilPeople,
  cilUser,
  cilGlobeAlt,
  cilColorPalette,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: {
      color: 'info',
      text: 'NEW',
    },
  },
  {
    component: CNavTitle,
    name: 'Управление ресурсами',
  },
  {
    component: CNavItem,
    name: 'Аккаунты',
    to: '/accounts',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Профили',
    to: '/profiles',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Прокси',
    to: '/proxies',
    icon: <CIcon icon={cilGlobeAlt} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Примеры CoreUI',
  },
  {
    component: CNavItem,
    name: 'Цвета',
    to: '/theme/colors',
    icon: <CIcon icon={cilColorPalette} customClassName="nav-icon" />,
  },
]

export default _nav