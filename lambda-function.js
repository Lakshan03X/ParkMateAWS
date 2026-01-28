// AWS Lambda Function for Parking System API
// Deploy this code to your Lambda function

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event));
    
    // Handle OPTIONS for CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: ''
        };
    }
    
    const path = event.path;
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    
    try {
        let response;
        
        switch (path) {
            case '/query':
                response = await queryTable(body);
                break;
            case '/get-item':
                response = await getItem(body);
                break;
            case '/put-item':
                response = await putItem(body);
                break;
            case '/update-item':
                response = await updateItem(body);
                break;
            case '/delete-item':
                response = await deleteItem(body);
                break;
            case '/scan':
                response = await scanTable(body);
                break;
            case '/health':
                response = { status: 'healthy', timestamp: new Date().toISOString() };
                break;
            default:
                response = { error: 'Invalid endpoint', path };
        }
        
        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify(response)
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({ 
                error: error.message,
                details: error.toString()
            })
        };
    }
};

function getCorsHeaders() {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
    };
}

async function getItem(params) {
    try {
        console.log('Getting item:', params);
        const result = await dynamodb.get({
            TableName: params.tableName,
            Key: params.key
        }).promise();
        
        console.log('Get result:', result);
        return { Item: result.Item };
    } catch (error) {
        console.error('getItem error:', error);
        throw error;
    }
}

async function putItem(params) {
    try {
        console.log('Putting item:', params);
        await dynamodb.put({
            TableName: params.tableName,
            Item: params.item
        }).promise();
        
        return { success: true };
    } catch (error) {
        console.error('putItem error:', error);
        throw error;
    }
}

async function updateItem(params) {
    try {
        console.log('Updating item:', params);
        
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
        
        await dynamodb.update({
            TableName: params.tableName,
            Key: params.key,
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeValues: expressionAttributeValues,
            ExpressionAttributeNames: expressionAttributeNames
        }).promise();
        
        return { success: true };
    } catch (error) {
        console.error('updateItem error:', error);
        throw error;
    }
}

async function deleteItem(params) {
    try {
        console.log('Deleting item:', params);
        await dynamodb.delete({
            TableName: params.tableName,
            Key: params.key
        }).promise();
        
        return { success: true };
    } catch (error) {
        console.error('deleteItem error:', error);
        throw error;
    }
}

async function queryTable(params) {
    try {
        console.log('Querying table:', params);
        
        const queryParams = {
            TableName: params.tableName
        };
        
        // Add key condition expression if provided
        if (params.KeyConditionExpression) {
            queryParams.KeyConditionExpression = params.KeyConditionExpression;
        }
        
        // Add expression attribute values if provided
        if (params.ExpressionAttributeValues) {
            queryParams.ExpressionAttributeValues = params.ExpressionAttributeValues;
        }
        
        // Add filter expression if provided
        if (params.FilterExpression) {
            queryParams.FilterExpression = params.FilterExpression;
        }
        
        // Add index name if querying a GSI
        if (params.IndexName) {
            queryParams.IndexName = params.IndexName;
        }
        
        const result = await dynamodb.query(queryParams).promise();
        console.log('Query result:', result);
        
        return { Items: result.Items };
    } catch (error) {
        console.error('queryTable error:', error);
        throw error;
    }
}

async function scanTable(params) {
    try {
        console.log('Scanning table:', params);
        
        const scanParams = {
            TableName: params.tableName
        };
        
        // Add filter expression if filters are provided
        if (params.filters && Object.keys(params.filters).length > 0) {
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
            
            scanParams.FilterExpression = filterExpression.join(' AND ');
            scanParams.ExpressionAttributeValues = expressionAttributeValues;
            scanParams.ExpressionAttributeNames = expressionAttributeNames;
        }
        
        // Handle pagination
        if (params.LastEvaluatedKey) {
            scanParams.ExclusiveStartKey = params.LastEvaluatedKey;
        }
        
        // Limit results if specified
        if (params.Limit) {
            scanParams.Limit = params.Limit;
        }
        
        const result = await dynamodb.scan(scanParams).promise();
        console.log('Scan result count:', result.Items.length);
        
        return { 
            Items: result.Items,
            LastEvaluatedKey: result.LastEvaluatedKey 
        };
    } catch (error) {
        console.error('scanTable error:', error);
        throw error;
    }
}

// Batch operations for better performance
async function batchGetItems(params) {
    try {
        const result = await dynamodb.batchGet({
            RequestItems: params.requestItems
        }).promise();
        
        return { Responses: result.Responses };
    } catch (error) {
        console.error('batchGetItems error:', error);
        throw error;
    }
}

async function batchWriteItems(params) {
    try {
        const result = await dynamodb.batchWrite({
            RequestItems: params.requestItems
        }).promise();
        
        return { 
            success: true,
            UnprocessedItems: result.UnprocessedItems 
        };
    } catch (error) {
        console.error('batchWriteItems error:', error);
        throw error;
    }
}
