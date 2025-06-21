import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        {/* Убираем ссылку на CoreUI и упоминания */}
        <span>&copy; 2025</span>
      </div>
      <div className="ms-auto">
        {/* Убираем полностью блок "Powered by CoreUI React Admin & Dashboard Template" */}
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)