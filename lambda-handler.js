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

    if (method === "OPTIONS") return { statusCode: 200, headers, body: "" };

    if (path === "/put-item") {
      await dynamodb
        .put({ TableName: body.tableName, Item: body.item })
        .promise();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    if (path === "/get-item") {
      const result = await dynamodb
        .get({ TableName: body.tableName, Key: body.key })
        .promise();
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    if (path === "/upload") {
      const buffer = Buffer.from(body.data, "base64");
      await s3
        .putObject({
          Bucket: process.env.S3_BUCKET,
          Key: body.key,
          Body: buffer,
          ContentType: body.contentType,
          ACL: "public-read",
        })
        .promise();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${body.key}`,
        }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Route not found" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
