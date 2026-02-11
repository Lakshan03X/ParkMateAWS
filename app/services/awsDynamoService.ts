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
    params: any,
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
    key: any,
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
    item: any,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.post(`${this.apiUrl}/put-item`, {
        tableName,
        item,
      });

      return { success: true };
    } catch (error: any) {
      console.error("DynamoDB PutItem Error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Put item failed";
      throw new Error(errorMessage);
    }
  }

  async updateItem(
    tableName: string,
    key: any,
    updates: any,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate inputs before sending
      if (!tableName) {
        throw new Error("Table name is required");
      }
      if (!key || Object.keys(key).length === 0) {
        throw new Error("Key is required and cannot be empty");
      }
      if (!updates || Object.keys(updates).length === 0) {
        throw new Error("Updates object is required and cannot be empty");
      }

      console.log("Updating item:", {
        tableName,
        key,
        updates,
      });

      await axios.post(`${this.apiUrl}/update-item`, {
        tableName,
        key,
        updates,
      });

      return { success: true };
    } catch (error: any) {
      console.error("DynamoDB UpdateItem Error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Update item failed";
      throw new Error(errorMessage);
    }
  }

  async deleteItem(
    tableName: string,
    key: any,
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
      const errorMessage =
        error.response?.data?.message || error.message || "Delete item failed";
      throw new Error(errorMessage);
    }
  }

  async scan(
    tableName: string,
    filters?: any,
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
