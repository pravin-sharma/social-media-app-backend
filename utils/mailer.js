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
      from: `Socializer Admin <${process.env.emailFrom}>`, //admin
      to: `${options.user.email}`, //user
      subject: "Email Address Verification",
      html: `<html>
        <body>
        <h1>Your account is successfully registered, In order to proceed further you need to click on the link next to verify email :</h1>
        <pre>
        <a href="${options.approvalUrl}">Verify Email</a>
        <a href="${options.rejectionUrl}">Cancel Verification</a>
        </pre>
        </body>
        </html>`,
    };
  }

  if (options.type == "initPasswordReset") {
    //Send mail to user for email verification
    mailOptions = {
      from: `Socializer Admin <${process.env.emailFrom}>`, //admin
      to: `${options.user.email}`, //user
      subject: "Password Reset",
      html: `<html>
        <body>
        <h1>We have received a password reset request for your email, Kindly visit the Password Reset URL and enter this code:</h1>
        <pre>
        <a href="${options.passwordResetUrl}">Password Reset URL</a>
        <p>Password Reset Code: ${options.user.resetPasswordToken}</p>
        </pre>
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
