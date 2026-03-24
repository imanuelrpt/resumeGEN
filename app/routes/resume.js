const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/auth/login');
};

router.get('/create', isAuthenticated, resumeController.getCreate);
router.post('/create', isAuthenticated, resumeController.postCreate);
router.get('/edit/:id', isAuthenticated, resumeController.getEdit);
router.post('/edit/:id', isAuthenticated, resumeController.postEdit);
router.delete('/delete/:id', isAuthenticated, resumeController.deleteResume);
router.get('/download/:id', isAuthenticated, resumeController.downloadResume);

module.exports = router;
