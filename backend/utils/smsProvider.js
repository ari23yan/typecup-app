const axios = require("axios");

const sendOtpSms = async (phone, code) => {
  try {

    if (process.env.NODE_ENV === 'development') {
      console.log(`DEV MODE -> SMS to ${phone}: ${code}`);
      return;
    }

    const response = await axios.post(
      "https://api.sms.ir/v1/send/verify",
      {
        mobile: phone,
        templateId: process.env.SMSIR_TEMPLATE_ID,
        parameters: [
          {
            name: "OTP",
            value: code
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/plain",
          "x-api-key": process.env.SMSIR_API_KEY
        }
      }
    );

    return response.data;

  } catch (error) {
    console.error("SMS.ir Error:", error.response?.data || error.message);
    throw error;
  }
};

module.exports = sendOtpSms;
