import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from './components/layout/Header';
import Login from './components/auth/Login';
import ChangePassword from './components/auth/ChangePassword';
import UserList from './components/users/UserList';
import CreateUser from './components/users/CreateUser';
import PrivateRoute from './components/layout/PrivateRoute';
import AdminRoute from './components/layout/AdminRoute';
import { AuthProvider } from './context/authContext';
import Home from './components/Home';
import EditUser from './components/users/EditUser';
import UpdateUserPage from './components/users/UpdateUserPage';
import RecordList from './components/records/RecordList';
import CreateRecord from './components/records/CreateRecord';
import EditRecord from './components/records/EditRecord';
import OrganizationList from './components/organizations/OrganizationList';
import ExternalConnectionListPage from './components/externalConnections/ExternalConnectionListPage';
import AddExternalConnectionPage from './components/externalConnections/AddExternalConnectionPage';
import EditExternalConnectionPage from './components/externalConnections/EditExternalConnectionPage';
import PositionList from './components/positions';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Header />
                <main className="container mt-4">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/change-password" element={<ChangePassword />} />
                        <Route
                            path="/users"
                            element={
                                <AdminRoute>
                                    <UserList />
                                </AdminRoute>
                            }
                        />
                        <Route
                            path="/users/create"
                            element={
                                <AdminRoute>
                                    <CreateUser />
                                </AdminRoute>
                            }
                        />
                        <Route
                            path="/users/edit/:id"
                            element={
                                <AdminRoute>
                                    <EditUser />
                                </AdminRoute>
                            }
                        />
                        <Route
                            path="/users/update/:id"
                            element={
                                <AdminRoute>
                                    <UpdateUserPage />
                                </AdminRoute>
                            }
                        />
                        <Route
                            path="/"
                            element={
                                <PrivateRoute>
                                    <Home />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/records"
                            element={
                                <PrivateRoute>
                                    <RecordList />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/records/create"
                            element={
                                <PrivateRoute>
                                    <CreateRecord />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/records/edit/:id"
                            element={
                                <AdminRoute>
                                    <EditRecord />
                                </AdminRoute>
                            }
                        />
                        <Route
                            path="/organizations"
                            element={
                                <AdminRoute>
                                    <OrganizationList />
                                </AdminRoute>
                            }
                        />
                        <Route
                            path="/external-connections"
                            element={
                                <AdminRoute>
                                    <ExternalConnectionListPage />
                                </AdminRoute>
                            }
                        />
                        <Route
                            path="/external-connections/add"
                            element={
                                <AdminRoute>
                                    <AddExternalConnectionPage />
                                </AdminRoute>
                            }
                        />
                        <Route
                            path="/external-connections/edit/:id"
                            element={
                                <AdminRoute>
                                    <EditExternalConnectionPage />
                                </AdminRoute>
                            }
                        />
                        <Route
                            path="/positions"
                            element={
                                <AdminRoute>
                                    <PositionList />
                                </AdminRoute>
                            }
                        />
                    </Routes>
                </main>
            </AuthProvider>
        </Router>
    );
}

export default App;