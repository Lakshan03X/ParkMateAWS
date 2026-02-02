# Variables
$Region = "us-east-1"
$ApiName = "parkmate-api"

# Get AWS Account ID
$AWSAccountId = (aws sts get-caller-identity --query Account --output text).Trim()

# 1. Create REST API
Write-Host "Creating REST API..."
$ApiId = (aws apigateway create-rest-api --name $ApiName --description "ParkMate Mobile App API" --region $Region --query 'id' --output text).Trim()
Write-Host "API ID: $ApiId"

# 2. Get Root Resource ID
$RootId = (aws apigateway get-resources --rest-api-id $ApiId --region $Region --query 'items[0].id' --output text).Trim()
Write-Host "Root Resource ID: $RootId"

# 3. Create Proxy Resource
Write-Host "Creating proxy resource..."
$ResourceId = (aws apigateway create-resource --rest-api-id $ApiId --parent-id $RootId --path-part "{proxy+}" --region $Region --query 'id' --output text).Trim()
Write-Host "Proxy Resource ID: $ResourceId"

# 4. Create ANY Method on Proxy Resource
Write-Host "Creating ANY method..."
aws apigateway put-method --rest-api-id $ApiId --resource-id $ResourceId --http-method ANY --authorization-type NONE --region $Region

# 5. Setup Lambda Integration
$LambdaArn = "arn:aws:lambda:${Region}:${AWSAccountId}:function:parkmate-api"
Write-Host "Setting up Lambda integration with ARN: $LambdaArn"

# ... 

# 6. Grant API Gateway permission to invoke Lambda
Write-Host "Adding permission for API Gateway to invoke Lambda..."
$SourceArn = "arn:aws:execute-api:${Region}:${AWSAccountId}:${ApiId}/*/*"
aws lambda add-permission `
  --function-name "parkmate-api" `
  --statement-id "apigateway-invoke" `
  --action "lambda:InvokeFunction" `
  --principal "apigateway.amazonaws.com" `
  --source-arn $SourceArn `
  --region $Region

# 7. Deploy API
Write-Host "Deploying API..."
aws apigateway create-deployment --rest-api-id $ApiId --stage-name prod --region $Region

# 8. Show API endpoint
$ApiEndpoint = "https://$ApiId.execute-api.$Region.amazonaws.com/prod"
Write-Host "✅ API Gateway deployed!"
Write-Host "API Gateway Endpoint: $ApiEndpoint"
