// frontend/src/pages/Phones.jsx
import EntityPage from '../components/common/EntityPage'
import { phonesConfig } from '../config/entities'

export default function Phones() {
  return <EntityPage config={phonesConfig} />
}