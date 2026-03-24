const db = require('../../config/db');

exports.getDashboard = async (req, res) => {
    try {
        const [resumes] = await db.execute('SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC', [req.session.user.id]);
        res.render('dashboard/index', { title: 'Dashboard', user: req.session.user, resumes });
    } catch (err) {
        console.error(err);
        res.render('dashboard/index', { title: 'Dashboard', user: req.session.user, resumes: [], error: 'Gagal mengambil data resume' });
    }
};
