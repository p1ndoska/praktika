import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav>
      <ul className="pagination justify-content-center">
        <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(1)} disabled={currentPage === 1}>&laquo;</button>
        </li>
        <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>&lsaquo;</button>
        </li>
        {pageNumbers.map(number => (
          <li key={number} className={`page-item${currentPage === number ? ' active' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(number)}>{number}</button>
          </li>
        ))}
        <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>&rsaquo;</button>
        </li>
        <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>&raquo;</button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination; 