# 🚀 AWS Deployment Checklist

## Complete Step-by-Step Setup Guide

Use this checklist to ensure you've completed all steps for AWS deployment.

---

## Phase 1: AWS Account Setup ✅

- [ ] Create AWS Free Tier account at https://aws.amazon.com/free/
- [ ] Verify email address
- [ ] Set up billing alerts (optional but recommended)
- [ ] Choose region: **us-east-1** (required for free tier)

---

## Phase 2: DynamoDB Tables Creation ✅

Create these 8 tables in DynamoDB:

### Table 1: users

- [ ] Table name: `users`
- [ ] Partition key: `nicNumber` (String)
- [ ] Capacity: On-demand
- [ ] Status: Active

### Table 2: inspectors

- [ ] Table name: `inspectors`
- [ ] Partition key: `inspectorId` (String)
- [ ] Capacity: On-demand
- [ ] Status: Active

### Table 3: parkingTickets

- [ ] Table name: `parkingTickets`
- [ ] Partition key: `ticketId` (String)
- [ ] GSI: `vehicleNumber-index` with key `vehicleNumber`
- [ ] Capacity: On-demand
- [ ] Status: Active

### Table 4: fines

- [ ] Table name: `fines`
- [ ] Partition key: `id` (String)
- [ ] GSI: `vehicleNumber-index` with key `vehicleNumber`
- [ ] Capacity: On-demand
- [ ] Status: Active

### Table 5: parkingZones

- [ ] Table name: `parkingZones`
- [ ] Partition key: `zoneCode` (String)
- [ ] Capacity: On-demand
- [ ] Status: Active

### Table 6: demoUsers

- [ ] Table name: `demoUsers`
- [ ] Partition key: `nicNumber` (String)
- [ ] Capacity: On-demand
- [ ] Status: Active

### Table 7: vehicleOwners

- [ ] Table name: `vehicleOwners`
- [ ] Partition key: `vehicleNumber` (String)
- [ ] Capacity: On-demand
- [ ] Status: Active

### Table 8: paymentReceipts

- [ ] Table name: `paymentReceipts`
- [ ] Partition key: `id` (String)
- [ ] Capacity: On-demand
- [ ] Status: Active

---

## Phase 3: Lambda Function Setup ✅

- [ ] Go to AWS Lambda console
- [ ] Click "Create function"
- [ ] Function name: `parking-system-api`
- [ ] Runtime: Node.js 20.x
- [ ] Create new execution role
- [ ] Copy code from `lambda-function.js`
- [ ] Deploy the function
- [ ] Test with sample event

### Add Permissions

- [ ] Go to IAM > Roles
- [ ] Find Lambda execution role
- [ ] Attach policy: `AmazonDynamoDBFullAccess`
- [ ] Save changes

---

## Phase 4: API Gateway Setup ✅

### Create API

- [ ] Go to API Gateway console
- [ ] Create new REST API
- [ ] API name: `parking-system-api`
- [ ] Endpoint type: Regional

### Create Resources

- [ ] Create resource: `/query` (POST)
- [ ] Create resource: `/get-item` (POST)
- [ ] Create resource: `/put-item` (POST)
- [ ] Create resource: `/update-item` (POST)
- [ ] Create resource: `/delete-item` (DELETE)
- [ ] Create resource: `/scan` (POST)
- [ ] Create resource: `/health` (GET)

### Configure Methods

For each resource:

- [ ] Integration type: Lambda Function
- [ ] Select `parking-system-api` function
- [ ] Enable Lambda Proxy integration
- [ ] Grant API Gateway permission to invoke Lambda

### Enable CORS

- [ ] Select each resource
- [ ] Actions > Enable CORS
- [ ] Keep default settings
- [ ] Click "Enable CORS"

### Deploy API

- [ ] Actions > Deploy API
- [ ] Deployment stage: `prod`
- [ ] Click "Deploy"
- [ ] **Copy Invoke URL** (e.g., https://abc123.execute-api.us-east-1.amazonaws.com/prod)

---

## Phase 5: S3 Bucket Setup ✅

- [ ] Go to S3 console
- [ ] Click "Create bucket"
- [ ] Bucket name: `parkmate-storage-[unique-id]` (must be globally unique)
- [ ] Region: us-east-1
- [ ] Uncheck "Block all public access"
- [ ] Acknowledge warning
- [ ] Create bucket

### Configure CORS

- [ ] Go to bucket > Permissions > CORS
- [ ] Add CORS configuration (see AWS_DEPLOYMENT_GUIDE.md)
- [ ] Save changes

---

## Phase 6: App Configuration ✅

### Update app.json

- [ ] Open `app.json`
- [ ] Find `extra` section
- [ ] Update `AWS_REGION` to `us-east-1`
- [ ] Update `AWS_API_GATEWAY_URL` with your Invoke URL
- [ ] Update `AWS_S3_BUCKET` with your bucket name
- [ ] Save file

Example:

```json
{
  "extra": {
    "AWS_REGION": "us-east-1",
    "AWS_API_GATEWAY_URL": "https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod",
    "AWS_S3_BUCKET": "parkmate-storage-12345"
  }
}
```

---

## Phase 7: Install Dependencies ✅

- [ ] Open terminal in project directory
- [ ] Run: `Remove-Item node_modules -Recurse -Force`
- [ ] Run: `Remove-Item package-lock.json -Force`
- [ ] Run: `npm install`
- [ ] Wait for installation to complete
- [ ] Check for any errors

---

## Phase 8: Initialize Demo Data ✅

- [ ] Start the app: `npm start`
- [ ] Open app in Expo Go or emulator
- [ ] In app console, run initialization script
- [ ] Verify demo users are created in DynamoDB
- [ ] Check `demoUsers` table has 6 entries

---

## Phase 9: Testing ✅

### Test Inspector Login

- [ ] Open app
- [ ] Navigate to Inspector Login
- [ ] Try Employee ID: `INS001`
- [ ] Try Mobile: Any valid mobile
- [ ] Verify login works

### Test Parking Ticket

- [ ] Create new parking ticket
- [ ] Enter vehicle number
- [ ] Select parking zone
- [ ] Select duration
- [ ] Verify ticket is created
- [ ] Check DynamoDB `parkingTickets` table

### Test Fine Checker

- [ ] Enter vehicle number
- [ ] Check for fines
- [ ] Verify fine search works

### Test Payment

- [ ] Select a ticket
- [ ] Initiate payment
- [ ] Complete payment flow
- [ ] Verify receipt generation

---

## Phase 10: Monitoring Setup ✅

### CloudWatch

- [ ] Go to CloudWatch console
- [ ] Check Lambda function logs
- [ ] Verify API Gateway logs
- [ ] Set up alarms (optional)

### DynamoDB Metrics

- [ ] Go to DynamoDB console
- [ ] Select each table
- [ ] Check Metrics tab
- [ ] Verify read/write activity

---

## Phase 11: Service Files Update ✅

### Already Updated

- ✅ `awsConfig.ts` - AWS configuration
- ✅ `awsDynamoService.ts` - DynamoDB service
- ✅ `awsDemoService.ts` - Demo service
- ✅ `apiService.ts` - API service
- ✅ `inspectorService.ts` - Inspector service

### Need Manual Update

- [ ] `fineCheckerService.ts`
- [ ] `vehicleOwnerService.ts`
- [ ] `parkingZoneService.ts`
- [ ] `parkingTicketService.ts`
- [ ] `mcOfficerService.ts`

**Tip**: Use `inspectorService.ts` as a reference!

---

## Phase 12: Production Readiness ✅

### Security

- [ ] Enable API Gateway API keys
- [ ] Set up usage plans
- [ ] Configure rate limiting
- [ ] Enable DynamoDB encryption
- [ ] Review IAM permissions

### Performance

- [ ] Enable DynamoDB auto-scaling (optional)
- [ ] Set up CloudFront for S3 (optional)
- [ ] Configure Lambda reserved concurrency (optional)

### Backup

- [ ] Enable DynamoDB point-in-time recovery
- [ ] Set up S3 versioning
- [ ] Configure automated backups

---

## Verification Checklist ✅

- [ ] App starts without errors
- [ ] No "Firebase not found" errors
- [ ] Inspector login works
- [ ] Parking tickets can be created
- [ ] Fine checker works
- [ ] Payments process successfully
- [ ] Receipts generate correctly
- [ ] All UI screens load properly
- [ ] No console errors in app
- [ ] CloudWatch logs show successful requests

---

## Cost Verification ✅

Verify you're within free tier limits:

- [ ] DynamoDB: < 25 GB storage
- [ ] API Gateway: < 1M requests/month
- [ ] Lambda: < 1M requests/month
- [ ] S3: < 5 GB storage
- [ ] Check AWS Billing Dashboard shows $0

---

## Documentation Review ✅

- [ ] Read [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)
- [ ] Read [AWS_QUICK_START.md](AWS_QUICK_START.md)
- [ ] Read [MIGRATION_COMPLETE.md](MIGRATION_COMPLETE.md)
- [ ] Bookmark AWS Console URLs
- [ ] Save Lambda function code
- [ ] Save API Gateway URL

---

## 🎉 Deployment Complete!

Once all items are checked:

✅ Your app is fully migrated to AWS  
✅ All Firebase dependencies removed  
✅ Running on 100% free tier  
✅ Production ready  
✅ Scalable architecture

---

## 🆘 Troubleshooting

If something doesn't work:

1. **Check CloudWatch Logs**
   - Go to CloudWatch > Log groups > `/aws/lambda/parking-system-api`
   - Review recent errors

2. **Verify Configuration**
   - Double-check `app.json` values
   - Ensure API Gateway URL includes `/prod`
   - Verify table names match

3. **Test Endpoints**
   - Use Postman to test API Gateway endpoints
   - Verify Lambda function responds

4. **Check Permissions**
   - Verify Lambda has DynamoDB access
   - Check API Gateway can invoke Lambda

---

## 📊 Success Metrics

Track these metrics:

- API Gateway requests: < 1M/month (free tier)
- Lambda invocations: < 1M/month (free tier)
- DynamoDB storage: < 25 GB (free tier)
- S3 storage: < 5 GB (free tier)
- Monthly cost: $0

---

**Congratulations! Your parking system is now running on AWS! 🚀**

_Last updated: ${new Date().toLocaleDateString()}_
