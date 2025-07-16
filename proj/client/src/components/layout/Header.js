import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

const Header = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
            <Container>
                <Navbar.Brand as={Link} to="/">Электронный журнал</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {user && (
                            <Nav.Link as={Link} to="/records">Записи</Nav.Link>
                        )}
                        {user && user.role === 'admin' && (
                            <Nav.Link as={Link} to="/users">Пользователи</Nav.Link>
                        )}
                        {user && user.role === 'admin' && (
                            <Nav.Link as={Link} to="/organizations">Организации</Nav.Link>
                        )}
                        {user && user.role === 'admin' && (
                            <Nav.Link as={Link} to="/external-connections">Внешние подключения</Nav.Link>
                        )}
                        {user && user.role === 'admin' && (
                            <Nav.Link as={Link} to="/positions">Должности</Nav.Link>
                        )}
                        {user && user.role === 'admin' && (
                            <Nav.Link as={Link} to="/curators">Кураторы</Nav.Link>
                        )}
                    </Nav>
                    <Nav>
                        {user ? (
                            <>
                                <Navbar.Text className="me-3">
                                    Добро пожаловать, {user.username} ({user.role})
                                </Navbar.Text>
                                <Button variant="outline-light" onClick={handleLogout}>
                                    Выйти
                                </Button>
                            </>
                        ) : (
                            <Nav.Link as={Link} to="/login">Login</Nav.Link>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Header;