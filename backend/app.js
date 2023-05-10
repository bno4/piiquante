const express = require('express');
const path = require('path');
require('dotenv').config();

const saucesRoutes = require('./routes/sauces');
const userRoutes = require('./routes/user');
const helmet = require('helmet');
const app = express();



// appel de la base de données MongoDB depuis models
require('./models/Database');

app.use(express.json());
// Helmet contre les attaques Cross-Site Scripting / XSS / Click Jacking
app.use(helmet());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    next();
});

// Appel des routes authorisation et sauces
app.use('/api/auth', userRoutes);
app.use('/api/sauces', saucesRoutes);

// Chemin statique pour les images
app.use('/images', express.static(path.join(__dirname, 'images')));


module.exports = app;