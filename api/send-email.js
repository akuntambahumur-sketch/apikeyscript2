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
    // Setup transporter Gmail
    const transporter = nodemailer.createTransporter({
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

    // Kirim notifikasi sukses ke Telegram (optional)
    if (process.env.BOT_TOKEN && process.env.OWNER_ID) {
      try {
        const telegramMessage = 
          `📧 *EMAIL BERHASIL DIKIRIM*\n\n` +
          `📮 Kepada: ${to_email}\n` +
          `📝 Subjek: ${subject}\n` +
          `📱 Nomor: ${number}\n` +
          `👤 User: ${username} (${user_id})\n` +
          `🕒 Waktu: ${new Date().toLocaleString('id-ID')}\n` +
          `🔧 Status: ✅ Success`;

        await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: process.env.OWNER_ID,
            text: telegramMessage,
            parse_mode: 'Markdown'
          })
        });
      } catch (telegramError) {
        console.log('⚠️ Gagal kirim notifikasi Telegram:', telegramError.message);
      }
    }

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

    // Kirim notifikasi error ke Telegram
    if (process.env.BOT_TOKEN && process.env.OWNER_ID) {
      try {
        const errorMessage = 
          `❌ *GAGAL KIRIM EMAIL*\n\n` +
          `📮 Kepada: ${to_email}\n` +
          `📝 Subjek: ${subject}\n` +
          `📱 Nomor: ${number}\n` +
          `👤 User: ${username} (${user_id})\n` +
          `🕒 Waktu: ${new Date().toLocaleString('id-ID')}\n` +
          `🔧 Error: ${error.message}`;

        await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: process.env.OWNER_ID,
            text: errorMessage,
            parse_mode: 'Markdown'
          })
        });
      } catch (telegramError) {
        console.log('⚠️ Gagal kirim notifikasi error Telegram:', telegramError.message);
      }
    }

    // Response error
    return res.status(500).json({
      status: 'error',
      message: `❌ Gagal mengirim email: ${error.message}`,
      error_code: 'EMAIL_SEND_FAILED'
    });
  }
}
