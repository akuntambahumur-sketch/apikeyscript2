import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Cek method
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'error',
      message: '❌ Method tidak diizinkan. Hanya POST yang diperbolehkan.'
    });
  }

  // Validasi API Key
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      status: 'error',
      message: '🔐 API Key tidak valid atau tidak ditemukan.'
    });
  }

  // Validasi data
  const { to_email, subject, body, number, user_id, username } = req.body;

  if (!to_email || !subject || !body || !number) {
    return res.status(400).json({
      status: 'error',
      message: '📝 Data tidak lengkap. Pastikan to_email, subject, body, dan number tersedia.'
    });
  }

  try {
    // PERBAIKAN: createTransport BUKAN createTransporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      },
      timeout: 30000,
      connectionTimeout: 30000,
      socketTimeout: 30000,
      tls: {
        rejectUnauthorized: false
      }
    });

    // Kirim email
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: to_email,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    };

    const info = await transporter.sendMail(mailOptions);

    // Log success
    console.log('✅ Email berhasil dikirim:', {
      messageId: info.messageId,
      to: to_email,
      subject: subject,
      user_id: user_id,
      username: username,
      number: number,
      timestamp: new Date().toISOString()
    });

    // Response sukses
    return res.status(200).json({
      status: 'success',
      message: '🎉 Email berhasil dikirim!',
      data: {
        message_id: info.messageId,
        to_email: to_email,
        subject: subject,
        number: number
      }
    });

  } catch (error) {
    console.error('❌ Error mengirim email:', error);

    // Response error
    return res.status(500).json({
      status: 'error',
      message: `❌ Gagal mengirim email: ${error.message}`,
      error_code: 'EMAIL_SEND_FAILED'
    });
  }
}
