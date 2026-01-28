import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra || {};

const {
  AWS_REGION,
  AWS_USER_POOL_ID,
  AWS_USER_POOL_CLIENT_ID,
  AWS_IDENTITY_POOL_ID,
  AWS_API_GATEWAY_URL,
  AWS_S3_BUCKET,
} = extra;

export const awsConfig = {
  region: AWS_REGION || "us-east-1",
  userPoolId: AWS_USER_POOL_ID || "",
  userPoolClientId: AWS_USER_POOL_CLIENT_ID || "",
  identityPoolId: AWS_IDENTITY_POOL_ID || "",
  apiGatewayUrl: AWS_API_GATEWAY_URL || "",
  s3Bucket: AWS_S3_BUCKET || "",
};

export default awsConfig;
