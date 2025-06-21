import React from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CPlaceholder,
  CRow,
  CCol
} from '@coreui/react'

/**
 * SKELETON КОМПОНЕНТ ДЛЯ КАРТОЧЕК
 * Использует CoreUI CPlaceholder для разных типов карточек
 */
const CardSkeleton = ({ 
  hasHeader = true,
  rows = 3,
  variant = 'default', // 'default', 'stats', 'form'
  animation = "glow"
}) => {
  
  const renderStatsCard = () => (
    <CCard className="mb-4">
      <CCardBody>
        <div className="d-flex justify-content-between align-items-center">
          <div className="flex-grow-1">
            <CPlaceholder 
              animation={animation} 
              style={{ width: '80px', height: '36px', marginBottom: '8px' }} 
            />
            <CPlaceholder 
              animation={animation} 
              style={{ width: '140px', height: '16px' }} 
            />
          </div>
          <CPlaceholder 
            animation={animation} 
            style={{ width: '48px', height: '48px', borderRadius: '8px' }} 
          />
        </div>
      </CCardBody>
    </CCard>
  );

  const renderFormCard = () => (
    <CCard>
      {hasHeader && (
        <CCardHeader>
          <CPlaceholder 
            animation={animation} 
            style={{ width: '200px', height: '20px' }} 
          />
        </CCardHeader>
      )}
      <CCardBody>
        <CRow>
          <CCol md={6}>
            <div className="mb-3">
              <CPlaceholder 
                animation={animation} 
                style={{ width: '80px', height: '16px', marginBottom: '8px' }} 
              />
              <CPlaceholder 
                animation={animation} 
                style={{ width: '100%', height: '38px', borderRadius: '4px' }} 
              />
            </div>
          </CCol>
          <CCol md={6}>
            <div className="mb-3">
              <CPlaceholder 
                animation={animation} 
                style={{ width: '100px', height: '16px', marginBottom: '8px' }} 
              />
              <CPlaceholder 
                animation={animation} 
                style={{ width: '100%', height: '38px', borderRadius: '4px' }} 
              />
            </div>
          </CCol>
          <CCol md={12}>
            <div className="mb-3">
              <CPlaceholder 
                animation={animation} 
                style={{ width: '90px', height: '16px', marginBottom: '8px' }} 
              />
              <CPlaceholder 
                animation={animation} 
                style={{ width: '100%', height: '100px', borderRadius: '4px' }} 
              />
            </div>
          </CCol>
        </CRow>
        <div className="d-flex gap-2 justify-content-end">
          <CPlaceholder 
            animation={animation} 
            style={{ width: '80px', height: '38px', borderRadius: '4px' }} 
          />
          <CPlaceholder 
            animation={animation} 
            style={{ width: '100px', height: '38px', borderRadius: '4px' }} 
          />
        </div>
      </CCardBody>
    </CCard>
  );

  const renderDefaultCard = () => (
    <CCard>
      {hasHeader && (
        <CCardHeader>
          <CPlaceholder 
            animation={animation} 
            style={{ width: '250px', height: '20px' }} 
          />
        </CCardHeader>
      )}
      <CCardBody>
        {Array(rows).fill().map((_, index) => (
          <div key={index} className="mb-3">
            <CPlaceholder 
              animation={animation} 
              style={{ 
                width: Math.random() > 0.5 ? '90%' : '70%', 
                height: '20px' 
              }} 
            />
          </div>
        ))}
      </CCardBody>
    </CCard>
  );

  switch (variant) {
    case 'stats':
      return renderStatsCard();
    case 'form':
      return renderFormCard();
    default:
      return renderDefaultCard();
  }
};

export default CardSkeleton;