const pool = require('../config/db');

exports.initEnrollment = async (req, res) => {
    const { courseId, paymentMethod, paymentProofUrl } = req.body;
    const userId = req.user.id;

    try {
        const course = (await pool.query('SELECT * FROM courses WHERE id = $1', [courseId])).rows[0];
        if (!course) return res.status(404).json({ message: 'Curso no existe' });

        let status = 'pending';

        // Lógica: Pago con PUNTOS
        if (paymentMethod === 'points') {
            if (req.user.points < course.points_cost) {
                return res.status(400).json({ message: 'Puntos insuficientes' });
            }
            await pool.query('UPDATE users SET points = points - $1 WHERE id = $2', [course.points_cost, userId]);
            status = 'enrolled';
        } 
        // Lógica: Pago Monetario Simulado
        else if (['yape', 'plin', 'card'].includes(paymentMethod)) {
            // Si es pago real, requiere aprobación del admin
            status = 'pending';
        }

        await pool.query(
            'INSERT INTO enrollments (user_id, course_id, status, payment_method, proof_url) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id, course_id) DO NOTHING',
            [userId, courseId, status, paymentMethod, paymentProofUrl]
        );

        res.json({ message: status === 'enrolled' ? 'Matriculado' : 'Pendiente de aprobación' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.approvePayment = async (req, res) => {
    const { enrollmentId } = req.params; // Solo el admin puede llamar a esto
    try {
        await pool.query("UPDATE enrollments SET status = 'enrolled' WHERE id = $1", [enrollmentId]);
        res.json({ message: 'Matrícula aprobada exitosamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc Obtener matrículas pendientes
exports.getPendingEnrollments = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT e.id, e.payment_method, e.proof_url, e.created_at, e.status,
                   u.username, u.email,
                   c.title as course_title, c.price
            FROM enrollments e
            JOIN users u ON e.user_id = u.id
            JOIN courses c ON e.course_id = c.id
            WHERE e.status = 'pending'
            ORDER BY e.created_at ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error al obtener pendientes:", err);
        res.status(500).json({ error: 'Error al obtener pagos pendientes' });
    }
};

// @desc Iniciar matrícula (CON LOGS DE DEPURACIÓN)
exports.initEnrollment = async (req, res) => {
    console.log("--- 1. INICIO DE PETICIÓN DE MATRÍCULA ---");
    console.log("Body recibido:", req.body);
    console.log("Usuario autenticado:", req.user);

    const { courseId, paymentMethod, paymentProofUrl } = req.body;
    
    // VALIDACIÓN 1: ¿Tenemos usuario?
    if (!req.user || !req.user.id) {
        console.error("ERROR: No hay ID de usuario en la petición.");
        return res.status(401).json({ message: 'Usuario no identificado.' });
    }
    const userId = req.user.id;

    // VALIDACIÓN 2: ¿Tenemos datos del curso?
    if (!courseId) {
        console.error("ERROR: courseId no enviado.");
        return res.status(400).json({ message: 'El ID del curso es obligatorio.' });
    }

    try {
        console.log(`--- 2. Buscando curso ID: ${courseId} ---`);
        const courseRes = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
        
        if (courseRes.rows.length === 0) {
            console.error("ERROR: Curso no encontrado en DB.");
            return res.status(404).json({ message: 'Curso no encontrado' });
        }
        const course = courseRes.rows[0];
        console.log("Curso encontrado:", course.title);

        console.log("--- 3. Verificando duplicados ---");
        const existingEnrollment = await pool.query(
            'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2', 
            [userId, courseId]
        );

        if (existingEnrollment.rows.length > 0) {
            console.warn("ADVERTENCIA: Ya existe matrícula.");
            const status = existingEnrollment.rows[0].status;
            return res.status(400).json({ 
                message: status === 'enrolled' ? 'Ya estás matriculado.' : 'Solicitud pendiente en proceso.' 
            });
        }

        console.log("--- 4. Preparando inserción ---");
        let status = 'pending';
        let finalProof = paymentProofUrl || null; // Asegurar que no sea undefined

        // Lógica de Puntos vs Pago
        if (paymentMethod === 'points') {
            if (req.user.points < course.points_cost) {
                return res.status(400).json({ message: 'Puntos insuficientes' });
            }
            console.log("Descontando puntos...");
            await pool.query('UPDATE users SET points = points - $1 WHERE id = $2', [course.points_cost, userId]);
            status = 'enrolled';
        } else if (!course.is_paid) {
            status = 'enrolled';
        }

        console.log(`--- 5. EJECUTANDO INSERT (User: ${userId}, Course: ${courseId}, Status: ${status}) ---`);
        
        // EJECUCIÓN SQL
        const newEnrollment = await pool.query(
            'INSERT INTO enrollments (user_id, course_id, status, payment_method, proof_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, courseId, status, paymentMethod, finalProof]
        );

        console.log("✅ ÉXITO: Matrícula creada ID:", newEnrollment.rows[0].id);

        res.status(201).json({ 
            message: status === 'enrolled' ? 'Matrícula completada.' : 'Solicitud enviada.',
            enrollment: newEnrollment.rows[0]
        });

    } catch (err) {
        // AQUÍ CAPTURAMOS EL ERROR REAL DE SQL
        console.error("❌ ERROR FATAL EN SQL:", err.message); 
        console.error("Detalle:", err);
        res.status(500).json({ 
            message: 'Error interno del servidor', 
            dbError: err.message // Enviamos el error al frontend para verlo
        });
    }
};

// @desc Aprobar pago
exports.approvePayment = async (req, res) => {
    const { enrollmentId } = req.params;
    try {
        await pool.query("UPDATE enrollments SET status = 'enrolled' WHERE id = $1", [enrollmentId]);
        res.json({ message: 'Aprobado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};