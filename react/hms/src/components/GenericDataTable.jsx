import { MdVisibility, MdEdit, MdDelete, MdChevronLeft, MdChevronRight, MdDescription } from 'react-icons/md';
import './GenericDataTable.css';

const GenericDataTable = ({
    columns,
    data,
    isLoading,
    currentPage,
    itemsPerPage,
    onPageChange,
    onView,
    onEdit,
    onDelete,
    customActions,
    emptyText = "No data available"
}) => {
    // Pagination logic
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const currentData = data.slice(startIndex, startIndex + itemsPerPage);

    const handlePrevPage = () => {
        if (currentPage > 0) onPageChange(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) onPageChange(currentPage + 1);
    };

    if (isLoading) {
        return (
            <div className="table-loading">
                <div className="spinner"></div>
                <p>Loading data...</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="table-empty">
                <MdDescription className="empty-icon" />
                <p>{emptyText}</p>
            </div>
        );
    }

    return (
        <div className="generic-data-table-wrapper">
            <div className="table-container">
                <table className="modern-table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col.key} onClick={col.sortable ? () => { } : undefined} style={{ cursor: col.sortable ? 'pointer' : 'default' }}>
                                    {col.label}
                                </th>
                            ))}
                            {(onView || onEdit || onDelete || customActions) && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.map((item, index) => (
                            <tr key={item.id || index}>
                                {columns.map((col) => (
                                    <td key={`${item.id}-${col.key}`}>
                                        {col.format ? col.format(item[col.key]) : item[col.key]}
                                    </td>
                                ))}
                                {(onView || onEdit || onDelete || customActions) && (
                                    <td className="actions-cell">
                                        <div className="action-buttons">
                                            {customActions && customActions(item)}
                                            {onView && (
                                                <button className="btn-icon view" onClick={() => onView(item)} title="View">
                                                    <MdVisibility />
                                                </button>
                                            )}
                                            {onEdit && (
                                                <button className="btn-icon edit" onClick={() => onEdit(item)} title="Edit">
                                                    <MdEdit />
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button className="btn-icon delete" onClick={() => onDelete(item)} title="Delete">
                                                    <MdDelete />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination-footer">
                    <button
                        className="page-arrow"
                        disabled={currentPage === 0}
                        onClick={handlePrevPage}
                    >
                        <MdChevronLeft />
                    </button>
                    <span className="page-info">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                        className="page-arrow"
                        disabled={currentPage >= totalPages - 1}
                        onClick={handleNextPage}
                    >
                        <MdChevronRight />
                    </button>
                </div>
            )}
        </div>
    );
};

export default GenericDataTable;
