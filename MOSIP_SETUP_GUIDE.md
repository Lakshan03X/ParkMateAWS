# MOSIP Setup Guide for ParkMate App

## What is MOSIP?

MOSIP (Modular Open Source Identity Platform) is an open-source identity platform that provides digital identity services. For your application, we're using MOSIP's eSignet service to:

- Verify National Identity Card (NIC) numbers
- Retrieve verified user information (name, address)
- Send and verify OTP for authentication

## Prerequisites

1. **MOSIP Account** - You need to register with a MOSIP-enabled identity provider
2. **eSignet Integration** - Access to MOSIP eSignet API
3. **API Credentials** - Client ID and Client Secret

---

## Step-by-Step Setup

### 1. Register with MOSIP

#### Option A: Use Sri Lanka's Digital Identity System (If Available)

If Sri Lanka has implemented MOSIP or a similar digital identity system:

- Contact the Sri Lankan Digital Identity Authority
- Register your application as a relying party
- Get API credentials

#### Option B: Use MOSIP Sandbox/Testing Environment

For development and testing:

1. Visit MOSIP Developer Portal: https://docs.mosip.io/
2. Sign up for sandbox access
3. Request eSignet API credentials

#### Option C: Contact MOSIP Partner Organizations

- Email: info@mosip.io
- Visit: https://www.mosip.io/partners

### 2. Get Your API Credentials

Once registered, you'll receive:

- **Base URL** (e.g., `https://esignet.collab.mosip.net` or your country's MOSIP URL)
- **Client ID** (e.g., `parkmate-app-client-id`)
- **Client Secret** (e.g., `your-secret-key-here`)
- **Redirect URI** (e.g., `parkmate://auth/callback`)

### 3. Configure Environment Variables

Update your `.env` file with the actual credentials:

```env
# MOSIP Configuration
MOSIP_BASE_URL=https://esignet.collab.mosip.net
MOSIP_CLIENT_ID=your_actual_client_id_here
MOSIP_CLIENT_SECRET=your_actual_client_secret_here
MOSIP_REDIRECT_URI=parkmate://auth/callback
MOSIP_AUTH_ENDPOINT=/v1/authmanager/authenticate/clientidsecretkey
MOSIP_ESIGNET_ENDPOINT=/v1/esignet

# Firebase Configuration (Get from Firebase Console)
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_AUTH_DOMAIN=parkmate-app.firebaseapp.com
FIREBASE_PROJECT_ID=parkmate-app
FIREBASE_STORAGE_BUCKET=parkmate-app.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Backend API (if you have a separate backend)
API_BASE_URL=https://your-backend-api.com/api
```

### 4. Set Up Firebase

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Create a new project** named "ParkMate"
3. **Add a Web App**:

   - Click "Add app" → Web icon
   - Register app name: "ParkMate App"
   - Copy the configuration values

4. **Enable Firestore Database**:

   - Go to "Build" → "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select your region (closest to Sri Lanka)

5. **Set up Security Rules** (in Firestore):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null;
      allow create: if true; // Allow registration
    }

    // Parking spots collection (add your other collections)
    match /parkingSpots/{spotId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 5. Important Notes

#### For Production:

⚠️ **Never commit `.env` file to version control!**

Add to your `.gitignore`:

```
.env
.env.local
.env.*.local
```

#### MOSIP API Endpoints You're Using:

1. **Authentication Endpoint** (`/v1/authmanager/authenticate`)

   - Purpose: Get access token for API calls
   - Method: POST
   - Body: `{ clientId, clientSecret, grantType: 'client_credentials' }`

2. **NIC Verification** (`/v1/esignet/authorize`)

   - Purpose: Verify NIC and get user data
   - Method: POST
   - Headers: `Authorization: Bearer {token}`
   - Body: `{ individualId, individualIdType: 'NIC', transactionId }`

3. **OTP Request** (`/v1/esignet/authenticate`)

   - Purpose: Send OTP to user's mobile
   - Method: POST
   - Body: `{ individualId, otpChannel: ['PHONE'], phone, transactionId }`

4. **OTP Verification** (`/v1/esignet/verify`)
   - Purpose: Verify the OTP entered by user
   - Method: POST
   - Body: `{ transactionId, otp }`

### 6. Testing Your Setup

After configuration, test the integration:

1. **Clear Metro bundler cache**:

   ```bash
   cd "d:\My Documets\SLT\ParkMateApp\my-app"
   npm start -- --reset-cache
   ```

2. **Test NIC Verification**:

   - Enter a valid NIC number
   - Click "Verify" button
   - Should auto-fill name and address

3. **Test OTP Flow**:
   - Enter mobile number
   - Click "Register"
   - Should receive OTP
   - Enter OTP and verify

### 7. Troubleshooting

#### Error: "Failed to authenticate with MOSIP"

- Check if `MOSIP_BASE_URL` is correct
- Verify `MOSIP_CLIENT_ID` and `MOSIP_CLIENT_SECRET`
- Check network connectivity

#### Error: "NIC not found in MOSIP database"

- The NIC number may not be registered in MOSIP
- Try with a test NIC provided by MOSIP sandbox

#### Error: "Module '@env' not found"

- Clear cache: `npm start -- --reset-cache`
- Restart Metro bundler
- Check if `babel.config.js` is properly configured

#### Firebase Errors

- Verify all Firebase credentials in `.env`
- Check if Firestore is enabled in Firebase Console
- Review security rules

### 8. Alternative: Mock MOSIP for Development

If you can't get MOSIP credentials immediately, create a mock service:

Create `app/services/mockMosipService.ts`:

```typescript
export const mockMosipService = {
  verifyNIC: async (nicNumber: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock successful response
    return {
      status: "success",
      message: "NIC verified successfully",
      data: {
        fullName: "John Doe",
        address: "123, Main Street, Colombo 07",
        dateOfBirth: "1990-01-01",
        gender: "Male",
      },
    };
  },

  requestOTP: async (nicNumber: string, mobileNumber: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      status: "success",
      message: "OTP sent successfully",
      transactionId: `MOCK-TXN-${Date.now()}`,
    };
  },

  verifyOTP: async (transactionId: string, otp: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Accept "1234" as valid OTP for testing
    if (otp === "1234") {
      return {
        status: "success",
        message: "OTP verified successfully",
        verified: true,
      };
    }
    return {
      status: "error",
      message: "Invalid OTP",
      verified: false,
    };
  },
};
```

### 9. Security Best Practices

1. **Never hardcode credentials** - Always use environment variables
2. **Use HTTPS only** - Ensure all API calls are over HTTPS
3. **Implement rate limiting** - Prevent abuse of OTP requests
4. **Validate on server side** - Don't trust client-side validation alone
5. **Log security events** - Track authentication attempts
6. **Implement token refresh** - Handle expired tokens gracefully

### 10. Resources

- **MOSIP Documentation**: https://docs.mosip.io/
- **eSignet Documentation**: https://docs.esignet.io/
- **Firebase Documentation**: https://firebase.google.com/docs
- **MOSIP Community**: https://community.mosip.io/

---

## Contact for MOSIP Access

If you need help getting MOSIP credentials for Sri Lanka:

1. **Department of Registration of Persons (Sri Lanka)**
2. **ICTA (Information and Communication Technology Agency)**
3. **MOSIP Partners**: info@mosip.io

---

## Next Steps After Setup

1. ✅ Configure `.env` with actual credentials
2. ✅ Test NIC verification
3. ✅ Test OTP flow
4. ✅ Set up Firebase security rules
5. ✅ Deploy to production environment

---

_Created for ParkMate App - November 2025_
