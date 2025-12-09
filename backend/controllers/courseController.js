const pool = require('../config/db');

exports.getAllCourses = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM courses WHERE is_approved = TRUE ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCourseDetails = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // 1. Obtener info básica del curso
        const courseRes = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
        if (courseRes.rows.length === 0) return res.status(404).json({ message: 'Curso no encontrado' });
        
        // 2. Verificar matrícula
        const enrollRes = await pool.query('SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2', [userId, id]);
        const isEnrolled = enrollRes.rows.length > 0 && (enrollRes.rows[0].status === 'enrolled' || enrollRes.rows[0].status === 'completed');

        // 3. Obtener módulos y videos (solo si está matriculado o es admin, si no, devolver solo info básica)
        let modules = [];
        if (isEnrolled || req.user.role === 'admin') {
            const modulesRes = await pool.query(`
                SELECT m.id as module_id, m.title as module_title, 
                       v.id as video_id, v.title as video_title, v.video_url, 
                       vp.is_completed
                FROM modules m
                LEFT JOIN videos v ON m.id = v.module_id
                LEFT JOIN video_progress vp ON v.id = vp.video_id AND vp.user_id = $1
                WHERE m.course_id = $2
                ORDER BY m.module_order, v.video_order
            `, [userId, id]);
            
            // Agrupar videos en módulos
            const modulesMap = {};
            modulesRes.rows.forEach(row => {
                if (!modulesMap[row.module_id]) {
                    modulesMap[row.module_id] = { id: row.module_id, title: row.module_title, videos: [] };
                }
                if (row.video_id) {
                    modulesMap[row.module_id].videos.push({
                        id: row.video_id, title: row.video_title, url: row.video_url, is_completed: row.is_completed
                    });
                }
            });
            modules = Object.values(modulesMap);
        }

        res.json({ course: courseRes.rows[0], isEnrolled, modules });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// @desc Marcar video como completado y revisar si el curso finalizó
// @route PUT /api/progress/video/:videoId
exports.markVideoCompleted = async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user.id;

    try {
        // 1. Marcar el video actual como completado (ON CONFLICT DO NOTHING para evitar duplicados)
        await pool.query(
            'INSERT INTO video_progress (user_id, video_id, is_completed) VALUES ($1, $2, TRUE) ON CONFLICT (user_id, video_id) DO NOTHING',
            [userId, videoId]
        );

        // --- LÓGICA PARA VERIFICAR FINALIZACIÓN DEL CURSO Y OTORGAR PUNTOS ---

        // 2. Obtener IDs y datos del curso (module_id -> course_id)
        const courseDataResult = await pool.query(`
            SELECT c.id AS course_id, c.points_reward
            FROM videos v
            JOIN modules m ON v.module_id = m.id
            JOIN courses c ON m.course_id = c.id
            WHERE v.id = $1
        `, [videoId]);

        if (courseDataResult.rows.length === 0) {
            return res.status(404).json({ message: 'Video o curso no encontrado.' });
        }

        const { course_id, points_reward } = courseDataResult.rows[0];

        // 3. Contar el progreso del usuario en este curso (videos totales vs completados)
        const progressResult = await pool.query(`
            SELECT 
                COUNT(v.id) AS total_videos,
                COUNT(vp.id) FILTER (WHERE vp.is_completed = TRUE) AS completed_videos
            FROM videos v
            JOIN modules m ON v.module_id = m.id
            LEFT JOIN video_progress vp ON v.id = vp.video_id AND vp.user_id = $1
            WHERE m.course_id = $2
        `, [userId, course_id]);

        const { total_videos, completed_videos } = progressResult.rows[0];
        
        // 4. Si el progreso es 100% o más (por si acaso): Otorgar puntos y finalizar
        if (parseInt(completed_videos) >= parseInt(total_videos)) {
            
            // a) Actualizar estado de la matrícula a 'completed'
            // Solo actualiza si no estaba ya completado antes (para no dar puntos dos veces)
            await pool.query(
                "UPDATE enrollments SET status = 'completed', completed_at = NOW() WHERE user_id = $1 AND course_id = $2 AND status != 'completed'",
                [userId, course_id]
            );

            // b) Otorgar puntos al usuario
            await pool.query(
                'UPDATE users SET points = points + $1 WHERE id = $2',
                [points_reward, userId]
            );

            return res.status(200).json({ 
                message: 'Curso finalizado y puntos otorgados.',
                reward: points_reward,
                completed: true
            });
        }

        // 5. Retornar éxito normal (solo video marcado)
        res.status(200).json({ message: 'Video marcado como visto.', completed: false });

    } catch (error) {
        console.error("Error al marcar progreso:", error);
        res.status(500).json({ error: 'Error interno al actualizar el progreso.' });
    }
};

exports.createCourse = async (req, res) => {
    // 1. Aceptar la nueva propiedad image_url
    //const { title, description, price, points_cost, is_paid, image_url } = req.body; 
    const { title, description, price, points_cost, is_paid, image_url, points_reward } = req.body;
    
    try {
        // 2. Insertar image_url en la BD
        const newCourse = await pool.query(
            `INSERT INTO courses (title, description, price, points_cost, is_paid, image_url, points_reward, is_approved) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE) RETURNING *`,
            [
                title, 
                description, 
                is_paid ? price : 0, 
                points_cost, 
                is_paid, 
                image_url, 
                points_reward || 10 // Si no envías nada, pone 10 por defecto
            ]
        );

        // Opcional: Crear un módulo por defecto...
        await pool.query('INSERT INTO modules (course_id, title, module_order) VALUES ($1, $2, 1)', [newCourse.rows[0].id, 'Módulo 1: Introducción']);

        res.status(201).json(newCourse.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear el curso' });
    }
};

// @desc Agregar un Módulo a un Curso
// @route POST /api/courses/:id/modules
exports.addModule = async (req, res) => {
    const { id } = req.params; // ID del curso
    const { title, order } = req.body;

    try {
        const newModule = await pool.query(
            'INSERT INTO modules (course_id, title, module_order) VALUES ($1, $2, $3) RETURNING *',
            [id, title, order || 1]
        );
        res.status(201).json(newModule.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear módulo' });
    }
};

// @desc Agregar un Video a un Módulo
// @route POST /api/modules/:moduleId/videos
exports.addVideo = async (req, res) => {
    const { moduleId } = req.params;
    const { title, video_url, order } = req.body;

    try {
        const newVideo = await pool.query(
            'INSERT INTO videos (module_id, title, video_url, video_order) VALUES ($1, $2, $3, $4) RETURNING *',
            [moduleId, title, video_url, order || 1]
        );
        res.status(201).json(newVideo.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al agregar video' });
    }
};

// @desc Actualizar detalles del video (SOLO ADMIN)
// @route PUT /api/videos/:videoId
exports.updateVideo = async (req, res) => {
    const { videoId } = req.params;
    const { title, video_url } = req.body;

    // --- LOGS DE DEPURACIÓN EN TERMINAL ---
    console.log(`[UPDATE] Video ID: ${videoId}, New URL Length: ${video_url ? video_url.length : 'N/A'}`);
    
    // VERIFICACIÓN CLAVE: El límite VARCHAR es 255.
    if (video_url && video_url.length > 255) {
        console.error("ERROR: URL excede el límite de 255 caracteres.");
        return res.status(400).json({ message: 'La URL excede el límite de 255 caracteres.' });
    }

    try {
        const result = await pool.query(
            'UPDATE videos SET title = $1, video_url = $2 WHERE id = $3 RETURNING *',
            [title, video_url, videoId]
        );
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Video no encontrado' });
        }
        res.json({ message: 'Video actualizado exitosamente', video: result.rows[0] });
    } catch (err) {
        // --- LOG DEL ERROR REAL DE LA BASE DE DATOS ---
        console.error("[DB ERROR] Fallo al actualizar video:", err.message); 
        res.status(500).json({ error: 'Error interno del servidor al actualizar video.' });
    }
};

// @desc Eliminar un video (SOLO ADMIN)
// @route DELETE /api/videos/:videoId
exports.deleteVideo = async (req, res) => {
    const { videoId } = req.params;
    try {
        const result = await pool.query('DELETE FROM videos WHERE id = $1 RETURNING id', [videoId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Video no encontrado' });
        }
        // PostgreSQL debería manejar la eliminación de progresos asociados vía ON DELETE CASCADE
        res.json({ message: 'Video eliminado exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar el video' });
    }
};

// @desc Actualizar datos del curso (Título, descripción, precio...)
// @route PUT /api/courses/:id
exports.updateCourse = async (req, res) => {
    const { id } = req.params;
    const { title, description, price, points_cost, is_paid, image_url, points_reward } = req.body;
    
    console.log(`[UPDATE COURSE] ID: ${id} - Title: ${title}`); // LOG DE DEPURACIÓN

    try {
        const result = await pool.query(
            `UPDATE courses 
             SET title = $1, 
                 description = $2, 
                 price = $3, 
                 points_cost = $4, 
                 is_paid = $5, 
                 image_url = $6, 
                 points_reward = $7
             WHERE id = $8 
             RETURNING *`,
            [
                title, 
                description, 
                is_paid ? parseFloat(price) : 0, 
                parseInt(points_cost), 
                is_paid, 
                image_url, 
                parseInt(points_reward) || 10, 
                id
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Curso no encontrado' });
        }
        
        res.json({ message: 'Curso actualizado correctamente', course: result.rows[0] });

    } catch (err) {
        console.error("❌ ERROR SQL UPDATE COURSE:", err.message); // Ver esto en terminal negra
        res.status(500).json({ error: 'Error interno al actualizar el curso: ' + err.message });
    }
};
// @desc Eliminar curso entero (CUIDADO: Borra módulos y videos por cascada si está configurado)
// @route DELETE /api/courses/:id
exports.deleteCourse = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM courses WHERE id = $1', [id]);
        res.json({ message: 'Curso eliminado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar curso (puede tener alumnos matriculados)' });
    }
};