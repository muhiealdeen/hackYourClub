import nodemailer from "nodemailer";

const sendEmail = async (userEmail, subject, htmlTemplete) => {
  try {
    // console.log("userEmail", userEmail);
    // console.log("subjectttttt", subject);
    // console.log("htmlTemplete", htmlTemplete);

    const transporter = nodemailer.createTransport({
      service: process.env.SERVICE,
      auth: {
        user: process.env.APP_EMAIL_ADDRESS,
        pass: process.env.APP_EMAIL_PASSWORD,
      },
    });

    console.log("process.env.SERVICE", process.env.SERVICE);
    console.log("process.env.APP_EMAIL_ADDRESS", process.env.APP_EMAIL_ADDRESS);
    console.log(
      "process.env.APP_EMAIL_PASSWORD",
      process.env.APP_EMAIL_PASSWORD
    );
    console.log("+++++++++++++++++++++++++++++++++", htmlTemplete);

    const mailOption = {
      from: process.env.APP_EMAIL_ADDRESS,
      to: userEmail,
      subject: subject,
      html: htmlTemplete,
    };

    console.log(" ------------------------------- ");

    const info = await transporter.sendMail(mailOption);

    console.log(" ******************************** ", info);

    console.log("email sent :" + info.response);
  } catch (error) {
    console.log("email not sent");
    console.log(error);
  }
};

export default sendEmail;
