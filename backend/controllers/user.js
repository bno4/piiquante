// cryptage du mot de passe utilisateur (protection base de données, cf. RGPD)
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// cryptage du mail utilisateur (protection base de données, cf. RGPD)
const cryptoJs = require('crypto-js');
const User = require('../models/User');

// fonction d'inscription et cryptage du mot de passe et email)
exports.signup = (req, res, next) => {
    const emailCryptoJs = cryptoJs.HmacSHA256(req.body.email, process.env.EMAIL_KEY).toString();
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: emailCryptoJs,
                password: hash
            });
            user.save()
                .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};

// fonction de connexion et cryptage du mot de passe et email)
exports.login = (req, res, next) => {
    const emailCryptoJs = cryptoJs.HmacSHA256(req.body.email, process.env.EMAIL_KEY).toString();
    User.findOne({ email: emailCryptoJs })
        .then(user => {
            if (!user) {
                return res.status(401).json({ error: 'Utilisateur non trouvé !' });
            }
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({ error: 'Mot de passe incorrect !' });
                    }
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            process.env.TOKEN_KEY,
                            { expiresIn: '24h' }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};