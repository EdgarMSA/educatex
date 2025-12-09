const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const svgCaptcha = require('svg-captcha');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// backend/controllers/authController.js

exports.getCaptcha = (req, res) => {
    // Usamos createMathExpr en lugar de create
    const captcha = svgCaptcha.createMathExpr({
        size: 4, // Tamaño de la expresión
        noise: 1, // Menos ruido para que sea más limpio
        color: true, // Texto de colores
        background: '#1e293b', // Color de fondo (el mismo de tu tarjeta oscura)
        mathMin: 1,
        mathMax: 9,
        mathOperator: '+' // Solo sumas
    });

    const captchaToken = jwt.sign(
        { answer: captcha.text }, 
        process.env.JWT_SECRET, 
        { expiresIn: '5m' } 
    );

    res.status(200).json({
        svg: captcha.data,
        token: captchaToken
    });
};

// @desc Registrar nuevo usuario (MODIFICADO CON CAPTCHA)
exports.register = async (req, res) => {
    // 1. Recibimos también los datos del captcha
    const { username, email, password, captchaAnswer, captchaToken } = req.body;

    try {
        // --- VALIDACIÓN DEL CAPTCHA ---
        if (!captchaAnswer || !captchaToken) {
            return res.status(400).json({ message: 'Por favor resuelve el captcha.' });
        }

        try {
            // Desencriptamos el token para ver cuál era la respuesta correcta
            const decoded = jwt.verify(captchaToken, process.env.JWT_SECRET);
            
            // Comparamos (ignorando mayúsculas/minúsculas)
            if (decoded.answer.toLowerCase() !== captchaAnswer.toLowerCase()) {
                return res.status(400).json({ message: 'Captcha incorrecto. Intenta de nuevo.' });
            }
        } catch (err) {
            return res.status(400).json({ message: 'El captcha ha expirado o es inválido.' });
        }
        // -----------------------------

        // 2. (El resto de tu código de registro sigue igual...)
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, role, points',
            [username, email, hashedPassword]
        );

        const token = jwt.sign({ id: newUser.rows[0].id, role: newUser.rows[0].role }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.status(201).json({
            token,
            user: newUser.rows[0]
        });

    } catch (err) {
        console.error(err); // Es bueno ver el error en consola
        res.status(500).json({ error: 'Error en el servidor' });
    }
};
/*exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) return res.status(400).json({ message: 'El correo ya existe.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, points, role',
            [username, email, hashedPassword]
        );

        res.status(201).json({
            ...newUser.rows[0],
            token: generateToken(newUser.rows[0].id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};*/

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if (user && (await bcrypt.compare(password, user.password_hash))) {
            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                points: user.points,
                role: user.role,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};