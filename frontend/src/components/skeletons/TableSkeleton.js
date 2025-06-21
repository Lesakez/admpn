import React from 'react'
import {
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CPlaceholder
} from '@coreui/react'

/**
 * SKELETON КОМПОНЕНТ ДЛЯ ТАБЛИЦ
 * 
 * Использует CoreUI CPlaceholder для красивой анимации загрузки
 * Заменяет спиннеры на skeleton структуру будущего контента
 * Улучшает восприятие скорости загрузки
 */
const TableSkeleton = ({ 
  rows = 5, 
  columns = 6, 
  hasActions = true,
  hasCheckbox = true,
  animation = "glow" // "glow" или "wave"
}) => {
  const renderHeaderCell = (index) => {
    let width = '100%';
    
    // Разные ширины для разных колонок
    if (hasCheckbox && index === 0) width = '40px';
    else if (hasActions && index === columns - 1) width = '120px';
    else if (index === 1) width = '60%';
    else if (index === 2) width = '40%';
    else width = '80%';

    return (
      <CTableHeaderCell key={index}>
        <CPlaceholder 
          animation={animation}
          style={{ width, height: '16px' }}
        />
      </CTableHeaderCell>
    );
  };

  const renderDataCell = (rowIndex, colIndex) => {
    let width = '100%';
    let height = '20px';
    
    // Разные стили для разных типов данных
    if (hasCheckbox && colIndex === 0) {
      // Чекбокс
      return (
        <CTableDataCell key={colIndex}>
          <CPlaceholder 
            animation={animation}
            style={{ width: '16px', height: '16px', borderRadius: '3px' }}
          />
        </CTableDataCell>
      );
    } else if (hasActions && colIndex === columns - 1) {
      // Кнопки действий
      return (
        <CTableDataCell key={colIndex}>
          <div className="d-flex gap-1">
            <CPlaceholder 
              animation={animation}
              style={{ width: '32px', height: '32px', borderRadius: '4px' }}
            />
            <CPlaceholder 
              animation={animation}
              style={{ width: '32px', height: '32px', borderRadius: '4px' }}
            />
          </div>
        </CTableDataCell>
      );
    } else {
      // Обычные данные - разная ширина для реалистичности
      if (colIndex === 1) width = Math.random() > 0.5 ? '70%' : '90%'; // Название
      else if (colIndex === 2) width = Math.random() > 0.5 ? '50%' : '70%'; // Статус
      else width = Math.random() > 0.3 ? '60%' : '80%'; // Другие поля
      
      return (
        <CTableDataCell key={colIndex}>
          <CPlaceholder 
            animation={animation}
            style={{ width, height }}
          />
        </CTableDataCell>
      );
    }
  };

  return (
    <div className="table-skeleton">
      <CTable hover responsive>
        <CTableHead>
          <CTableRow>
            {Array(columns).fill().map((_, index) => renderHeaderCell(index))}
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {Array(rows).fill().map((_, rowIndex) => (
            <CTableRow key={rowIndex}>
              {Array(columns).fill().map((_, colIndex) => 
                renderDataCell(rowIndex, colIndex)
              )}
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>
    </div>
  );
};

export default TableSkeleton;