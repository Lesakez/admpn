// frontend/src/pages/Projects.jsx
import EntityPage from '../components/common/EntityPage'
import { projectsConfig } from '../config/entities'

export default function Projects() {
  return <EntityPage config={projectsConfig} />
}