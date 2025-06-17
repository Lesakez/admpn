// frontend/src/pages/Activity.jsx
import EntityPage from '../components/common/EntityPage'
import { activityConfig } from '../config/entities'

export default function Activity() {
  return <EntityPage config={activityConfig} />
}