-- Archivo: create_educatex_schema.sql
-- Este script debe ejecutarse en tu base de datos PostgreSQL.

-- Tabla: Usuarios (Users)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, 
    role VARCHAR(20) DEFAULT 'student' NOT NULL, -- 'student' o 'admin'
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Cursos (Courses)
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_paid BOOLEAN DEFAULT FALSE,
    price NUMERIC(10, 2) DEFAULT 0.00,
    points_cost INTEGER DEFAULT 0, 
    points_reward INTEGER NOT NULL, 
    is_approved BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    image_url VARCHAR(255)
);

-- Tabla: Módulos (Modules)
CREATE TABLE modules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    module_order INTEGER NOT NULL 
);

-- Tabla: Videos (Videos/Lessons)
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    video_url VARCHAR(255) NOT NULL,
    video_order INTEGER NOT NULL 
);

-- Tabla: Matrículas (Enrollments)
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending', 'paid', 'enrolled', 'completed'
    payment_method VARCHAR(50), 
    proof_url VARCHAR(255), 
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, course_id)
);

-- Tabla: Progreso de Videos (VideoProgress)
CREATE TABLE video_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, video_id)
);

INSERT INTO users (username, email, password_hash, role, points) 
VALUES (
    'SuperAdmin', 
    'admin@educatex.com', 
    '$2b$10$McHORnt6NflwdMLznHwZX.f.NnN1ExLnXopQ0uT.B5hb.8k2Hdx8S', -- la clase es 123456
    'admin', 
    123
);

UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@educatex.com';