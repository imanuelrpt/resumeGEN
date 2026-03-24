const bcrypt = require('bcrypt');
const db = require('../../config/db');

exports.getLogin = (req, res) => {
    res.render('auth/login', { title: 'Login', error: null });
};

exports.postLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.render('auth/login', { title: 'Login', error: 'Email atau password salah' });
        }
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('auth/login', { title: 'Login', error: 'Email atau password salah' });
        }
        req.session.user = { id: user.id, nama: user.nama, email: user.email };
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.render('auth/login', { title: 'Login', error: 'Terjadi kesalahan sistem' });
    }
};

exports.getRegister = (req, res) => {
    res.render('auth/register', { title: 'Register', error: null });
};

exports.postRegister = async (req, res) => {
    const { nama, email, password } = req.body;
    try {
        const [existing] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.render('auth/register', { title: 'Register', error: 'Email sudah terdaftar' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO users (nama, email, password) VALUES (?, ?, ?)', [nama, email, hashedPassword]);
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        res.render('auth/register', { title: 'Register', error: 'Terjadi kesalahan sistem' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/');
};
