// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes'); 

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: 'http://localhost:5173' })); // Permitir acceso desde el frontend de React
app.use(express.json()); 

// Rutas de la API
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('API de EDUCATEX funcionando...');
});

app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));