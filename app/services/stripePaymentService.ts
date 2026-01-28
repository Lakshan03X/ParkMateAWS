// Stripe payment service for handling card payments

// Stripe publishable key (test mode)
const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51SXKQaLfUF1EOAlkvUfgmzQLkLmw7bygjvtQeUpwZKFxV65OthuFfYeekzn1UYXGa7q4CGKdWzjuoicNKDcjDVvj00Ti5aVHD0";

// Stripe secret key (test mode) - REPLACE WITH YOUR ACTUAL SECRET KEY!
// Get it from: https://dashboard.stripe.com/test/apikeys
const STRIPE_SECRET_KEY =
  "sk_test_51SXKQaLfUF1EOAlkRg2EBDYBQMgCnncdh2V1bDYUBPSooon9jx6DXTm1TTnDoIl5VNp7D60EcorcjHtGbKNQtfnQ00SRkuYdEY";

const STRIPE_API_URL = "https://api.stripe.com/v1";

class StripePaymentService {
  /**
   * Initialize Stripe
   */
  async initialize() {
    console.log("💳 Stripe Payment Service initialized");
    return true;
  }

  /**
   * Create a card token (client-side safe)
   */
  async createCardToken(cardDetails: {
    number: string;
    expMonth: number;
    expYear: number;
    cvc: string;
  }): Promise<{ id: string; error?: string }> {
    try {
      console.log("🔐 Creating card token...");

      const formData = new URLSearchParams();
      formData.append("card[number]", cardDetails.number);
      formData.append("card[exp_month]", cardDetails.expMonth.toString());
      formData.append("card[exp_year]", cardDetails.expYear.toString());
      formData.append("card[cvc]", cardDetails.cvc);

      const response = await fetch(`${STRIPE_API_URL}/tokens`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const result = await response.json();

      if (result.error) {
        console.error("❌ Token creation failed:", result.error);
        return { id: "", error: result.error.message };
      }

      console.log("✅ Card token created:", result.id);
      return { id: result.id };
    } catch (error: any) {
      console.error("❌ Error creating card token:", error);
      return { id: "", error: error.message };
    }
  }

  /**
   * Get Stripe test token based on card number
   * Stripe provides pre-made tokens for testing
   */
  getTestToken(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, "");

    // Map common test cards to their tokens
    // See: https://stripe.com/docs/testing
    const testTokens: { [key: string]: string } = {
      "4242424242424242": "tok_visa", // Visa
      "4000056655665556": "tok_visa_debit", // Visa (debit)
      "5555555555554444": "tok_mastercard", // Mastercard
      "5200828282828210": "tok_mastercard_debit", // Mastercard (debit)
      "378282246310005": "tok_amex", // Amex
      "6011111111111117": "tok_discover", // Discover
      "3056930009020004": "tok_diners", // Diners
    };

    // Return the token for known test cards, or default Visa token
    return testTokens[cleaned] || "tok_visa";
  }

  /**
   * Create a payment method with card details (using test tokens)
   */
  async createPaymentMethod(cardDetails: {
    number: string;
    expMonth: number;
    expYear: number;
    cvc: string;
  }): Promise<{ id: string; error?: string }> {
    try {
      console.log("🔐 Creating payment method using test token...");

      // For testing, use Stripe's pre-made test tokens
      const token = this.getTestToken(cardDetails.number);
      console.log(`📝 Using test token: ${token}`);

      const formData = new URLSearchParams();
      formData.append("type", "card");
      formData.append("card[token]", token);

      const response = await fetch(`${STRIPE_API_URL}/payment_methods`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const result = await response.json();

      if (result.error) {
        console.error("❌ Payment method creation failed:", result.error);
        return { id: "", error: result.error.message };
      }

      console.log("✅ Payment method created:", result.id);
      return { id: result.id };
    } catch (error: any) {
      console.error("❌ Error creating payment method:", error);
      return { id: "", error: error.message };
    }
  }

  /**
   * Create payment intent on Stripe
   */
  async createPaymentIntent(
    amount: number,
    description: string
  ): Promise<{
    clientSecret: string;
    paymentIntentId: string;
    error?: string;
  }> {
    try {
      console.log(`💰 Creating payment intent for LKR ${amount}...`);

      // Convert to cents (Stripe uses smallest currency unit)
      const amountInCents = Math.round(amount * 100);

      const formData = new URLSearchParams();
      formData.append("amount", amountInCents.toString());
      formData.append("currency", "lkr");
      formData.append("description", description);
      formData.append("automatic_payment_methods[enabled]", "true");
      formData.append("automatic_payment_methods[allow_redirects]", "never"); // Disable redirect-based payment methods

      const response = await fetch(`${STRIPE_API_URL}/payment_intents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const result = await response.json();

      if (result.error) {
        console.error("❌ Payment intent creation failed:", result.error);
        return {
          clientSecret: "",
          paymentIntentId: "",
          error: result.error.message,
        };
      }

      console.log("✅ Payment intent created:", result.id);
      return {
        clientSecret: result.client_secret,
        paymentIntentId: result.id,
      };
    } catch (error: any) {
      console.error("❌ Error creating payment intent:", error);
      return { clientSecret: "", paymentIntentId: "", error: error.message };
    }
  }

  /**
   * Confirm payment with payment method
   */
  async confirmPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("🔄 Confirming payment...");

      const formData = new URLSearchParams();
      formData.append("payment_method", paymentMethodId);

      const response = await fetch(
        `${STRIPE_API_URL}/payment_intents/${paymentIntentId}/confirm`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        }
      );

      const result = await response.json();

      if (result.error) {
        console.error("❌ Payment confirmation failed:", result.error);
        return { success: false, error: result.error.message };
      }

      if (result.status === "succeeded") {
        console.log("✅ Payment succeeded!");
        return { success: true };
      } else {
        console.log("⚠️ Payment status:", result.status);
        return { success: false, error: `Payment status: ${result.status}` };
      }
    } catch (error: any) {
      console.error("❌ Error confirming payment:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process payment with card details (all-in-one method)
   */
  async processPayment(
    cardDetails: {
      number: string;
      expMonth: number;
      expYear: number;
      cvc: string;
    },
    amount: number,
    description: string
  ): Promise<{ success: boolean; paymentId: string; error?: string }> {
    try {
      console.log("💳 Starting payment process...");

      // Step 1: Create payment method
      const paymentMethod = await this.createPaymentMethod(cardDetails);
      if (paymentMethod.error) {
        return {
          success: false,
          paymentId: "",
          error: paymentMethod.error,
        };
      }

      // Step 2: Create payment intent
      const paymentIntent = await this.createPaymentIntent(amount, description);
      if (paymentIntent.error) {
        return {
          success: false,
          paymentId: "",
          error: paymentIntent.error,
        };
      }

      // Step 3: Confirm payment
      const confirmation = await this.confirmPayment(
        paymentIntent.paymentIntentId,
        paymentMethod.id
      );

      if (confirmation.success) {
        console.log("🎉 Payment completed successfully!");
        return {
          success: true,
          paymentId: paymentIntent.paymentIntentId,
        };
      } else {
        return {
          success: false,
          paymentId: "",
          error: confirmation.error,
        };
      }
    } catch (error: any) {
      console.error("❌ Payment processing error:", error);
      return {
        success: false,
        paymentId: "",
        error: error.message || "Payment failed",
      };
    }
  }

  /**
   * Validate card number using Luhn algorithm
   */
  validateCardNumber(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\s/g, "");
    if (!/^\d{13,19}$/.test(cleaned)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Get card type from number
   */
  getCardType(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, "");

    if (/^4/.test(cleaned)) return "Visa";
    if (/^5[1-5]/.test(cleaned)) return "Mastercard";
    if (/^3[47]/.test(cleaned)) return "Amex";
    if (/^6(?:011|5)/.test(cleaned)) return "Discover";

    return "Unknown";
  }

  /**
   * Format card number with spaces
   */
  formatCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(" ");
  }
}

export default new StripePaymentService();
