import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return <Navigate to="/" replace />;
    if (allowedRole && user.role !== allowedRole) return <Navigate to="/" replace />;
    return children;
};

export default ProtectedRoute;