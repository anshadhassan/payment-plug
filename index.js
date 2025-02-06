const AirpayProvider = require("./providers/airpay/airpay.js");
// const StripeProvider = require("./providers/stripe.js");
// const RazorpayProvider = require("./providers/razorpay.js");
// const PayUProvider = require("./providers/payu.js");
// const CashfreeProvider = require("./providers/cashfree/cashfree.js");

class PaymentGateway {
  constructor(provider = "airpay", config) {
    console.log(`Initializing Payment Gateway with provider: ${provider}`);
    this.providerInstance = this._initializeProvider(provider, config);
  }

  _initializeProvider(provider, config) {
    switch (provider) {
      case "airpay":
        return new AirpayProvider(config);
      // case "stripe":
      //   return new StripeProvider(config);
      // case "razorpay":
      //   return new RazorpayProvider(config);
      // case "payu":
      //   return new PayUProvider(config);
      // case "cashfree":
      //   return new CashfreeProvider(config);
      default:
        throw new Error("Unsupported payment provider");
    }
  }

  async processPayment(payload) {
    if (!this.providerInstance) {
      throw new Error("Payment provider not initialized");
    }

    const response = await this.providerInstance.processPayment(payload);
    return response;
  }
}

module.exports = PaymentGateway;
