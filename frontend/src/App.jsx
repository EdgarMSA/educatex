// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CourseList from './pages/CourseList';
import CourseDetails from './pages/CourseDetails';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import MisCursos from './pages/MisCursos';

function App() {
  // Nota: Envuelve tus rutas con un Provider de Autenticación (Context)
  return (
    <Router>
      {/* Aplicar la clase 'dark' para que Tailwind use el tema oscuro */}
      <div className="dark min-h-screen"> 
        <Navbar />
        <main className="container mx-auto max-w-6xl p-4 pt-24"> {/* Padding para evitar el navbar */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/courses/:id" element={<CourseDetails />} />
            <Route path="/mis-cursos" element={<MisCursos />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* Rutas de Admin (ej. Aprobación de pagos) irían aquí */}
            <Route path="*" element={<h1>404 | Página no encontrada</h1>} />
          </Routes>
        </main>
        <Toaster position="top-right" reverseOrder={false} />
      </div>
    </Router>
  )
}

export default App;