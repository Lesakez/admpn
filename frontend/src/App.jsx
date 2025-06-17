import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Profiles from './pages/Profiles'
import Proxies from './pages/Proxies'
import Phones from './pages/Phones'
import Projects from './pages/Projects'
import Activity from './pages/Activity'
import OTP from './pages/OTP'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/proxies" element={<Proxies />} />
        <Route path="/phones" element={<Phones />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/otp" element={<OTP />} />
      </Routes>
    </Layout>
  )
}

export default App