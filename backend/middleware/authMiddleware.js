// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); 

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET); 

            const userResult = await pool.query('SELECT id, username, email, role, points FROM users WHERE id = $1', [decoded.id]);
            
            if (userResult.rows.length === 0) {
                return res.status(401).json({ message: 'Usuario no encontrado' });
            }
            
            req.user = userResult.rows[0];
            next();

        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Token no válido, no autorizado' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'No hay token, no autorizado' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado, requiere rol de Administrador' });
    }
};

module.exports = { protect, admin };