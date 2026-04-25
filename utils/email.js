const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (email, code, type) => {
    const subject = type === 'registration' 
        ? 'Verify your Orthonu Account' 
        : 'Your Admin Login Verification Code';

    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #004AAD; text-align: center;">Orthonu Verification</h2>
            <p>Hello,</p>
            <p>Your verification code for ${type === 'registration' ? 'account registration' : 'admin login'} is:</p>
            <div style="background: #f4f7ff; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #004AAD; border-radius: 8px; margin: 20px 0;">
                ${code}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666; text-align: center;">&copy; ${new Date().getFullYear()} Orthonu. All rights reserved.</p>
        </div>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: 'Orthonu <noreply@newtest.orthonu.com>', 
            to: [email],
            subject: subject,
            html: html,
        });

        if (error) {
            console.error('Error sending email via Resend:', error);
            throw error;
        }

        return data;
    } catch (err) {
        console.error('Failed to send OTP email:', err);
        throw err;
    }
};

module.exports = { sendOtpEmail };
