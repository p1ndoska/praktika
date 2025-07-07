import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';

const UserInfo = ({ user }) => {
    if (!user) {
        return null;
    }

    const getRoleBadge = (role) => {
        return role === 'admin' ? (
            <Badge bg="danger">Администратор</Badge>
        ) : (
            <Badge bg="primary">Пользователь</Badge>
        );
    };

    const getPositionBadge = (position) => {
        return position === 'начальник отдела' ? (
            <Badge bg="warning" text="dark">Начальник отдела</Badge>
        ) : (
            <Badge bg="info">Работник</Badge>
        );
    };

    return (
        <Card className="mb-4">
            <Card.Header>
                <h5 className="mb-0">Информация о пользователе</h5>
            </Card.Header>
            <Card.Body>
                <Row>
                    <Col md={6}>
                        <div className="mb-3">
                            <strong>ID:</strong> {user.Id}
                        </div>
                        <div className="mb-3">
                            <strong>Имя пользователя:</strong> {user.Username}
                        </div>
                        <div className="mb-3">
                            <strong>Email:</strong> {user.Email}
                        </div>
                    </Col>
                    <Col md={6}>
                        <div className="mb-3">
                            <strong>Роль:</strong> {getRoleBadge(user.Role)}
                        </div>
                        <div className="mb-3">
                            <strong>Должность:</strong> {getPositionBadge(user.Position)}
                        </div>
                        <div className="mb-3">
                            <strong>Телефон:</strong> {user.Phone || 'Не указан'}
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default UserInfo;