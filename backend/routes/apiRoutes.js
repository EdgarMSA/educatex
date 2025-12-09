const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

// --- IMPORTACIONES DE CONTROLADORES ---
const authController = require('../controllers/authController');
const courseController = require('../controllers/courseController'); 
const enrollmentController = require('../controllers/enrollmentController');
const userController = require('../controllers/userController');

// --- AUTENTICACIÓN ---
router.get('/auth/captcha', authController.getCaptcha);
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// --- PERFIL DE USUARIO ---
router.get('/profile', protect, userController.getProfile);
router.put('/profile/password', protect, userController.changePassword);

// --- CURSOS ---
router.get('/courses', courseController.getAllCourses); // Ver lista de cursos
router.get('/courses/:id', protect, courseController.getCourseDetails); // Ver detalles
router.post('/courses', protect, admin, courseController.createCourse); // Crear curso (Solo Admin)
router.put('/progress/video/:videoId', protect, courseController.markVideoCompleted); // Marcar video visto

// --- MATRÍCULAS Y PAGOS ---
router.post('/enrollments/buy', protect, enrollmentController.initEnrollment);
router.put('/enrollments/approve/:enrollmentId', protect, admin, enrollmentController.approvePayment);

router.post('/courses/:id/modules', protect, admin, courseController.addModule);
router.post('/modules/:moduleId/videos', protect, admin, courseController.addVideo);

// --- Rutas de Matrícula ---
router.get('/enrollments/pending', protect, admin, enrollmentController.getPendingEnrollments); 
router.post('/enrollments/buy', protect, enrollmentController.initEnrollment);
router.put('/enrollments/approve/:enrollmentId', protect, admin, enrollmentController.approvePayment);

// --- PERFIL Y CURSOS MATRICULADOS ---
router.get('/profile', protect, userController.getProfile);
router.put('/profile/password', protect, userController.changePassword);
router.get('/profile/courses', protect, userController.getEnrolledCourses); 

// --- GESTIÓN DE VIDEOS (EDICIÓN Y ELIMINACIÓN) ---
router.put('/videos/:videoId', protect, admin, courseController.updateVideo);
router.delete('/videos/:videoId', protect, admin, courseController.deleteVideo);

// --- NUEVAS RUTAS DE GESTIÓN DE CURSOS ---
router.put('/courses/:id', protect, admin, courseController.updateCourse);
router.delete('/courses/:id', protect, admin, courseController.deleteCourse);

module.exports = router;