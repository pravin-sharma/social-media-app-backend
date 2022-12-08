const nodemailer = require("nodemailer");

const mailer = async (options) => {
  const transporter = nodemailer.createTransport({
    service: process.env.email_service,
    auth: {
      user: process.env.admin_user,
      pass: process.env.admin_pass,
    },
  });

  let mailOptions;

  if(!options.type){
    throw new Error('Please send type in the argument')
  }

  if (options.type == "emailVerification") {
    //Send mail to user for email verification
    mailOptions = {
      from: `JellUp Admin <${process.env.emailFrom}>`, //admin
      to: `${options.user.email}`, //user
      subject: "Email Address Verification",
      html: `<html>
        <body>
        <h1>Your account is successfully registered, In order to proceed further you need to go to "Email Verification" page and enter the "Verification Code"</h1>
        <a href="${options.baseUrl}/email-verification">Email Verification URL</a>
        Verification Code: ${options.user.verificationToken}
        </body>
        </html>`,
    };
  }

  if (options.type == "initPasswordReset") {
    //Send mail to user for email verification
    mailOptions = {
      from: `JellUp Admin <${process.env.emailFrom}>`, //admin
      to: `${options.user.email}`, //user
      subject: "Password Reset",
      html: `<html>
        <body>
        <h1>We have received a password reset request for your email, Kindly visit the Password Reset URL and enter this code:</h1>
        <a href="${options.passwordResetUrl}">Password Reset URL</a>
        <p>Password Reset Code: ${options.user.resetPasswordToken}</p>
        </body>
        </html>`,
    };
  }

  try {
    const sendMail = await transporter.sendMail(mailOptions);
    console.log("Email sent to user: " + sendMail.response);
  } catch (error) {
    console.log(error);
  }
};

module.exports = mailer;
