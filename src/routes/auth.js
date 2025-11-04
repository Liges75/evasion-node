const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


router.get('/register', authController.registerPage);
router.post('/register', authController.registerUser);

router.get('/login', authController.loginPage);
router.post('/login', authController.loginUser);

router.get('/forgot-password', authController.forgotPasswordPage);
router.post('/forgot-password', authController.forgotPasswordSend);

router.get('/reset-password', authController.resetPasswordPage);
router.post('/reset-password', authController.resetPasswordSubmit);

router.get('/logout', authController.logout);

module.exports = router;
