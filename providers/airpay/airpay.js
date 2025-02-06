const moment = require("moment");
const sha256 = require("sha256");

class AirpayProvider {
  constructor(config) {
    this._validateConfig(config);
    this.config = config;
  }

  _validateConfig(config) {
    const requiredFields = ["AIRPAY_PG_MID", "AIRPAY_PG_USER_NAME", "AIRPAY_PG_PASSWORD", "AIRPAY_PG_SECRET", "DOMAIN_URL"];

    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Airpay-PG config missing: ${field}`);
      }
    }
    console.log("Airpay config validated successfully.");
  }

  async processPayment(payload) {
    try {

      this._validatePayload(payload);

      const {
        AIRPAY_PG_SECRET, AIRPAY_PG_USER_NAME, AIRPAY_PG_PASSWORD, DOMAIN_URL, AIRPAY_PG_MID
      } = this.config;
  
      const {
        customer: { email, firstName, lastName },
        order: { amount, number, chmod },
      } = payload;

      const dataString = `${email}${firstName}${lastName}${amount}${number}${moment().format('YYYY-MM-DD')}`;
    
      const privatekey = sha256(`${AIRPAY_PG_SECRET}@${AIRPAY_PG_USER_NAME}:|:${AIRPAY_PG_PASSWORD}`);
    
      const keySha256 = sha256(`${AIRPAY_PG_USER_NAME}~:~${AIRPAY_PG_PASSWORD}`);
    
      const checksum = sha256(`${keySha256}@${dataString}`);
    
      return {
        data: {
          order: {
            amount,
            number,
            chmod,
            paymentUrl: `${DOMAIN_URL}/v1/01/customer/payment/order/checkout?number=${number}`,
          },
          mid: AIRPAY_PG_MID,
          privatekey,
          checksum,
          merDomain: Buffer.from(DOMAIN_URL).toString('base64'),
        },
      };
    } catch (error) {
      console.log("error", error);
      throw new Error(error)
    }
  }

  _validatePayload(payload) {
    const requiredFields = ["order"];
    const orderRequiredFields = ["amount", "number"];
    const customerRequiredFields = ["email", "firstName", "lastName", "mobileNumber"];

    for (const field of requiredFields) {
      if (!payload[field]) {
        throw new Error(`Airpay payload missing: ${field}`);
      }
    }

    for (const field of orderRequiredFields) {
      if (!payload.order[field]) {
        throw new Error(`Airpay order payload missing: ${field}`);
      }
    }

    for (const field of customerRequiredFields) {
      if (!payload.customer[field]) {
        throw new Error(`Airpay customer payload missing: ${field}`);
      }
    }

    console.log("Airpay payload validated successfully.");
  }
}

module.exports = AirpayProvider;
