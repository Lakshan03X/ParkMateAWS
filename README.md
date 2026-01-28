# ParkMate - Smart Parking Management System 🚗

A comprehensive mobile parking management application built with React Native and Expo, featuring AI-powered license plate recognition and AWS cloud backend.

## ⚡ What's New - AWS Migration Complete!

🎉 **This app now runs on AWS** instead of Firebase!
- ✅ 100% Free Tier eligible
- ✅ DynamoDB for database
- ✅ API Gateway + Lambda for backend
- ✅ S3 for file storage
- ✅ All UI and features unchanged

**Quick Setup**: See [AWS_QUICK_START.md](./AWS_QUICK_START.md) (5 minutes)  
**Full Guide**: See [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md)  
**Migration Details**: See [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md)

---

## 🚀 Quick Start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Setup AWS Backend (First Time)**

   Follow: [AWS_QUICK_START.md](./AWS_QUICK_START.md)
   - Create AWS account (free)
   - Set up DynamoDB tables
   - Deploy Lambda function
   - Update app.json with your AWS URLs

3. **Setup OCR (Required for License Plate Scanning)**

   See **[SETUP_OCR_IN_3_STEPS.md](./SETUP_OCR_IN_3_STEPS.md)** for a 3-minute setup!

4. **Start the app**

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

---

## ☁️ AWS Backend Architecture

### Services Used (All Free Tier!)

- **DynamoDB** - NoSQL database for all data
- **API Gateway** - REST API endpoints
- **Lambda** - Serverless backend functions
- **S3** - File storage for receipts and images

### Database Tables

1. `users` - User accounts
2. `inspectors` - Inspector accounts
3. `parkingTickets` - Active tickets
4. `fines` - Traffic fines
5. `parkingZones` - Zone configurations
6. `demoUsers` - Demo NIC data
7. `vehicleOwners` - Vehicle owners
8. `paymentReceipts` - Payment records

---

## 🎯 OCR Setup Documentation

This app uses **Google Gemini AI** for license plate recognition - the **best free OCR service** used by most developers!

- **🚀 Quick Setup (3 steps)**: [SETUP_OCR_IN_3_STEPS.md](./SETUP_OCR_IN_3_STEPS.md)
- **📖 Complete Guide**: [COMPLETE_OCR_SETUP_GUIDE.md](./COMPLETE_OCR_SETUP_GUIDE.md)
- **🔧 Troubleshooting**: [QUICK_OCR_TROUBLESHOOTING.md](./QUICK_OCR_TROUBLESHOOTING.md)
- **📚 Original Guide**: [GEMINI_OCR_SETUP.md](./GEMINI_OCR_SETUP.md)

### Why Google Gemini?

✅ **100% FREE** - No credit card required  
✅ **High Accuracy** - AI-powered license plate detection  
✅ **45,000 scans/month** - Generous free tier  
✅ **Easy Setup** - Get API key in 2 minutes

---

## 🏗️ Project Structure

```
app/
├── screens/
│   ├── parkingOwner/        # Parking lot owner features
│   ├── parkingInspector/    # Parking inspector features
│   ├── mcOfficer/           # Municipal officer features
│   ├── mcAdmin/             # Municipal admin features
│   ├── fineChecker/         # Fine checker features
│   └── systemAdmin/         # System admin features
├── services/                # API and business logic
│   ├── ocrService.ts        # Google Gemini OCR integration
│   ├── firebase.ts          # Firebase configuration
│   └── ...
└── utils/                   # Utility functions
```

---

## ✨ Key Features

- 📸 **AI License Plate Scanner** - Powered by Google Gemini
- 🎫 **Digital Parking Tickets** - Issue and manage parking tickets
- 💰 **Fine Management** - Track and process parking fines
- 🗺️ **Zone Management** - Configure parking zones
- 📊 **Revenue Reports** - Track parking revenue
- 🔐 **Role-Based Access** - Multiple user roles with different permissions

---

## 🛠️ Technology Stack

- **Frontend**: React Native, Expo
- **Routing**: Expo Router
- **OCR**: Google Gemini AI (Free)
- **Backend**: Firebase
- **Camera**: Expo Camera
- **Image Processing**: Expo Image Manipulator
- **Maps**: React Native Maps

---

## Get a fresh project

When you're ready, run:

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
