const express = require('express');
const app = express();

app.use((req, res, next) => {
    console.log('Req reçue');
    next();
});

app.use((req, res, next) => {
    res.status(201);
    next();
});


app.use((req, res, next) => {
    res.json({ message: 'votre requête a bien été reçue' });
    next();
});

app.use((req, res) => {
    console.log('rép envoyée avec succès');
});
module.exports = app;