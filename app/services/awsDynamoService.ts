import axios from "axios";
import { awsConfig } from "./awsConfig";

// AWS DynamoDB service using API Gateway
class AWSDynamoService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = awsConfig.apiGatewayUrl;
  }

  // Generic method to interact with DynamoDB through API Gateway
  async query(
    tableName: string,
    params: any
  ): Promise<{ items: any[]; error?: string }> {
    try {
      const response = await axios.post(`${this.apiUrl}/query`, {
        tableName,
        ...params,
      });

      return {
        items: response.data.Items || [],
      };
    } catch (error: any) {
      console.error("DynamoDB Query Error:", error);
      return {
        items: [],
        error: error.message || "Query failed",
      };
    }
  }

  async getItem(
    tableName: string,
    key: any
  ): Promise<{ item?: any; error?: string }> {
    try {
      const response = await axios.post(`${this.apiUrl}/get-item`, {
        tableName,
        key,
      });

      return {
        item: response.data.Item,
      };
    } catch (error: any) {
      console.error("DynamoDB GetItem Error:", error);
      return {
        error: error.message || "Get item failed",
      };
    }
  }

  async putItem(
    tableName: string,
    item: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.post(`${this.apiUrl}/put-item`, {
        tableName,
        item,
      });

      return { success: true };
    } catch (error: any) {
      console.error("DynamoDB PutItem Error:", error);
      return {
        success: false,
        error: error.message || "Put item failed",
      };
    }
  }

  async updateItem(
    tableName: string,
    key: any,
    updates: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.post(`${this.apiUrl}/update-item`, {
        tableName,
        key,
        updates,
      });

      return { success: true };
    } catch (error: any) {
      console.error("DynamoDB UpdateItem Error:", error);
      return {
        success: false,
        error: error.message || "Update item failed",
      };
    }
  }

  async deleteItem(
    tableName: string,
    key: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.delete(`${this.apiUrl}/delete-item`, {
        data: {
          tableName,
          key,
        },
      });

      return { success: true };
    } catch (error: any) {
      console.error("DynamoDB DeleteItem Error:", error);
      return {
        success: false,
        error: error.message || "Delete item failed",
      };
    }
  }

  async scan(
    tableName: string,
    filters?: any
  ): Promise<{ items: any[]; error?: string }> {
    try {
      const response = await axios.post(`${this.apiUrl}/scan`, {
        tableName,
        filters,
      });

      return {
        items: response.data.Items || [],
      };
    } catch (error: any) {
      console.error("DynamoDB Scan Error:", error);
      return {
        items: [],
        error: error.message || "Scan failed",
      };
    }
  }
}

export default new AWSDynamoService();
