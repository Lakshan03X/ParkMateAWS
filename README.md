# ParkMate - Smart Parking Management System 🚗

A comprehensive mobile parking management application built with React Native and Expo, featuring AI-powered license plate recognition and AWS cloud backend.

## ☁️ AWS Cloud Backend

🎉 **Fully AWS-powered application!**

- ✅ **AWS DynamoDB** - NoSQL database for all data
- ✅ **AWS Lambda** - Serverless backend functions
- ✅ **API Gateway** - RESTful API endpoints
- ✅ **S3** - File storage for images and documents
- ✅ **100% Free Tier eligible** for small-scale use

**Complete Setup Guide**: See [AWS_SETUP.md](./AWS_SETUP.md)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup AWS Backend (Required - First Time Only)

Follow the complete guide: **[AWS_SETUP.md](./AWS_SETUP.md)**

Quick overview:

- Create AWS account (free tier)
- Set up 7 DynamoDB tables
- Create S3 bucket for uploads
- Deploy Lambda function
- Create API Gateway endpoint
- Update `app.json` with your API endpoint

### 3. Configure Environment

Update [app.json](app.json) with your AWS endpoint:

```json
{
  "expo": {
    "extra": {
      "AWS_REGION": "us-east-1",
      "AWS_API_GATEWAY_URL": "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod",
      "AWS_S3_BUCKET": "parkmate-uploads"
    }
  }
}
```

### 4. Setup OCR (Optional - for License Plate Scanning)

Get a free Google Gemini API key:

- Visit https://aistudio.google.com/app/apikey
- Copy your API key
- Update `EXPO_PUBLIC_GEMINI_API_KEY` in [.env.example](.env.example)

### 5. Start the App

```bash
npx expo start
```

Open the app in:

- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo Go](https://expo.dev/go)

---

## 🏗️ AWS Backend Architecture

### Services Used (All Free Tier!)

| Service         | Purpose              | Free Tier Limits                  |
| --------------- | -------------------- | --------------------------------- |
| **DynamoDB**    | NoSQL database       | 25GB storage, 25 read/write units |
| **API Gateway** | REST API endpoints   | 1M requests/month                 |
| **Lambda**      | Serverless functions | 1M requests/month                 |
| **S3**          | File storage         | 5GB storage, 20K GET requests     |

### Database Tables

| Table Name                 | Purpose                          |
| -------------------------- | -------------------------------- |
| `parkmate-users`           | User accounts and authentication |
| `parkmate-parking-zones`   | Parking zone configurations      |
| `parkmate-parking-tickets` | Active parking tickets           |
| `parkmate-fines`           | Traffic fines and violations     |
| `parkmate-vehicles`        | Vehicle registrations            |
| `parkmate-receipts`        | Payment receipts                 |
| `parkmate-nic-records`     | NIC verification records         |

---

## 📱 App Features

### For Parking Inspectors

- 📸 AI-powered license plate scanning (Google Gemini)
- 🎫 Issue digital parking tickets
- 💰 Record fine payments
- 📊 View inspection history

### For Parking Owners

- 🗺️ Manage parking zones
- 💵 Set parking rates
- 📈 Track revenue
- 📊 Generate reports

### For Municipal Officers

- ✅ Approve parking zones
- 📋 Monitor violations
- 📊 System-wide reports
- 👥 User management

### For Vehicle Owners

- 📱 View active tickets
- 💳 Pay fines online
- 🚗 Manage vehicles
- 📄 Download receipts

### For System Admins

- 👥 User management
- 🔐 Role assignment
- ⚙️ System configuration
- 📊 Analytics dashboard

---

## 🔒 Security Features

- ✅ NIC-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Secure AWS Lambda backend
- ✅ Encrypted data storage in DynamoDB
- ✅ S3 secure file uploads

---

## 🛠️ Technology Stack

| Layer            | Technology                |
| ---------------- | ------------------------- |
| **Frontend**     | React Native, Expo Router |
| **UI Framework** | React Native              |
| **Backend**      | AWS Lambda (Node.js)      |
| **Database**     | AWS DynamoDB              |
| **API**          | AWS API Gateway (REST)    |
| **Storage**      | AWS S3                    |
| **OCR**          | Google Gemini AI          |
| **Camera**       | Expo Camera               |
| **Maps**         | React Native Maps         |

---

## 💰 Cost Estimate

### Free Tier (First 12 months)

- ✅ Up to 1000 active users
- ✅ Up to 50,000 parking tickets/month
- ✅ Up to 10,000 license plate scans/month
- ✅ **Total Cost: $0/month**

### After Free Tier

- ~$5-10/month for 1000 users
- Pay only for what you use
- No monthly minimums

---

## 📚 Documentation

- **[AWS_SETUP.md](./AWS_SETUP.md)** - Complete AWS backend setup guide
- **[.env.example](.env.example)** - Environment configuration template

---

## 🚀 Deployment

### Prerequisites

- Node.js 18+ installed
- AWS account with CLI configured
- Expo CLI installed: `npm install -g expo-cli`

### Deploy to AWS

Follow the detailed guide in [AWS_SETUP.md](./AWS_SETUP.md)

### Build for Production

```bash
# Android
npx expo build:android

# iOS
npx expo build:ios
```

---

## 🔧 Troubleshooting

### Common Issues

**1. "Cannot connect to AWS"**

- Verify your API Gateway URL in `app.json`
- Check if Lambda function is deployed
- Ensure proper IAM permissions

**2. "DynamoDB table not found"**

- Verify all 7 tables are created
- Check table names match exactly
- Ensure proper region (us-east-1)

**3. "OCR not working"**

- Get free Gemini API key from https://aistudio.google.com/app/apikey
- Update `EXPO_PUBLIC_GEMINI_API_KEY` in [.env.example](.env.example)

**4. "Image upload failed"**

- Verify S3 bucket exists
- Check bucket CORS configuration
- Ensure Lambda has S3 permissions

---

## 📞 Support

For AWS setup issues:

- AWS Documentation: https://docs.aws.amazon.com
- AWS Support: https://console.aws.amazon.com/support

For app development:

- Expo Documentation: https://docs.expo.dev
- React Native: https://reactnative.dev

---

## 📄 License

This project is for educational and commercial use.

---

## 🎉 Ready to Deploy!

Your app is configured for AWS hosting with:

- ✅ DynamoDB for database
- ✅ Lambda for serverless backend
- ✅ API Gateway for REST API
- ✅ S3 for file storage
- ✅ No Firebase dependencies

**Next Steps:**

1. Complete AWS setup: [AWS_SETUP.md](./AWS_SETUP.md)
2. Update `app.json` with your API endpoint
3. Run `npx expo start`
4. Deploy to production!

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
