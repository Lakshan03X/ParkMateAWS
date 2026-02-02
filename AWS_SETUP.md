# AWS Setup Guide for ParkMate

## 📋 Prerequisites

- AWS Account (Free Tier)
- Node.js installed
- AWS CLI installed and configured

## 🚀 Step 1: Create DynamoDB Tables

### 1.1 Create Users Table

```bash
aws dynamodb create-table \
  --table-name parkmate-users \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=nicNumber,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --global-secondary-indexes \
    "[{\"IndexName\":\"nicNumber-index\",\"KeySchema\":[{\"AttributeName\":\"nicNumber\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}]" \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

### 1.2 Create Parking Zones Table

```bash
aws dynamodb create-table \
  --table-name parkmate-parking-zones \
  --attribute-definitions AttributeName=zoneId,AttributeType=S \
  --key-schema AttributeName=zoneId,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

### 1.3 Create Parking Tickets Table

```bash
aws dynamodb create-table \
  --table-name parkmate-parking-tickets \
  --attribute-definitions \
    AttributeName=ticketId,AttributeType=S \
    AttributeName=vehicleNumber,AttributeType=S \
  --key-schema AttributeName=ticketId,KeyType=HASH \
  --global-secondary-indexes \
    "[{\"IndexName\":\"vehicleNumber-index\",\"KeySchema\":[{\"AttributeName\":\"vehicleNumber\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}]" \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

### 1.4 Create Fines Table

```bash
aws dynamodb create-table \
  --table-name parkmate-fines \
  --attribute-definitions \
    AttributeName=fineId,AttributeType=S \
    AttributeName=vehicleNumber,AttributeType=S \
  --key-schema AttributeName=fineId,KeyType=HASH \
  --global-secondary-indexes \
    "[{\"IndexName\":\"vehicleNumber-index\",\"KeySchema\":[{\"AttributeName\":\"vehicleNumber\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}]" \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

### 1.5 Create Vehicles Table

```bash
aws dynamodb create-table \
  --table-name parkmate-vehicles \
  --attribute-definitions \
    AttributeName=vehicleNumber,AttributeType=S \
    AttributeName=ownerId,AttributeType=S \
  --key-schema AttributeName=vehicleNumber,KeyType=HASH \
  --global-secondary-indexes \
    "[{\"IndexName\":\"ownerId-index\",\"KeySchema\":[{\"AttributeName\":\"ownerId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}]" \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

### 1.6 Create Receipts Table

```bash
aws dynamodb create-table \
  --table-name parkmate-receipts \
  --attribute-definitions AttributeName=receiptId,AttributeType=S \
  --key-schema AttributeName=receiptId,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

### 1.7 Create NIC Records Table

```bash
aws dynamodb create-table \
  --table-name parkmate-nic-records \
  --attribute-definitions AttributeName=nicNumber,AttributeType=S \
  --key-schema AttributeName=nicNumber,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

## 🗄️ Step 2: Create S3 Bucket

```bash
aws s3 mb s3://parkmate-uploads --region us-east-1

aws s3api put-bucket-cors --bucket parkmate-uploads --cors-configuration '{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }]
}'

aws s3api put-public-access-block \
  --bucket parkmate-uploads \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

## ⚡ Step 3: Create Lambda Function

### 3.1 Create IAM Role for Lambda

```bash
aws iam create-role --role-name parkmate-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy \
  --role-name parkmate-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
  --role-name parkmate-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

aws iam attach-role-policy \
  --role-name parkmate-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

### 3.2 Create Lambda Function Code

Create a file `lambda-handler.js`:

```javascript
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };

  try {
    const body = JSON.parse(event.body || "{}");
    const path = event.path;
    const method = event.httpMethod;

    // Handle OPTIONS for CORS
    if (method === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }

    // DynamoDB Operations
    if (path === "/query") {
      const params = {
        TableName: body.tableName,
        ...body.params,
      };
      const result = await dynamodb.query(params).promise();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }

    if (path === "/get-item") {
      const params = {
        TableName: body.tableName,
        Key: body.key,
      };
      const result = await dynamodb.get(params).promise();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }

    if (path === "/put-item") {
      const params = {
        TableName: body.tableName,
        Item: body.item,
      };
      await dynamodb.put(params).promise();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    if (path === "/update-item") {
      const params = {
        TableName: body.tableName,
        Key: body.key,
        ...body.params,
      };
      await dynamodb.update(params).promise();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    if (path === "/delete-item") {
      const params = {
        TableName: body.tableName,
        Key: body.key,
      };
      await dynamodb.delete(params).promise();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    if (path === "/scan") {
      const params = {
        TableName: body.tableName,
        ...body.params,
      };
      const result = await dynamodb.scan(params).promise();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }

    // S3 Upload Operation
    if (path === "/upload") {
      const { key, contentType, data } = body;
      const buffer = Buffer.from(data, "base64");

      const uploadParams = {
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: "public-read",
      };

      await s3.putObject(uploadParams).promise();

      const url = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ url }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Route not found" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

### 3.3 Deploy Lambda Function

```bash
# Create deployment package
zip lambda-function.zip lambda-handler.js

# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create Lambda function
aws lambda create-function \
  --function-name parkmate-api \
  --runtime nodejs18.x \
  --role arn:aws:iam::${AWS_ACCOUNT_ID}:role/parkmate-lambda-role \
  --handler lambda-handler.handler \
  --zip-file fileb://lambda-function.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{S3_BUCKET=parkmate-uploads}" \
  --region us-east-1
```

## 🌐 Step 4: Create API Gateway

### 4.1 Create REST API

```bash
API_ID=$(aws apigateway create-rest-api \
  --name "parkmate-api" \
  --description "ParkMate Mobile App API" \
  --region us-east-1 \
  --query 'id' \
  --output text)

echo "API ID: $API_ID"

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --region us-east-1 \
  --query 'items[0].id' \
  --output text)

# Create proxy resource
RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part "{proxy+}" \
  --region us-east-1 \
  --query 'id' \
  --output text)

# Create ANY method
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method ANY \
  --authorization-type NONE \
  --region us-east-1

# Get Lambda ARN
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
LAMBDA_ARN="arn:aws:lambda:us-east-1:${AWS_ACCOUNT_ID}:function:parkmate-api"

# Set up Lambda integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method ANY \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" \
  --region us-east-1

# Grant API Gateway permission to invoke Lambda
aws lambda add-permission \
  --function-name parkmate-api \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:${AWS_ACCOUNT_ID}:${API_ID}/*/*" \
  --region us-east-1

# Deploy API
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region us-east-1

# Get API endpoint
API_ENDPOINT="https://${API_ID}.execute-api.us-east-1.amazonaws.com/prod"
echo "API Gateway Endpoint: $API_ENDPOINT"
```

## 📱 Step 5: Update App Configuration

Update your `app.json`:

```json
{
  "expo": {
    "extra": {
      "AWS_REGION": "us-east-1",
      "AWS_API_GATEWAY_URL": "YOUR_API_ENDPOINT_HERE",
      "AWS_S3_BUCKET": "parkmate-uploads"
    }
  }
}
```

## ✅ Step 6: Verify Setup

Create a test file `test-aws.js`:

```javascript
const axios = require("axios");

const API_URL = "YOUR_API_ENDPOINT_HERE";

async function testAWS() {
  try {
    // Test adding an item
    console.log("Testing DynamoDB...");
    const result = await axios.post(`${API_URL}/put-item`, {
      tableName: "parkmate-users",
      item: {
        userId: "TEST_USER_123",
        nicNumber: "123456789012",
        fullName: "Test User",
        email: "test@example.com",
        role: "vehicle_owner",
        createdAt: new Date().toISOString(),
        verified: false,
      },
    });

    console.log("✅ DynamoDB test successful!");
    console.log(result.data);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testAWS();
```

Run the test:

```bash
node test-aws.js
```

## 🎉 Done!

Your AWS backend is now ready. Start your app:

```bash
npx expo start
```

## 💰 Cost Monitoring

AWS Free Tier includes:

- DynamoDB: 25GB storage, 25 read/write units
- Lambda: 1M requests/month
- S3: 5GB storage, 20K GET requests
- API Gateway: 1M requests/month

Monitor your usage in AWS Console → Billing Dashboard

## 🔒 Security Best Practices

1. Enable AWS CloudWatch for monitoring
2. Set up billing alerts
3. Use IAM roles with minimal permissions
4. Enable API Gateway throttling
5. Use environment variables for sensitive data

## 📞 Support

For issues or questions, check:

- AWS Documentation: https://docs.aws.amazon.com
- Expo Documentation: https://docs.expo.dev
