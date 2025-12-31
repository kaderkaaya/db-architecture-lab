const express = require('express');
const router = express.Router();
import UserController from '../controllers/auth.js';

router.post('/create-user',
    UserController.createUser);

export default router;
