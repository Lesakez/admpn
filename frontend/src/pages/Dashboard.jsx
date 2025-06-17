import { useQuery } from '@tanstack/react-query'
import { Users, UserCheck, Globe, Smartphone } from 'lucide-react'
import api from '../utils/api'

const statsQueries = [
  { key: 'accounts', endpoint: '/accounts/stats', label: 'Аккаунты', icon: Users },
  { key: 'proxies', endpoint: '/proxies/stats', label: 'Прокси', icon: Globe },
  { key: 'phones', endpoint: '/phones/stats', label: 'Телефоны', icon: Smartphone },
]

function StatsCard({ title, value, icon: Icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600 bg-blue-50',
    green: 'bg-green-500 text-green-600 bg-green-50',
    yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-50',
    red: 'bg-red-500 text-red-600 bg-red-50',
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center">
          <div className={`p-2 rounded-md ${colorClasses[color].split(' ')[2]}`}>
            <Icon className={`h-6 w-6 ${colorClasses[color].split(' ')[1]}`} />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status, count }) {
  const getStatusColor = (status) => {
    const colors = {
      active: 'badge-success',
      free: 'badge-success',
      inactive: 'badge-gray',
      banned: 'badge-danger',
      busy: 'badge-warning',
      working: 'badge-warning',
    }
    return colors[status] || 'badge-gray'
  }

  return (
    <span className={`badge ${getStatusColor(status)} mr-2 mb-2`}>
      {status}: {count}
    </span>
  )
}

export default function Dashboard() {
  const { data: accountsStats } = useQuery({
    queryKey: ['accounts', 'stats'],
    queryFn: () => api.get('/accounts/stats').then(res => res.data.data),
  })

  const { data: proxiesStats } = useQuery({
    queryKey: ['proxies', 'stats'],
    queryFn: () => api.get('/proxies/stats').then(res => res.data.data),
  })

  const { data: phonesStats } = useQuery({
    queryKey: ['phones', 'stats'],
    queryFn: () => api.get('/phones/stats').then(res => res.data.data),
  })

  const { data: recentActivity } = useQuery({
    queryKey: ['activity', 'recent'],
    queryFn: () => api.get('/activity?limit=10').then(res => res.data.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Обзор системы AdminPanel ZDE</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Всего аккаунтов"
          value={accountsStats?.total || 0}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Всего прокси"
          value={proxiesStats?.total || 0}
          icon={Globe}
          color="green"
        />
        <StatsCard
          title="Всего телефонов"
          value={phonesStats?.total || 0}
          icon={Smartphone}
          color="yellow"
        />
        <StatsCard
          title="Активность (24ч)"
          value={recentActivity?.length || 0}
          icon={UserCheck}
          color="red"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts Stats */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">Статистика аккаунтов</h3>
          </div>
          <div className="card-body">
            {accountsStats?.byStatus ? (
              <div>
                {Object.entries(accountsStats.byStatus).map(([status, count]) => (
                  <StatusBadge key={status} status={status} count={count} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Загрузка...</p>
            )}
          </div>
        </div>

        {/* Proxies Stats */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">Статистика прокси</h3>
          </div>
          <div className="card-body">
            {proxiesStats?.byStatus ? (
              <div>
                {Object.entries(proxiesStats.byStatus).map(([status, count]) => (
                  <StatusBadge key={status} status={status} count={count} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Загрузка...</p>
            )}
          </div>
        </div>

        {/* Phones Stats */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">Статистика телефонов</h3>
          </div>
          <div className="card-body">
            {phonesStats?.byStatus ? (
              <div>
                {Object.entries(phonesStats.byStatus).map(([status, count]) => (
                  <StatusBadge key={status} status={status} count={count} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Загрузка...</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium">Последняя активность</h3>
        </div>
        <div className="card-body">
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 text-sm">
                  <div className="flex-shrink-0">
                    <span className="badge badge-info">{activity.entityType}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">{activity.description}</p>
                  </div>
                  <div className="flex-shrink-0 text-gray-500">
                    {new Date(activity.timestamp).toLocaleString('ru-RU')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Нет недавней активности</p>
          )}
        </div>
      </div>
    </div>
  )
}