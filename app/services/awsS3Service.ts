import awsConfig from "./awsConfig";

/**
 * AWS S3 Service for file uploads
 * Uses API Gateway + Lambda to upload files to S3
 */
class AwsS3Service {
  private apiUrl: string;
  private bucket: string;

  constructor() {
    this.apiUrl = awsConfig.apiGatewayUrl;
    this.bucket = awsConfig.s3Bucket;
  }

  /**
   * Upload image to S3 bucket
   * @param uri - Local file URI
   * @param folder - Folder path in S3 (e.g., 'profileImages')
   * @param fileName - Optional custom file name
   * @returns Download URL of uploaded file
   */
  async uploadImage(
    uri: string,
    folder: string = "uploads",
    fileName?: string,
  ): Promise<string> {
    try {
      // Fetch the image as blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Determine content type
      let contentType = "image/jpeg";
      if (uri.endsWith(".png")) contentType = "image/png";
      else if (uri.endsWith(".gif")) contentType = "image/gif";
      else if (uri.endsWith(".webp")) contentType = "image/webp";

      // Generate file name if not provided
      const finalFileName =
        fileName || `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const key = `${folder}/${finalFileName}`;

      // Convert blob to base64
      const base64 = await this.blobToBase64(blob);

      // Upload via API Gateway
      const uploadResponse = await fetch(`${this.apiUrl}/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bucket: this.bucket,
          key: key,
          body: base64,
          contentType: contentType,
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await uploadResponse.json();

      // Return the public URL
      // Format: https://bucket-name.s3.region.amazonaws.com/key
      const downloadUrl = `https://${this.bucket}.s3.${awsConfig.region}.amazonaws.com/${key}`;

      return downloadUrl;
    } catch (error) {
      console.error("S3 Upload Error:", error);
      throw error;
    }
  }

  /**
   * Convert Blob to Base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64String.split(",")[1];
        resolve(base64Data);
      };
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Delete file from S3
   * @param key - S3 object key (file path)
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bucket: this.bucket,
          key: key,
        }),
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      return true;
    } catch (error) {
      console.error("S3 Delete Error:", error);
      return false;
    }
  }

  /**
   * Get signed URL for private files (if needed)
   * @param key - S3 object key
   * @param expiresIn - URL expiration time in seconds
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/signed-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bucket: this.bucket,
          key: key,
          expiresIn: expiresIn,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get signed URL");
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error("S3 Signed URL Error:", error);
      throw error;
    }
  }
}

export default new AwsS3Service();
