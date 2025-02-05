
import AirpayProvider from "./providers/airpay/airpay.js";
// import StripeProvider from "./providers/stripe.js";
// import RazorpayProvider from "./providers/razorpay.js";
// import PayUProvider from "./providers/payu.js";
// import CashfreeProvider from "./providers/cashfree/cashfree.js";

class PaymentGateway {
  constructor(provider = 'airpay', config) {
    console.log(`Initializing Payment Gateway with provider: ${provider}`);
    this.providerInstance = this.#initializeProvider(provider, config);
  }

  #initializeProvider (provider, config) {
    switch (provider) {
      case "airpay":
        return new AirpayProvider(config);
    //   case "stripe":
    //     return new StripeProvider(config);
    //   case "razorpay":
    //     return new RazorpayProvider(config);
    //   case "payu":
    //     return new PayUProvider(config);
    //   case "cashfree":
    //     return new CashfreeProvider(config);
      default:
        throw new Error("Unsupported payment provider");
    }
  }

  async processPayment (payload) {
    if (!this.providerInstance) {
      throw new Error("Payment provider not initialized");
    }

    const response = await this.providerInstance.processPayment(payload);
    console.log("response=>", response)
    return response
  }
}

export default PaymentGateway;
