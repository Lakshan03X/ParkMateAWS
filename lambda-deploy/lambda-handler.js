// AWS SDK v3 is available in Node.js 18+ runtime by default
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const dynamodb = DynamoDBDocumentClient.from(client);
const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };

  try {
    const body = JSON.parse(event.body || "{}");
    const path = event.path || event.resource;
    const method = event.httpMethod;

    // Log for debugging
    console.log("Received request:", { path, method, resource: event.resource });

    if (method === "OPTIONS") return { statusCode: 200, headers, body: "" };

    if (path === "/put-item") {
      console.log("PUT_ITEM request:", JSON.stringify({ tableName: body.tableName, itemKeys: Object.keys(body.item || {}) }));
      await dynamodb.send(new PutCommand({
        TableName: body.tableName,
        Item: body.item
      }));
      console.log("PUT_ITEM success");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    if (path === "/get-item") {
      console.log("GET_ITEM request:", JSON.stringify({ tableName: body.tableName, key: body.key }));
      const result = await dynamodb.send(new GetCommand({
        TableName: body.tableName,
        Key: body.key
      }));
      console.log("GET_ITEM success:", !!result.Item);
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    if (path === "/upload") {
      const buffer = Buffer.from(body.data, "base64");
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: body.key,
        Body: buffer,
        ContentType: body.contentType,
        ACL: "public-read",
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${body.key}`,
        }),
      };
    }

    if (path === "/query") {
      const result = await dynamodb.send(new QueryCommand({
        TableName: body.tableName,
        ...body
      }));
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    if (path === "/update-item") {
      // Convert simple updates object to DynamoDB UpdateExpression format
      const updates = body.updates || {};
      const updateExpressionParts = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};

      Object.keys(updates).forEach((key, index) => {
        const placeholder = `#attr${index}`;
        const valuePlaceholder = `:val${index}`;
        updateExpressionParts.push(`${placeholder} = ${valuePlaceholder}`);
        expressionAttributeNames[placeholder] = key;
        expressionAttributeValues[valuePlaceholder] = updates[key];
      });

      const updateExpression = `SET ${updateExpressionParts.join(", ")}`;

      await dynamodb.send(new UpdateCommand({
        TableName: body.tableName,
        Key: body.key,
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      }));
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    if (path === "/delete-item") {
      await dynamodb.send(new DeleteCommand({
        TableName: body.tableName,
        Key: body.key
      }));
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    if (path === "/scan") {
      console.log("SCAN request:", JSON.stringify({ tableName: body.tableName }));
      const result = await dynamodb.send(new ScanCommand({
        TableName: body.tableName,
        ...(body.filters || {})
      }));
      console.log("SCAN success:", result.Items?.length || 0, "items");
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    // Log available routes for debugging
    console.log("Route not found:", path, "Available routes: /put-item, /get-item, /upload, /query, /scan, /update-item, /delete-item");

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Route not found", path, availableRoutes: ["/put-item", "/get-item", "/upload", "/query", "/scan", "/update-item", "/delete-item"] }),
    };
  } catch (err) {
    console.error("Error processing request:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
