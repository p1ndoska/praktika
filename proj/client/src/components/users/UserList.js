import React, { useState, useEffect } from 'react';
import { Table, Container, Alert, Spinner, Button } from 'react-bootstrap';
import userService from '../../services/userService';
import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';
import EditUser from './EditUser';
import Pagination from '../Pagination';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuth();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 15;
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const [search, setSearch] = useState("");
    const filteredUsers = users.filter(user =>
        user.Username.toLowerCase().includes(search.toLowerCase()) ||
        user.Email.toLowerCase().includes(search.toLowerCase()) ||
        user.Role.toLowerCase().includes(search.toLowerCase()) ||
        (user.Position && user.Position.toLowerCase().includes(search.toLowerCase())) ||
        (user.Phone && user.Phone.toLowerCase().includes(search.toLowerCase()))
    );
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await userService.getUsers(token);
                setUsers(data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch users');
                setLoading(false);
            }
        };

        fetchUsers();
    }, [token]);

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <h2 className="mb-4">Управление пользователями</h2>
            <div className="mb-3 text-end">
                <Button variant="success" onClick={() => navigate('/users/create')}>
                    Добавить пользователя
                </Button>
            </div>
            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Поиск по имени, email или роли..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                />
            </div>
            <Table striped bordered hover responsive>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Имя пользователя</th>
                    <th>Email</th>
                    <th>Роль</th>
                    <th>Должность</th>
                    <th>Телефон</th>
                    <th>Действия</th>
                </tr>
                </thead>
                <tbody>
                {currentUsers.map(user => (
                    <tr key={user.Id}>
                        <td>{user.Id}</td>
                        <td>{user.Username}</td>
                        <td>{user.Email}</td>
                        <td>{user.Role}</td>
                        <td>{user.Position || ''}</td>
                        <td>{user.Phone || ''}</td>
                        <td>
                            <>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => navigate(`/users/edit/${user.Id}`)}
                                >
                                    Редактировать
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={async () => {
                                        if (window.confirm('Вы уверены, что хотите удалить пользователя?')) {
                                            try {
                                                await userService.deleteUser(user.Id, token);
                                                setUsers(users.filter(u => u.Id !== user.Id));
                                            } catch (err) {
                                                setError(err.response?.data?.message || 'Ошибка удаления пользователя');
                                            }
                                        }
                                    }}
                                >
                                    Удалить
                                </Button>
                            </>
                        </td>
                    </tr>
                ))}
                </tbody>
            </Table>
            {totalPages > 1 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={paginate} />
            )}
        </Container>
    );
};

export default UserList;