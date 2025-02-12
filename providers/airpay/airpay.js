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
      console.log('>>>>>>>>>', payload)
      this._validatePayload(payload)
      const {
        customer: { email, firstName, lastName },
        order: { amount, number, chmod, sb_nextrundate, sb_period, sb_frequency, 
          sb_amount, sb_isrecurring, sb_recurringcount, sb_retryattempts },
      } = payload;

      const {
        AIRPAY_PG_SECRET, AIRPAY_PG_USER_NAME, AIRPAY_PG_PASSWORD, DOMAIN_URL, AIRPAY_PG_MID
      } = this.config;
  
      const dataString = chmod === 'upi' ? 
        `${email}${firstName}${lastName}${amount}${number}${moment().format('YYYY-MM-DD')}` :
        `${email}${firstName}${lastName}${amount}${number}${sb_nextrundate}${number}${sb_period}${sb_frequency}${sb_amount}${sb_isrecurring}${sb_recurringcount}${sb_retryattempts}${moment().format('YYYY-MM-DD')}`;
      
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
    if (!payload?.order) throw new Error("Airpay payload missing: order");
    if (!payload?.customer) throw new Error("Airpay payload missing: customer");
  
    const { order } = payload;
    const { chmod } = order;
  
    const orderFieldsMap = {
      upi: ["amount", "number"],
      enach: [
        "amount", "number", "chmod", "sb_nextrundate", "sb_period", "sb_frequency", 
        "sb_amount", "sb_isrecurring", "sb_recurringcount", "sb_retryattempts"
      ],
    };
  
    if (!chmod) throw new Error("Airpay order payload missing: chmod");
  
    if (!orderFieldsMap[chmod]) {
      throw new Error(`Invalid Airpay order type: ${chmod}`);
    }
  
    // Validate required fields for the given order type
    this._validateFields(order, orderFieldsMap[chmod], "order");
  
    // Validate customer fields
    this._validateFields(payload.customer, ["email", "firstName", "lastName", "mobileNumber"], "customer");
  
    console.log("Airpay payload validated successfully.");
  }

  _validateFields(payload, fields, type) {
    for (const field of fields) {
      if (!payload[field]) {
        throw new Error(`Airpay ${type} payload missing: ${field}`);
      }
    }
  }
}

module.exports = AirpayProvider;
