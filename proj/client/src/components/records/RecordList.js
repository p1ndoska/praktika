import React, { useEffect, useState, useMemo } from 'react';
import {
    Table,
    Button,
    Container,
    Alert,
    Spinner,
    Form,
    Row,
    Col,
    Pagination,
    Card,
    FormText
} from 'react-bootstrap';
import recordService from '../../services/recordService';
import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';
import './RecordForms.css';

const RecordList = () => {
    const { token, user } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Пагинация
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage] = useState(10);

    // Сортировка
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'ascending'
    });

    // Фильтры
    const [filters, setFilters] = useState({
        UserFullName: '',
        Position: '',
        Email: '',
        Phone: '',
        OrganizationName: '',
        ExternalUserName: '',
        ExternalUserPosition: '',
        ExternalUserEmail: '',
        ExternalUserPhone: '',
        ObjectName: '',
        WorkTypes: '',
        AccessType: '',
        AccessStartDateFrom: '',
        AccessStartDateTo: '',
        ActualConnectionDate: '',
        ActualDisconnectionDate: '',
        Curator: '',
        Executor: '',
        Notes: ''
    });

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const data = await recordService.getRecords(token);
            setRecords(data);
        } catch (err) {
            setError('Ошибка загрузки записей');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить запись?')) return;
        try {
            await recordService.deleteRecord(id, token);
            setRecords(records.filter(r => r.RecordId !== id));
        } catch (err) {
            setError('Ошибка удаления записи');
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({
            UserFullName: '',
            Position: '',
            Email: '',
            Phone: '',
            OrganizationName: '',
            ExternalUserName: '',
            ExternalUserPosition: '',
            ExternalUserEmail: '',
            ExternalUserPhone: '',
            ObjectName: '',
            WorkTypes: '',
            AccessType: '',
            AccessStartDateFrom: '',
            AccessStartDateTo: '',
            ActualConnectionDate: '',
            ActualDisconnectionDate: '',
            Curator: '',
            Executor: '',
            Notes: ''
        });
        setCurrentPage(1);
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const processedRecords = useMemo(() => {
        let filtered = [...records];

        // Применение фильтров
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                if (key.includes("Date")) {
                    try {
                        const filterValue = filters[key];

                        if (key === 'AccessStartDateFrom') {
                            const dateValue = new Date(filterValue);
                            dateValue.setHours(0, 0, 0, 0);

                            filtered = filtered.filter(record => {
                                const recordDate = new Date(record['AccessStartDate']);
                                recordDate.setHours(0, 0, 0, 0);
                                return recordDate >= dateValue;
                            });
                        } else if (key === 'AccessStartDateTo') {
                            const dateValue = new Date(filterValue);
                            dateValue.setHours(23, 59, 59, 999);

                            filtered = filtered.filter(record => {
                                const recordDate = new Date(record['AccessStartDate']);
                                return recordDate <= dateValue;
                            });
                        } else {
                            // Для других дат просто ищем совпадения в строке
                            filtered = filtered.filter(record =>
                                String(record[key] || '').toLowerCase().includes(filterValue.toLowerCase())
                            );
                        }
                    } catch (e) {
                        console.error("Ошибка фильтрации по дате:", e);
                    }
                } else {
                    // Обычная фильтрация для не-дат
                    filtered = filtered.filter(record =>
                        String(record[key] || '').toLowerCase().includes(filters[key].toLowerCase())
                    );
                }
            }
        });

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key] || '';
                const bValue = b[sortConfig.key] || '';

                // Особое сравнение для дат
                if (sortConfig.key.includes('Date')) {
                    const dateA = new Date(aValue).getTime();
                    const dateB = new Date(bValue).getTime();

                    if (isNaN(dateA)) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (isNaN(dateB)) return sortConfig.direction === 'ascending' ? 1 : -1;

                    return sortConfig.direction === 'ascending'
                        ? dateA - dateB
                        : dateB - dateA;
                }

                // Стандартное сравнение для строк
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [records, filters, sortConfig]);

    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = processedRecords.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(processedRecords.length / recordsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading)
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" />
            </Container>
        );

    if (error)
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );

    // Стили таблицы
    const tableStyles = {
        table: {
            minWidth: '100%',
            tableLayout: 'auto',
        },
        th: {
            textAlign: 'center',
            verticalAlign: 'middle',
            whiteSpace: 'normal',
            overflow: 'visible',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
        },
        td: {
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            textOverflow: 'ellipsis',
            verticalAlign: 'top',
            textAlign: 'left',
            padding: '8px',
            maxWidth: '400px', // увеличено
            minWidth: '180px', // увеличено
        },
        sortableHeader: {
            cursor: 'pointer',
            userSelect: 'none'
        }
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
    };

    // Функция для экспорта данных в CSV
    const exportToCSV = () => {
        if (processedRecords.length === 0) {
            alert('Нет данных для выгрузки');
            return;
        }

        const headers = [
            '№ п/п',
            'Ф.И.О., должность, email, телефон контактного лица',
            'Наименование стороннего пользователя (организации)',
            'ФИО, должность, email, телефон стороннего пользователя',
            'Сведения об объекте подключения',
            'Виды выполняемых работ',
            'Тип доступа (локальный/удаленный)',
            'Срок предоставления доступа',
            'Фактическое время подключения/отключения',
            'Куратор',
            'Исполнитель',
            'Примечание'
        ];

        const csvRows = [];

        // Добавляем заголовок
        csvRows.push(headers.join(';'));

        // Добавляем строки
        processedRecords.forEach((record, index) => {
            const row = [
                index + 1,
                `"${record.UserFullName}\n${record.Position}\n${record.Email}\n${record.Phone}"`,
                `"${record.OrganizationName}"`,
                `"${record.ExternalUserName || ''}\n${record.ExternalUserPosition || ''}\n${record.ExternalUserEmail || ''}\n${record.ExternalUserPhone || ''}"`,
                `"${record.ObjectName}"`,
                `"${record.WorkTypes}"`,
                `"${record.AccessType}"`,
                `"${new Date(record.AccessStartDate).toLocaleString()}\n${
                    record.AccessEndDate ? new Date(record.AccessEndDate).toLocaleString() : 'не указано'
                }"`,
                `"${record.ActualConnectionDate ? new Date(record.ActualConnectionDate).toLocaleString() : 'не подключено'}\n${
                    record.ActualDisconnectionDate ? new Date(record.ActualDisconnectionDate).toLocaleString() : 'не отключено'
                }"`,
                `"${record.Curator}"`,
                `"${record.Executor}"`,
                `"${record.Notes}"`
            ];
            csvRows.push(row.join(';'));
        });

        const csvString = csvRows.join('\r\n');

        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'journal_dostupa.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Формирование подсказки для фильтра по датам
    const getDateFilterHint = () => {
        if (filters.AccessStartDateFrom && filters.AccessStartDateTo) {
            return `Показаны записи с ${filters.AccessStartDateFrom} по ${filters.AccessStartDateTo}`;
        } else if (filters.AccessStartDateFrom) {
            return `Показаны записи от ${filters.AccessStartDateFrom}`;
        } else if (filters.AccessStartDateTo) {
            return `Показаны записи до ${filters.AccessStartDateTo}`;
        }
        return '';
    };

    return (
        <Container fluid className="mt-5" style={{maxWidth: '1800px'}}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Журнал доступа</h2>
                <div className="d-flex gap-2">
                    <Button variant="success" onClick={() => navigate('/records/create')}>
                        Добавить запись
                    </Button>
                    <Button variant="warning" onClick={exportToCSV}>
                        Выгрузить отчет
                    </Button>
                </div>
            </div>

            {/* Фильтры над таблицей */}
            <Card className="mb-4">
                <Card.Header>Фильтры</Card.Header>
                <Card.Body>
                    <Form>
                        <Row className="g-2">
                            <Col md={3} sm={6} xs={12}>
                                <Form.Group>
                                    <Form.Label>ФИО</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="UserFullName"
                                        value={filters.UserFullName}
                                        onChange={handleFilterChange}
                                        style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3} sm={6} xs={12}>
                                <Form.Group>
                                    <Form.Label>Организация</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="OrganizationName"
                                        value={filters.OrganizationName}
                                        onChange={handleFilterChange}
                                        style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3} sm={6} xs={12}>
                                <Form.Group>
                                    <Form.Label>Объект подключения</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="ObjectName"
                                        value={filters.ObjectName}
                                        onChange={handleFilterChange}
                                        style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2} sm={6} xs={12}>
                                <Form.Group>
                                    <Form.Label>Тип доступа</Form.Label>
                                    <Form.Select
                                        name="AccessType"
                                        value={filters.AccessType}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">Все</option>
                                        <option value="локальный">Локальный</option>
                                        <option value="удаленный">Удаленный</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2} sm={6} xs={12}>
                                <Form.Group>
                                    <Form.Label>Дата начала с</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="AccessStartDateFrom"
                                        value={filters.AccessStartDateFrom}
                                        onChange={handleFilterChange}
                                        max={filters.AccessStartDateTo || undefined}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2} sm={6} xs={12}>
                                <Form.Group>
                                    <Form.Label>по</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="AccessStartDateTo"
                                        value={filters.AccessStartDateTo}
                                        onChange={handleFilterChange}
                                        min={filters.AccessStartDateFrom || undefined}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2} sm={6} xs={12}>
                                <Form.Group>
                                    <Form.Label>Куратор</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="Curator"
                                        value={filters.Curator}
                                        onChange={handleFilterChange}
                                        style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2} sm={6} xs={12}>
                                <Form.Group>
                                    <Form.Label>Исполнитель</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="Executor"
                                        value={filters.Executor}
                                        onChange={handleFilterChange}
                                        style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2} sm={6} xs={12} className="d-flex align-items-end">
                                <Button variant="secondary" onClick={resetFilters} className="w-100">
                                    Сбросить фильтры
                                </Button>
                            </Col>
                        </Row>
                        {getDateFilterHint() && (
                            <div className="text-muted mt-2">{getDateFilterHint()}</div>
                        )}
                    </Form>
                </Card.Body>
            </Card>

            <div style={{ overflowX: 'auto' }}>
                <Table striped bordered hover responsive className="record-table" style={tableStyles.table}>
                    <thead>
                    <tr>
                        <th style={tableStyles.th}>№ п/п</th>
                        <th style={{ ...tableStyles.th, ...tableStyles.sortableHeader, minWidth: 220, maxWidth: 420 }} onClick={() => requestSort('UserFullName')}>
                            Ф.И.О, должность, email, телефон контактного лица{getSortIndicator('UserFullName')}
                        </th>
                        <th style={{ ...tableStyles.th, ...tableStyles.sortableHeader, minWidth: 180, maxWidth: 320 }} onClick={() => requestSort('OrganizationName')}>
                            Наименование стороннего пользователя (организации){getSortIndicator('OrganizationName')}
                        </th>
                        <th style={{ ...tableStyles.th, ...tableStyles.sortableHeader, minWidth: 220, maxWidth: 420 }} onClick={() => requestSort('ExternalUserName')}>
                            ФИО, должность, email, телефон стороннего пользователя{getSortIndicator('ExternalUserName')}
                        </th>
                        <th style={{ ...tableStyles.th, ...tableStyles.sortableHeader, minWidth: 180, maxWidth: 320 }} onClick={() => requestSort('ObjectName')}>
                            Сведения об объекте подключения{getSortIndicator('ObjectName')}
                        </th>
                        <th style={{ ...tableStyles.th, ...tableStyles.sortableHeader, minWidth: 180, maxWidth: 320 }} onClick={() => requestSort('WorkTypes')}>
                            Виды выполняемых работ{getSortIndicator('WorkTypes')}
                        </th>
                        <th style={tableStyles.th} onClick={() => requestSort('AccessType')}>
                            Тип доступа (локальный/удаленный){getSortIndicator('AccessType')}
                        </th>
                        <th style={tableStyles.th} onClick={() => requestSort('AccessStartDate')}>
                            Срок предоставления доступа{getSortIndicator('AccessStartDate')}
                        </th>
                        <th style={tableStyles.th} onClick={() => requestSort('ActualConnectionDate')}>
                            Фактическое время подключения/отключения{getSortIndicator('ActualConnectionDate')}
                        </th>
                        <th style={tableStyles.th} onClick={() => requestSort('Curator')}>
                            Куратор{getSortIndicator('Curator')}
                        </th>
                        <th style={tableStyles.th} onClick={() => requestSort('Executor')}>
                            Исполнитель{getSortIndicator('Executor')}
                        </th>
                        <th style={tableStyles.th} onClick={() => requestSort('Notes')}>
                            Примечание{getSortIndicator('Notes')}
                        </th>
                        {user.role === 'admin' && <th style={tableStyles.th}>Действия</th>}
                    </tr>
                    </thead>
                    <tbody>
                    {currentRecords.length > 0 ? (
                        currentRecords.map((record, index) => (
                            <tr key={record.RecordId}>
                                <td>{indexOfFirstRecord + index + 1}</td>
                                <td style={{...tableStyles.td, wordBreak: 'break-word'}}>
                                    <div><strong>{record.UserFullName}</strong></div>
                                    <div>{record.Position}</div>
                                    <div>{record.Email}</div>
                                    <div>{record.Phone}</div>
                                </td>
                                <td style={{...tableStyles.td, wordBreak: 'break-word'}}>{record.OrganizationName}</td>
                                <td style={{...tableStyles.td, wordBreak: 'break-word'}}>
                                    {record.ExternalUserName && (
                                        <>
                                            <div><strong>{record.ExternalUserName}</strong></div>
                                            <div>{record.ExternalUserPosition}</div>
                                            <div>{record.ExternalUserEmail}</div>
                                            <div>{record.ExternalUserPhone}</div>
                                        </>
                                    )}
                                </td>
                                <td style={{...tableStyles.td, wordBreak: 'break-word'}}>{record.ObjectName}</td>
                                <td style={{...tableStyles.td, wordBreak: 'break-word'}}>{record.WorkTypes}</td>
                                <td style={{...tableStyles.td, wordBreak: 'break-word'}}>{record.AccessType}</td>
                                <td style={{...tableStyles.td, wordBreak: 'break-word'}}>
                                    {new Date(record.AccessStartDate).toLocaleString()}<br/>
                                    {record.AccessEndDate ? new Date(record.AccessEndDate).toLocaleString() : 'не указано'}
                                </td>
                                <td style={{...tableStyles.td, wordBreak: 'break-word'}}>
                                    {record.ActualConnectionDate ? new Date(record.ActualConnectionDate).toLocaleString() : 'не подключено'}<br/>
                                    {record.ActualDisconnectionDate ? new Date(record.ActualDisconnectionDate).toLocaleString() : 'не отключено'}
                                </td>
                                <td style={{...tableStyles.td, wordBreak: 'break-word'}}>{record.Curator}</td>
                                <td style={{...tableStyles.td, wordBreak: 'break-word'}}>{record.Executor}</td>
                                <td style={{...tableStyles.td, wordBreak: 'break-word'}}>{record.Notes}</td>
                                {user.role === 'admin' && (
                                    <td>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="me-2 mb-2"
                                            onClick={() => navigate(`/records/edit/${record.RecordId}`)}
                                            title="Редактировать"
                                        >
                                            <i className="bi bi-pencil"></i>
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(record.RecordId)}
                                            title="Удалить"
                                        >
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={user.role === 'admin' ? 12 : 11} className="text-center">
                                Нет записей, соответствующих выбранным фильтрам
                            </td>
                        </tr>
                    )}
                    </tbody>
                </Table>
            </div>

                    {/* Пагинация */}
                    {processedRecords.length > recordsPerPage && (
                        <div className="d-flex justify-content-center mt-3">
                            <Pagination>
                                <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                                <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNumber;
                                    if (totalPages <= 5) {
                                        pageNumber = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNumber = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNumber = totalPages - 4 + i;
                                    } else {
                                        pageNumber = currentPage - 2 + i;
                                    }
                                    return (
                                        <Pagination.Item
                                            key={pageNumber}
                                            active={pageNumber === currentPage}
                                            onClick={() => paginate(pageNumber)}
                                        >
                                            {pageNumber}
                                        </Pagination.Item>
                                    );
                                })}
                                <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                                <Pagination.Last onClick={() => paginate(totalPages)} disabled={currentPage === totalPages} />
                            </Pagination>
                        </div>
                    )}
        </Container>
    );
};

export default RecordList;