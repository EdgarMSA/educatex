const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
    // req.user ya viene del middleware
    res.json(req.user);
};

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        const user = (await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId])).rows[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        
        if (!isMatch) return res.status(400).json({ message: 'La contraseña actual es incorrecta' });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
        res.json({ message: 'Contraseña actualizada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc Obtener cursos en los que el usuario está matriculado
// @route GET /api/profile/courses
exports.getEnrolledCourses = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(`
            SELECT c.*, e.status as enrollment_status, e.completed_at
            FROM courses c
            JOIN enrollments e ON c.id = e.course_id
            WHERE e.user_id = $1 AND e.status IN ('enrolled', 'completed')
            ORDER BY e.created_at DESC
        `, [userId]);
        
        res.json(result.rows);
    } catch (err) {
        console.error("Error al obtener cursos matriculados:", err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};