# AWS Deployment Guide - Parking System Mobile App

## 🚀 Complete Migration from Firebase to AWS (Free Tier)

This guide will help you deploy your parking system app on AWS using free tier services.

---

## 📋 Prerequisites

1. **AWS Account** (Free Tier eligible)

   - Sign up at: https://aws.amazon.com/free/
   - Free tier includes:
     - 25 GB DynamoDB storage
     - 1 million API Gateway requests/month
     - 5 GB S3 storage
     - 12 months free EC2 instance

2. **AWS CLI** installed

   ```bash
   # Windows (using Chocolatey)
   choco install awscli

   # Or download from: https://aws.amazon.com/cli/
   ```

3. **Node.js** (v16 or higher)

---

## 🗂️ Step 1: Create DynamoDB Tables

### 1.1 Login to AWS Console

- Go to: https://console.aws.amazon.com/
- Navigate to **DynamoDB**

### 1.2 Create Required Tables

Create the following tables (all in **us-east-1** region for free tier):

#### Table 1: users

- **Table name**: `users`
- **Partition key**: `nicNumber` (String)
- **Settings**: On-demand capacity (free tier eligible)

#### Table 2: inspectors

- **Table name**: `inspectors`
- **Partition key**: `inspectorId` (String)
- **Settings**: On-demand capacity

#### Table 3: parkingTickets

- **Table name**: `parkingTickets`
- **Partition key**: `ticketId` (String)
- **Global Secondary Index (GSI)**:
  - Index name: `vehicleNumber-index`
  - Partition key: `vehicleNumber` (String)

#### Table 4: fines

- **Table name**: `fines`
- **Partition key**: `id` (String)
- **GSI**: `vehicleNumber-index` with partition key `vehicleNumber` (String)

#### Table 5: parkingZones

- **Table name**: `parkingZones`
- **Partition key**: `zoneCode` (String)

#### Table 6: demoUsers

- **Table name**: `demoUsers`
- **Partition key**: `nicNumber` (String)

#### Table 7: vehicleOwners

- **Table name**: `vehicleOwners`
- **Partition key**: `vehicleNumber` (String)

#### Table 8: paymentReceipts

- **Table name**: `paymentReceipts`
- **Partition key**: `id` (String)

---

## 🌐 Step 2: Create API Gateway with Lambda

### 2.1 Create Lambda Function

1. Go to **AWS Lambda** console
2. Click **Create function**
3. Choose **Author from scratch**
4. Configuration:
   - **Function name**: `parking-system-api`
   - **Runtime**: Node.js 20.x
   - **Architecture**: x86_64
   - **Permissions**: Create a new role with DynamoDB permissions

### 2.2 Lambda Function Code

Create `index.js` in Lambda:

```javascript
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log("Event:", JSON.stringify(event));

  const path = event.path;
  const method = event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    let response;

    switch (path) {
      case "/query":
        response = await queryTable(body);
        break;
      case "/get-item":
        response = await getItem(body);
        break;
      case "/put-item":
        response = await putItem(body);
        break;
      case "/update-item":
        response = await updateItem(body);
        break;
      case "/delete-item":
        response = await deleteItem(body);
        break;
      case "/scan":
        response = await scanTable(body);
        break;
      default:
        response = { error: "Invalid endpoint" };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

async function getItem(params) {
  const result = await dynamodb
    .get({
      TableName: params.tableName,
      Key: params.key,
    })
    .promise();
  return { Item: result.Item };
}

async function putItem(params) {
  await dynamodb
    .put({
      TableName: params.tableName,
      Item: params.item,
    })
    .promise();
  return { success: true };
}

async function updateItem(params) {
  const updateExpression = [];
  const expressionAttributeValues = {};
  const expressionAttributeNames = {};

  Object.keys(params.updates).forEach((key, index) => {
    const placeholder = `:val${index}`;
    const namePlaceholder = `#attr${index}`;
    updateExpression.push(`${namePlaceholder} = ${placeholder}`);
    expressionAttributeValues[placeholder] = params.updates[key];
    expressionAttributeNames[namePlaceholder] = key;
  });

  await dynamodb
    .update({
      TableName: params.tableName,
      Key: params.key,
      UpdateExpression: `SET ${updateExpression.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
    })
    .promise();

  return { success: true };
}

async function deleteItem(params) {
  await dynamodb
    .delete({
      TableName: params.tableName,
      Key: params.key,
    })
    .promise();
  return { success: true };
}

async function queryTable(params) {
  const result = await dynamodb
    .query({
      TableName: params.tableName,
      ...params,
    })
    .promise();
  return { Items: result.Items };
}

async function scanTable(params) {
  const scanParams = {
    TableName: params.tableName,
  };

  if (params.filters) {
    const filterExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    Object.keys(params.filters).forEach((key, index) => {
      const placeholder = `:val${index}`;
      const namePlaceholder = `#attr${index}`;
      filterExpression.push(`${namePlaceholder} = ${placeholder}`);
      expressionAttributeValues[placeholder] = params.filters[key];
      expressionAttributeNames[namePlaceholder] = key;
    });

    scanParams.FilterExpression = filterExpression.join(" AND ");
    scanParams.ExpressionAttributeValues = expressionAttributeValues;
    scanParams.ExpressionAttributeNames = expressionAttributeNames;
  }

  const result = await dynamodb.scan(scanParams).promise();
  return { Items: result.Items };
}
```

### 2.3 Add DynamoDB Permissions to Lambda

1. Go to **IAM** > **Roles**
2. Find the Lambda execution role
3. Attach policy: `AmazonDynamoDBFullAccess`

### 2.4 Create API Gateway

1. Go to **API Gateway** console
2. Click **Create API** > **REST API** > **Build**
3. Configuration:

   - **API name**: `parking-system-api`
   - **Endpoint type**: Regional

4. Create Resources:

   - `/query` (POST)
   - `/get-item` (POST)
   - `/put-item` (POST)
   - `/update-item` (POST)
   - `/delete-item` (DELETE)
   - `/scan` (POST)

5. For each resource:

   - Create **POST** method (or DELETE for delete-item)
   - **Integration type**: Lambda Function
   - Select your `parking-system-api` Lambda function
   - Enable **Lambda Proxy integration**

6. Enable CORS:

   - Select each resource
   - Actions > Enable CORS
   - Click **Enable CORS and replace existing CORS headers**

7. Deploy API:
   - Actions > Deploy API
   - **Deployment stage**: prod
   - Copy the **Invoke URL** (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com/prod`)

---

## 📦 Step 3: Create S3 Bucket (for file storage)

1. Go to **S3** console
2. Click **Create bucket**
3. Configuration:

   - **Bucket name**: `parkmate-storage` (must be globally unique)
   - **Region**: us-east-1
   - **Block all public access**: Uncheck (for public receipts)
   - **Bucket Versioning**: Disabled
   - **Encryption**: Enable (default)

4. Set up CORS:
   - Go to bucket > **Permissions** > **CORS**
   - Add:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

---

## 🔐 Step 4: Update App Configuration

### 4.1 Update `app.json`

Replace the AWS configuration values in `app.json`:

```json
{
  "extra": {
    "AWS_REGION": "us-east-1",
    "AWS_USER_POOL_ID": "us-east-1_XXXXXXX",
    "AWS_USER_POOL_CLIENT_ID": "your-client-id",
    "AWS_IDENTITY_POOL_ID": "us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "AWS_API_GATEWAY_URL": "https://abc123.execute-api.us-east-1.amazonaws.com/prod",
    "AWS_S3_BUCKET": "parkmate-storage"
  }
}
```

### 4.2 Create `.env` file (optional)

```env
AWS_REGION=us-east-1
AWS_API_GATEWAY_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
AWS_S3_BUCKET=parkmate-storage
```

---

## 📲 Step 5: Install Dependencies & Run

### 5.1 Remove Firebase and Install Dependencies

```bash
# Remove node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Install dependencies
npm install

# Or use yarn
yarn install
```

### 5.2 Start the Development Server

```bash
# Start Expo
npm start

# Or
npx expo start
```

### 5.3 Run on Device

```bash
# Android
npm run android

# iOS
npm run ios
```

---

## 🧪 Step 6: Initialize Demo Data

Run this once to populate demo data:

```javascript
// In your app, call this once
import awsDemoService from "./app/services/awsDemoService";

awsDemoService
  .initializeDemoData()
  .then(() => console.log("Demo data initialized"))
  .catch((error) => console.error("Error:", error));
```

---

## 💰 Cost Estimation (AWS Free Tier)

| Service     | Free Tier                                 | Your Usage  | Cost         |
| ----------- | ----------------------------------------- | ----------- | ------------ |
| DynamoDB    | 25 GB storage, 25 WCU, 25 RCU             | ~1 GB       | **FREE**     |
| API Gateway | 1M requests/month (12 months)             | ~50K/month  | **FREE**     |
| Lambda      | 1M requests/month, 400K GB-seconds        | ~100K/month | **FREE**     |
| S3          | 5 GB storage, 20K GET, 2K PUT (12 months) | ~2 GB       | **FREE**     |
| **TOTAL**   |                                           |             | **$0/month** |

---

## 🔧 Troubleshooting

### Issue: API Gateway returns 403

**Solution**: Check Lambda permissions and ensure API Gateway has permission to invoke Lambda.

### Issue: CORS errors

**Solution**: Enable CORS on all API Gateway methods and add appropriate headers.

### Issue: DynamoDB access denied

**Solution**: Verify Lambda execution role has DynamoDB permissions.

### Issue: App can't connect to API

**Solution**: Check `AWS_API_GATEWAY_URL` in `app.json` is correct and includes `/prod` stage.

---

## 🚀 Deployment to AWS Amplify (Hosting)

### Option 1: AWS Amplify Hosting (for Expo web)

```bash
# Build for web
npx expo export:web

# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Publish
amplify publish
```

### Option 2: AWS S3 Static Website

```bash
# Build for web
npx expo export:web

# Upload to S3
aws s3 sync dist/ s3://parkmate-storage/web --acl public-read
```

---

## 📱 Build for Production

### Android APK

```bash
npx expo build:android
```

### iOS IPA

```bash
npx expo build:ios
```

---

## 🎉 Migration Complete!

Your app is now running on AWS with:

- ✅ DynamoDB (database)
- ✅ API Gateway + Lambda (backend)
- ✅ S3 (file storage)
- ✅ No Firebase dependencies
- ✅ 100% Free Tier eligible

---

## 📚 Additional Resources

- [AWS Free Tier](https://aws.amazon.com/free/)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [API Gateway Guide](https://docs.aws.amazon.com/apigateway/)
- [Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [Expo Documentation](https://docs.expo.dev/)

---

## 🆘 Support

For issues or questions:

1. Check AWS CloudWatch Logs for Lambda errors
2. Review DynamoDB metrics in AWS Console
3. Test API Gateway endpoints using Postman
4. Check Expo error logs: `npx expo start --clear`

**Happy Coding! 🎉**
