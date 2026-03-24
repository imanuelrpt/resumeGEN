const db = require('../../config/db');
const puppeteer = require('puppeteer');
const path = require('path');
const ejs = require('ejs');

exports.getCreate = (req, res) => {
    res.render('resume/form', { title: 'Create Resume', resume: null, education: [], experience: [], skills: [], certificates: [] });
};

exports.postCreate = async (req, res) => {
    const { nama_lengkap, email_resume, phone, alamat, summary, template } = req.body;
    const { edu_school, edu_major, edu_year, exp_company, exp_position, exp_year, exp_desc, skills, certs } = req.body;
    
    let photoName = null;
    if (req.files && req.files.photo) {
        const photo = req.files.photo;
        photoName = Date.now() + '_' + photo.name;
        photo.mv(path.join(__dirname, '../../public/images', photoName));
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO resumes (user_id, template, nama_lengkap, email_resume, phone, alamat, summary, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [req.session.user.id, template, nama_lengkap, email_resume, phone, alamat, summary, photoName]
        );
        const resume_id = result.insertId;

        // Insert Education
        if (edu_school) {
            for (let i = 0; i < edu_school.length; i++) {
                if (edu_school[i]) {
                    await db.execute('INSERT INTO education (resume_id, school, major, year) VALUES (?, ?, ?, ?)', [resume_id, edu_school[i], edu_major[i], edu_year[i]]);
                }
            }
        }

        // Insert Experience
        if (exp_company) {
            for (let i = 0; i < exp_company.length; i++) {
                if (exp_company[i]) {
                    await db.execute('INSERT INTO experience (resume_id, company, position, year, description) VALUES (?, ?, ?, ?, ?)', [resume_id, exp_company[i], exp_position[i], exp_year[i], exp_desc[i]]);
                }
            }
        }

        // Insert Skills
        if (skills) {
            for (let s of skills) {
                if (s) await db.execute('INSERT INTO skills (resume_id, skill_name) VALUES (?, ?)', [resume_id, s]);
            }
        }

        // Insert Certificates
        if (certs) {
            for (let c of certs) {
                if (c) await db.execute('INSERT INTO certificates (resume_id, cert_name) VALUES (?, ?)', [resume_id, c]);
            }
        }

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/resume/create');
    }
};

exports.getEdit = async (req, res) => {
    const { id } = req.params;
    try {
        const [resumes] = await db.execute('SELECT * FROM resumes WHERE id = ? AND user_id = ?', [id, req.session.user.id]);
        if (resumes.length === 0) return res.redirect('/dashboard');
        
        const resume = resumes[0];
        const [education] = await db.execute('SELECT * FROM education WHERE resume_id = ?', [id]);
        const [experience] = await db.execute('SELECT * FROM experience WHERE resume_id = ?', [id]);
        const [skills] = await db.execute('SELECT * FROM skills WHERE resume_id = ?', [id]);
        const [certificates] = await db.execute('SELECT * FROM certificates WHERE resume_id = ?', [id]);

        res.render('resume/form', { 
            title: 'Edit Resume', 
            resume, 
            education, 
            experience, 
            skills, 
            certificates 
        });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
};

exports.postEdit = async (req, res) => {
    const { id } = req.params;
    const { nama_lengkap, email_resume, phone, alamat, summary, template } = req.body;
    const { edu_school, edu_major, edu_year, exp_company, exp_position, exp_year, exp_desc, skills, certs } = req.body;

    let photoName = req.body.old_photo || null;
    if (req.files && req.files.photo) {
        const photo = req.files.photo;
        photoName = Date.now() + '_' + photo.name;
        photo.mv(path.join(__dirname, '../../public/images', photoName));
    }

    try {
        await db.execute(
            'UPDATE resumes SET template = ?, nama_lengkap = ?, email_resume = ?, phone = ?, alamat = ?, summary = ?, photo = ? WHERE id = ? AND user_id = ?',
            [template, nama_lengkap, email_resume, phone, alamat, summary, photoName, id, req.session.user.id]
        );

        // Simple approach: delete old entries and re-insert
        await db.execute('DELETE FROM education WHERE resume_id = ?', [id]);
        await db.execute('DELETE FROM experience WHERE resume_id = ?', [id]);
        await db.execute('DELETE FROM skills WHERE resume_id = ?', [id]);
        await db.execute('DELETE FROM certificates WHERE resume_id = ?', [id]);

        if (edu_school) {
            for (let i = 0; i < edu_school.length; i++) {
                if (edu_school[i]) {
                    await db.execute('INSERT INTO education (resume_id, school, major, year) VALUES (?, ?, ?, ?)', [id, edu_school[i], edu_major[i], edu_year[i]]);
                }
            }
        }

        if (exp_company) {
            for (let i = 0; i < exp_company.length; i++) {
                if (exp_company[i]) {
                    await db.execute('INSERT INTO experience (resume_id, company, position, year, description) VALUES (?, ?, ?, ?, ?)', [id, exp_company[i], exp_position[i], exp_year[i], exp_desc[i]]);
                }
            }
        }

        if (skills) {
            for (let s of skills) {
                if (s) await db.execute('INSERT INTO skills (resume_id, skill_name) VALUES (?, ?)', [id, s]);
            }
        }

        if (certs) {
            for (let c of certs) {
                if (c) await db.execute('INSERT INTO certificates (resume_id, cert_name) VALUES (?, ?)', [id, c]);
            }
        }

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/resume/edit/' + id);
    }
};

exports.deleteResume = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM resumes WHERE id = ? AND user_id = ?', [id, req.session.user.id]);
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

exports.downloadResume = async (req, res) => {
    const { id } = req.params;
    try {
        const [resumes] = await db.execute('SELECT * FROM resumes WHERE id = ? AND user_id = ?', [id, req.session.user.id]);
        if (resumes.length === 0) return res.redirect('/dashboard');
        
        const resume = resumes[0];
        const [education] = await db.execute('SELECT * FROM education WHERE resume_id = ?', [id]);
        const [experience] = await db.execute('SELECT * FROM experience WHERE resume_id = ?', [id]);
        const [skills] = await db.execute('SELECT * FROM skills WHERE resume_id = ?', [id]);
        const [certificates] = await db.execute('SELECT * FROM certificates WHERE resume_id = ?', [id]);

        // Photo Base path for Puppeteer
        const photoBase = 'file://' + path.join(__dirname, '../../public/images').replace(/\\/g, '/');

        // Render the EJS template to HTML
        const templatePath = path.join(__dirname, `../views/templates/${resume.template}.ejs`);
        const html = await ejs.renderFile(templatePath, { resume, education, experience, skills, certificates, photoBase });

        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        res.contentType('application/pdf');
        res.send(pdf);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating PDF');
    }
};
