import nodemailer from 'nodemailer';

// Ambil variabel dari Vercel Environment Variables
const EMAIL_SENDER = process.env.EMAIL_SENDER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const SECRET_API_KEY = process.env.SECRET_API_KEY;

// Ini adalah fungsi API Anda
export default async function handler(req, res) {
  try {
    // 1. Cek apakah metodenya POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Cek "Kunci Rahasia"
    // Ini agar hanya bot Pterodactyl Anda yang bisa pakai API ini
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${SECRET_API_KEY}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 3. Ambil data yang dikirim oleh bot Pterodactyl
    const { to_email, subject, body } = req.body;
    if (!to_email || !subject || !body) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    // 4. Setup Nodemailer (menggunakan App Password Anda)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: EMAIL_SENDER,
        pass: EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // 5. Kirim email
    await transporter.sendMail({
      from: EMAIL_SENDER,
      to: to_email,
      subject: subject,
      text: body
    });

    // 6. Kirim balasan sukses ke Pterodactyl
    res.status(200).json({ message: 'Email sent successfully' });

  } catch (error) {
    console.error('Error in Vercel API:', error);
    res.status(500).json({ error: error.message });
  }
}
