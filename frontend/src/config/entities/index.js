export { accountsConfig } from './accounts'
export { profilesConfig } from './profiles'
export { proxiesConfig } from './proxies'
export { phonesConfig } from './phones'
export { projectsConfig } from './projects'
export { activityConfig } from './activity'

// Маппинг для удобного доступа
export const entityConfigs = {
  accounts: () => import('./accounts').then(m => m.accountsConfig),
  profiles: () => import('./profiles').then(m => m.profilesConfig),
  proxies: () => import('./proxies').then(m => m.proxiesConfig),
  phones: () => import('./phones').then(m => m.phonesConfig),
  projects: () => import('./projects').then(m => m.projectsConfig),
  activity: () => import('./activity').then(m => m.activityConfig),
}

// Синхронный доступ (если конфигурации уже загружены)
export const getEntityConfig = (entityType) => {
  switch (entityType) {
    case 'account':
    case 'accounts':
      return accountsConfig
    case 'profile':
    case 'profiles':
      return profilesConfig
    case 'proxy':
    case 'proxies':
      return proxiesConfig
    case 'phone':
    case 'phones':
      return phonesConfig
    case 'project':
    case 'projects':
      return projectsConfig
    case 'activity':
      return activityConfig
    default:
      throw new Error(`Unknown entity type: ${entityType}`)
  }
}