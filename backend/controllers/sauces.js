const Sauce = require('../models/Sauce');
// import du package file system pour suppression d'une sauce
const fs = require('fs');

// controlleur GET (affiche TOUTES les sauces) // ajouter req.protocol pour balayer les URL avant d'envoyer au front
exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

// controlleur GET (pour afficher une sauce)
exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }))
};

// controlleur route POST (création de sauce)
exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    delete sauceObject._userId;
    const sauce = new Sauce({
        ...sauceObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    });

    sauce.save()
        .then(() => { res.status(201).json({ message: 'Sauce enregistrée !' }) })
        .catch(error => { res.status(400).json({ error }) })
};

// controlleur route PUT => modifie une sauce
exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file
        ? {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
        }
        : { ...req.body };
    if (req.file) {
        Sauce.findOne({ _id: req.params.id })
            .then((sauce) => {
                const filename = sauce.imageUrl.split("images/")[1];
                // suppression de l'image de la sauce qui sera remplacée
                fs.unlink(`images/${filename}`, (error) => {
                    if (error) console.log(error);
                });
            })
            .catch((error) => res.status(500).json({ error }));
    }
    Sauce.updateOne(
        { _id: req.params.id },
        { ...sauceObject, _id: req.params.id }
    )
        .then(() => res.status(200).json({ message: "Objet modifié !" }))
        .catch((error) => res.status(400).json({ error }));
};

// controlleur route DELETE => Supprime une sauce
exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {
                const filename = sauce.imageUrl.split('/images/')[1];
                // suppr du fichier avec fonction unlink du package file system (fs)
                fs.unlink(`images/${filename}`, () => {
                    Sauce.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: 'Objet supprimé !' }) })
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch(error => {
            res.status(500).json({ error });
        });
};

// controlleur like/dilike route POST
// bouton like
exports.rateSauce = (req, res, next) => {
    const clientId = req.body.userId;
    const chosenSauce = req.params.id;
    const like = req.body.like;

    if (like === 1) {
        // utilisation des opérateurs MongoDB : $pull(supprime), $inc(incrémente), $push(ajoute les données) pour modifier les tableau dans MOngoDB
        Sauce.updateOne({ _id: chosenSauce }, { $inc: { likes: 1 }, $push: { usersLiked: clientId }, _id: chosenSauce })
            .then(() => res.status(200).json({ message: 'sauce likée' }))
            .catch(error => res.status(400).json({ error }))
        // bouton dislike
    } else if (like === -1) {
        Sauce.updateOne({ _id: chosenSauce }, { $inc: { dislikes: 1 }, $push: { usersDisliked: clientId }, _id: chosenSauce })
            .then(() => res.status(200).json({ message: 'sauce unliked' }))
            .catch(error => res.status(400).json({ error }))

        // possibilité d'annuler un des choix de l'utilisateur
    } else {
        Sauce.findOne({ _id: chosenSauce })
            .then(sauce => {
                if (sauce.usersLiked.indexOf(clientId) !== -1) {
                    Sauce.updateOne({ _id: chosenSauce }, { $inc: { likes: -1 }, $pull: { usersLiked: clientId }, _id: chosenSauce })
                        .then(() => res.status(200).json({ message: 'sauce modifiée, suppression du like' }))
                        .catch(error => res.status(400).json({ error }))
                }

                else if (sauce.usersDisliked.indexOf(clientId) !== -1) {
                    Sauce.updateOne({ _id: chosenSauce }, { $inc: { dislikes: -1 }, $pull: { usersDisliked: clientId }, _id: chosenSauce })
                        .then(() => res.status(200).json({ message: 'sauce modifiée, suppression du unlike' }))
                        .catch(error => res.status(400).json({ error }))
                }
            })
            .catch(error => res.status(400).json({ error }))
    }
};