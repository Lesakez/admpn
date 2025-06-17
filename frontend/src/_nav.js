import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilPeople,
  cilUser,
  cilGlobeAlt,
  cilDevices,
  cilFolder,
  cilChart,
  cilShieldAlt,
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
    component: CNavItem,
    name: 'Телефоны',
    to: '/phones',
    icon: <CIcon icon={cilDevices} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Проекты',
    to: '/projects',
    icon: <CIcon icon={cilFolder} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Мониторинг',
  },
  {
    component: CNavItem,
    name: 'Активность',
    to: '/activity',
    icon: <CIcon icon={cilChart} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Инструменты',
  },
  {
    component: CNavItem,
    name: 'OTP Генератор',
    to: '/otp',
    icon: <CIcon icon={cilShieldAlt} customClassName="nav-icon" />,
  },
]

export default _nav