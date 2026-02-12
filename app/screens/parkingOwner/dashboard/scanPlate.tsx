import { Ionicons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import ocrService from "../../../services/ocrService";
import parkingTicketService from "../../../services/parkingTicketService";

const ScanPlate = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const cameraRef = useRef<CameraView>(null);
  const frameRef = useRef<View>(null);

  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [frameLayout, setFrameLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [screenDimensions] = useState(Dimensions.get("window"));

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);

      // Get absolute frame position before capturing
      let absoluteFrameLayout = { ...frameLayout };

      if (frameRef.current) {
        await new Promise<void>((resolve) => {
          frameRef.current?.measureInWindow((x, y, width, height) => {
            absoluteFrameLayout = { x, y, width, height };
            console.log("📐 Absolute frame position:", absoluteFrameLayout);
            resolve();
          });
        });
      }

      // Take picture at maximum quality
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1.0, // Maximum quality
        base64: false,
        shutterSound: false, // Disable shutter sound
      });

      if (photo?.uri) {
        console.log("📸 Photo captured successfully");
        console.log("Photo dimensions:", photo.width, "x", photo.height);
        console.log("Frame layout (absolute):", absoluteFrameLayout);
        console.log(
          "Screen dimensions:",
          screenDimensions.width,
          "x",
          screenDimensions.height,
        );

        // Crop to the frame area only
        let finalImageUri = photo.uri;

        if (absoluteFrameLayout.width > 0 && absoluteFrameLayout.height > 0) {
          try {
            // Calculate crop coordinates
            // Convert screen coordinates to image coordinates
            const scaleX = photo.width / screenDimensions.width;
            const scaleY = photo.height / screenDimensions.height;

            const cropX = Math.max(0, absoluteFrameLayout.x * scaleX);
            const cropY = Math.max(0, absoluteFrameLayout.y * scaleY);
            const cropWidth = Math.min(
              absoluteFrameLayout.width * scaleX,
              photo.width - cropX,
            );
            const cropHeight = Math.min(
              absoluteFrameLayout.height * scaleY,
              photo.height - cropY,
            );

            console.log("🔲 Cropping to frame area:");
            console.log(
              `  Origin: (${Math.round(cropX)}, ${Math.round(cropY)})`,
            );
            console.log(
              `  Size: ${Math.round(cropWidth)} x ${Math.round(cropHeight)}`,
            );

            // Crop the image to frame area
            const croppedImage = await ImageManipulator.manipulateAsync(
              photo.uri,
              [
                {
                  crop: {
                    originX: cropX,
                    originY: cropY,
                    width: cropWidth,
                    height: cropHeight,
                  },
                },
              ],
              {
                compress: 1,
                format: ImageManipulator.SaveFormat.JPEG,
              },
            );

            finalImageUri = croppedImage.uri;
            console.log("✅ Image cropped to frame area only");
          } catch (cropError) {
            console.error("⚠️ Cropping failed, using full image:", cropError);
            finalImageUri = photo.uri;
          }
        } else {
          console.log("⚠️ Frame layout not available, using full photo");
        }

        setCapturedImage(finalImageUri);

        // Perform OCR on the cropped photo
        try {
          console.log("=== Starting OCR Processing ===");
          console.log("Image URI:", finalImageUri);
          const ocrResult = await ocrService.scanNumberPlate(finalImageUri);
          console.log("=== OCR Result ===", ocrResult);

          if (ocrResult.success && ocrResult.text) {
            console.log("OCR Success! Extracted text:", ocrResult.text);
            console.log("Confidence:", ocrResult.confidence);
            console.log("Provider:", ocrResult.provider || "Unknown");

            setExtractedText(ocrResult.text);
            setShowResult(true);
          } else {
            console.log("OCR failed:", ocrResult.error);
            Alert.alert(
              "No Text Found",
              ocrResult.error ||
                "Could not detect any text in the image. Would you like to enter manually?",
              [
                { text: "Retry", onPress: () => handleRetake() },
                { text: "Manual Entry", onPress: () => setManualEntry(true) },
              ],
            );
          }
        } catch (ocrError: any) {
          console.error("OCR Error:", ocrError);
          Alert.alert(
            "Processing Error",
            "Failed to process the image. Would you like to enter the number plate manually?",
            [
              { text: "Retry", onPress: () => handleRetake() },
              { text: "Manual Entry", onPress: () => setManualEntry(true) },
            ],
          );
        }
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      Alert.alert("Error", "Failed to capture image. Please try again.");
      setCapturedImage(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setExtractedText("");
    setShowResult(false);
    setManualEntry(false);
  };

  const validateSriLankanPlate = (plate: string): boolean => {
    if (!plate || plate.trim() === "") return false;

    const cleaned = plate.trim().toUpperCase();

    // Valid Sri Lankan province codes
    const validProvinces = [
      "WP",
      "UP",
      "SP",
      "NP",
      "EP",
      "NW",
      "NC",
      "SG",
      "CP",
    ];

    // Pattern: Province Code + 3 letters + hyphen + 4 digits (WP BBH-2028)
    const strictPattern = /^([A-Z]{2})\s+([A-Z]{3})[ ](\d{4})$/;
    const match = cleaned.match(strictPattern);

    if (match) {
      const provinceCode = match[1];
      return validProvinces.includes(provinceCode);
    }

    // Alternative format: 3 letters + hyphen + 4 digits (ABC-1234)
    const altPattern = /^([A-Z]{3})[-]?(\d{4})$/;
    return altPattern.test(cleaned);
  };

  const handleConfirm = async () => {
    if (extractedText) {
      try {
        // Validate Sri Lankan number plate pattern
        if (!validateSriLankanPlate(extractedText)) {
          Alert.alert(
            "Invalid Number Plate",
            "The detected text does not match a valid Sri Lankan number plate format. Please retry or enter manually.",
            [
              { text: "Retry", onPress: () => handleRetake() },
              { text: "Manual Entry", onPress: () => setManualEntry(true) },
            ],
          );
          return;
        }

        setIsProcessing(true);

        // Check if vehicle has outstanding fines
        const fine =
          await parkingTicketService.checkOutstandingFines(extractedText);

        if (fine) {
          // Navigate to detected fine screen
          router.push({
            pathname: "/screens/parkingOwner/dashboard/detectedFine",
            params: {
              vehicleNumber: extractedText,
              fineId: fine.id,
              ...(params.parkingZone && { parkingZone: params.parkingZone }),
              ...(params.parkingRate && { parkingRate: params.parkingRate }),
            },
          });
        } else {
          // Navigate to undetected fine screen (apply ticket)
          router.push({
            pathname: "/screens/parkingOwner/dashboard/undetectedFine",
            params: {
              vehicleNumber: extractedText,
              ...(params.parkingZone && { parkingZone: params.parkingZone }),
              ...(params.parkingRate && { parkingRate: params.parkingRate }),
            },
          });
        }
      } catch (error) {
        console.error("Error checking fines:", error);
        Alert.alert(
          "Error",
          "Failed to check outstanding fines. Please try again.",
        );
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleManualConfirm = () => {
    if (extractedText.trim()) {
      setManualEntry(false);
      setShowResult(true);
    } else {
      Alert.alert("Invalid Input", "Please enter a valid number plate");
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#093F86" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={[styles.topSafeArea, { height: insets.top }]} />
        <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={80} color="#093F86" />
            <Text style={styles.permissionTitle}>
              Camera Permission Required
            </Text>
            <Text style={styles.permissionText}>
              We need your permission to access the camera to scan number plates
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButtonSimple}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonSimpleText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Camera View */}
      {!capturedImage ? (
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          {/* Top Bar */}
          <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Scan Number Plate</Text>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={toggleCameraFacing}
            >
              <Ionicons name="camera-reverse" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* QR Scanner Style Overlay with Transparent Frame */}
          <View style={styles.scannerOverlay}>
            {/* Top Dark Overlay */}
            <View style={styles.overlayTop} />

            {/* Middle Row with Side Overlays and Clear Frame */}
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySide} />

              {/* Clear Scan Frame Area */}
              <View
                ref={frameRef}
                style={styles.scanFrame}
                onLayout={(event) => {
                  const { x, y, width, height } = event.nativeEvent.layout;
                  setFrameLayout({ x, y, width, height });
                }}
              >
                {/* Frame Border */}
                <View style={styles.frameBorder}>
                  {/* Animated Corner Markers */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />

                  {/* Guidance lines */}
                  <View style={styles.guidanceLineHorizontal} />
                  <View style={styles.guidanceLineVertical} />
                </View>
              </View>

              <View style={styles.overlaySide} />
            </View>

            {/* Bottom Dark Overlay */}
            <View style={styles.overlayBottom}>
              <Text style={styles.scanHint}>
                Align license plate within frame
              </Text>
              <Text style={styles.scanSubHint}>
                Only the framed area will be scanned
              </Text>

              {/* Bottom Controls */}
              <View
                style={[
                  styles.bottomBar,
                  { paddingBottom: insets.bottom + 20 },
                ]}
              >
                <View style={styles.captureContainer}>
                  <TouchableOpacity
                    style={styles.captureButton}
                    onPress={handleCapture}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="large" color="#FFFFFF" />
                    ) : (
                      <View style={styles.captureButtonInner} />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.captureHint}>Tap to capture</Text>

                {/* Manual Entry Option */}
                <TouchableOpacity
                  style={styles.manualEntryButton}
                  onPress={() => setManualEntry(true)}
                >
                  <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.manualEntryText}>Enter Manually</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </CameraView>
      ) : (
        // Preview captured image
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />

          {/* Processing Overlay */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.processingText}>
                Extracting text from image...
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Manual Entry Modal - Available from any state */}
      <Modal
        visible={manualEntry}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setManualEntry(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="create-outline" size={60} color="#093F86" />
            <Text style={styles.modalTitle}>Enter Number Plate</Text>
            <Text style={styles.modalSubtitle}>
              Please enter the vehicle number plate manually
            </Text>

            <TextInput
              style={styles.manualInput}
              placeholder="e.g., WP ABC 1234"
              placeholderTextColor="#999"
              value={extractedText}
              onChangeText={setExtractedText}
              autoCapitalize="characters"
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setManualEntry(false);
                  setExtractedText("");
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleManualConfirm}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Result Modal - Available from any state */}
      <Modal
        visible={showResult && !manualEntry}
        transparent={true}
        animationType="slide"
        onRequestClose={handleRetake}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            <Text style={styles.modalTitle}>Number Plate Detected</Text>
            <View style={styles.plateContainer}>
              <Text style={styles.plateText}>{extractedText}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.retakeButton]}
                onPress={handleRetake}
                disabled={isProcessing}
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" />
                <Text style={styles.modalButtonText}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    <Text style={styles.modalButtonText}>Confirm</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  topSafeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  overlayMiddle: {
    flexDirection: "row",
    alignItems: "center",
  },
  overlaySide: {
    flex: 1,
    height: 170,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  overlayBottom: {
    flex: 1.2,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingTop: 15,
    alignItems: "center",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  topBarTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 350,
    height: 150,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  frameBorder: {
    width: "100%",
    height: "100%",
    borderWidth: 2,
    borderColor: "rgba(76, 175, 80, 0.3)",
    borderRadius: 8,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#4CAF50",
    borderWidth: 5,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanHint: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  scanSubHint: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#B0B0B0",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  guidanceLineHorizontal: {
    position: "absolute",
    width: "100%",
    height: 1,
    backgroundColor: "rgba(76, 175, 80, 0.4)",
    top: "50%",
  },
  guidanceLineVertical: {
    position: "absolute",
    height: "100%",
    width: 1,
    backgroundColor: "rgba(76, 175, 80, 0.4)",
    left: "50%",
  },
  bottomBar: {
    alignItems: "center",
    paddingTop: 10,
    marginTop: 10,
  },
  captureContainer: {
    marginBottom: 10,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
  },
  captureHint: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  manualEntryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
  },
  manualEntryText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 22,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    textAlign: "center",
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: "#093F86",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 15,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  backButtonSimple: {
    paddingVertical: 10,
  },
  backButtonSimpleText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#093F86",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  previewImage: {
    flex: 1,
    resizeMode: "contain",
  },
  processingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  processingText: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
    marginTop: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginTop: 15,
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    textAlign: "center",
    marginBottom: 20,
  },
  manualInput: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontFamily: "Poppins-Medium",
    color: "#000000",
    textAlign: "center",
    marginBottom: 25,
  },
  plateContainer: {
    backgroundColor: "#FFC107",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#000000",
    marginBottom: 30,
  },
  plateText: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    letterSpacing: 2,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 15,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  retakeButton: {
    backgroundColor: "#757575",
  },
  cancelButton: {
    backgroundColor: "#757575",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

export default ScanPlate;
