const nodemailer = require('nodemailer');

async function sendEmail(Recipient) {
  // Create a transporter
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Your SMTP server's host
    port: 587, // Your SMTP server's port (usually 587 for TLS)
    secure: false, // Use TLS
    auth: {
      user: 'kitsyndi@gmail.com', // Your email address
      pass: 'syndiKIT@123', // Your email password
    },
    tls: {
      rejectUnauthorized: false // Accept self-signed certificates
    }
  });

  // Define the email options
  let mailOptions = {
    from: 'kitsyndi@gmail.com', // Sender address
    to: Recipient, // Recipient address
    subject: 'Hello from SyndiKIT', // Subject line
    text: 'This is a test email from SyndiKIT.', // Plain text body
    html: '<p>This is a test email from <b>SyndiKIT</b>.</p>', // HTML body
  };

  let mail = {}
  
  try {
    // Send the email
    mail.info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return mail.info;

  } catch (err) {
    mail.error = err
    console.error('Error sending email:', err);
    return err
    // throw new Error(`Error sending email: ${error}`);
  }
}

module.exports = sendEmail;