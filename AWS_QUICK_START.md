# AWS Quick Start - 5 Minute Setup

## ⚡ Fastest Way to Get Started

### 1️⃣ Create AWS Account (2 minutes)

- Go to https://aws.amazon.com/free/
- Sign up for free tier account

### 2️⃣ Set Up DynamoDB Tables (2 minutes)

Go to AWS Console > DynamoDB > Create table (repeat for each):

```
Table 1: users (Partition key: nicNumber)
Table 2: inspectors (Partition key: inspectorId)
Table 3: parkingTickets (Partition key: ticketId)
Table 4: fines (Partition key: id)
Table 5: parkingZones (Partition key: zoneCode)
Table 6: demoUsers (Partition key: nicNumber)
Table 7: vehicleOwners (Partition key: vehicleNumber)
Table 8: paymentReceipts (Partition key: id)
```

### 3️⃣ Deploy Lambda + API Gateway (5 minutes)

**A. Create Lambda Function:**

- AWS Console > Lambda > Create function
- Name: `parking-system-api`
- Runtime: Node.js 20.x
- Copy code from AWS_DEPLOYMENT_GUIDE.md (Step 2.2)
- Add DynamoDB permissions to the role

**B. Create API Gateway:**

- AWS Console > API Gateway > Create REST API
- Create resources: `/query`, `/get-item`, `/put-item`, `/update-item`, `/delete-item`, `/scan`
- Link all to Lambda function
- Deploy to `prod` stage
- **Copy the Invoke URL**

### 4️⃣ Create S3 Bucket (1 minute)

- AWS Console > S3 > Create bucket
- Name: `parkmate-storage-[your-unique-id]`
- Region: us-east-1
- Uncheck "Block all public access"

### 5️⃣ Update App Configuration (1 minute)

Edit `app.json`:

```json
"extra": {
  "AWS_REGION": "us-east-1",
  "AWS_API_GATEWAY_URL": "https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod",
  "AWS_S3_BUCKET": "parkmate-storage-your-unique-id"
}
```

### 6️⃣ Install & Run (2 minutes)

```powershell
# Remove old dependencies
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force

# Install
npm install

# Run
npm start
```

## ✅ Done! Your app is now on AWS!

### Test It:

1. Open the app
2. Try logging in as inspector
3. Check DynamoDB tables for data

### Verify:

- ✅ No Firebase errors
- ✅ DynamoDB tables showing data
- ✅ API Gateway receiving requests
- ✅ Lambda function executing

---

## 🆘 Quick Fixes

**Problem**: App shows "Network Error"
**Fix**: Check `AWS_API_GATEWAY_URL` in app.json is correct

**Problem**: "Access Denied" errors  
**Fix**: Add DynamoDB permissions to Lambda role

**Problem**: CORS errors
**Fix**: Enable CORS on all API Gateway methods

---

## 💰 Cost: $0/month (Free Tier)

All services used are within AWS Free Tier limits!

---

## 📖 Need More Details?

See full guide: [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)
