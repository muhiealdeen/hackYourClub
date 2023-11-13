// src/util/sendEmail
import nodemailer from "nodemailer";

const sendEmail = async (userEmail, subject, htmlTemplete) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.SERVICE,
      auth: {
        user: process.env.APP_EMAIL_ADDRESS,
        pass: process.env.APP_EMAIL_PASSWORD,
      },
    });

    const mailOption = {
      from: process.env.APP_EMAIL_ADDRESS,
      to: userEmail,
      subject: subject,
      html: htmlTemplete,
    };

    await transporter.sendMail(mailOption);
  } catch (error) {
    console.log("email not sent");
    console.log(error);
  }
};

export default sendEmail;
