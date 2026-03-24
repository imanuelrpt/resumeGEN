const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));

// EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'app/views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Session Setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Global Variables
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Routes
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user });
});

app.get('/templates', (req, res) => {
    res.render('templates/showcase', { user: req.session.user });
});

// Auth Routes
const authRoutes = require('./app/routes/auth');
app.use('/auth', authRoutes);

// Dashboard Routes
const dashboardRoutes = require('./app/routes/dashboard');
app.use('/dashboard', dashboardRoutes);

// Resume Routes
const resumeRoutes = require('./app/routes/resume');
app.use('/resume', resumeRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
