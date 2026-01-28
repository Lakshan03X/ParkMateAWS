import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ReceiptViewProps {
  receiptId: string;
  ticketId: string;
  vehicleNumber: string;
  amount: number;
  paymentMethod: string;
  paymentId: string;
  transactionDate: string;
  type: "fine" | "parking";
  parkingZone?: string;
  duration?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  reason?: string;
}

const ReceiptView = React.forwardRef<View, ReceiptViewProps>((props, ref) => {
  const {
    receiptId,
    ticketId,
    vehicleNumber,
    amount,
    paymentMethod,
    paymentId,
    transactionDate,
    type,
    parkingZone,
    duration,
    startTime,
    endTime,
    location,
    reason,
  } = props;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <View ref={ref} style={styles.receiptContainer} collapsable={false}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
        <Text style={styles.headerTitle}>Payment Receipt</Text>
        <Text style={styles.headerSubtitle}>
          {type === "fine" ? "Fine Payment" : "Parking Payment"}
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Receipt Details */}
      <View style={styles.detailsSection}>
        <DetailRow label="Receipt ID" value={receiptId} />
        <DetailRow label="Ticket ID" value={ticketId} />
        <DetailRow label="Vehicle Number" value={vehicleNumber} />

        {type === "parking" && parkingZone && (
          <DetailRow label="Parking Zone" value={parkingZone} />
        )}

        {type === "parking" && duration && (
          <DetailRow label="Duration" value={duration} />
        )}

        {type === "parking" && startTime && (
          <DetailRow label="Start Time" value={startTime} />
        )}

        {type === "parking" && endTime && (
          <DetailRow label="End Time" value={endTime} />
        )}

        {type === "fine" && location && (
          <DetailRow label="Location" value={location} />
        )}

        {type === "fine" && reason && (
          <DetailRow label="Reason" value={reason} />
        )}

        <DetailRow label="Payment Method" value={paymentMethod} />
        <DetailRow label="Payment ID" value={paymentId} />
        <DetailRow
          label="Transaction Date"
          value={formatDateTime(transactionDate)}
        />
      </View>

      {/* Amount Section */}
      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Total Amount Paid</Text>
        <Text style={styles.amountValue}>Rs. {amount.toLocaleString()}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Thank you for your payment</Text>
        <Text style={styles.footerSubtext}>ParkMate System</Text>
        <Text style={styles.footerDate}>{new Date().toLocaleDateString()}</Text>
      </View>
    </View>
  );
});

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  receiptContainer: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    width: 350,
    minHeight: 600,
  },
  header: {
    alignItems: "center",
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginTop: 4,
  },
  divider: {
    height: 2,
    backgroundColor: "#E0E0E0",
    marginVertical: 16,
  },
  detailsSection: {
    paddingVertical: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#000000",
    flex: 1,
    textAlign: "right",
  },
  amountSection: {
    backgroundColor: "#E8F5E9",
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontFamily: "Poppins-Bold",
    color: "#4CAF50",
  },
  footer: {
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: "#E0E0E0",
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#000000",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginBottom: 8,
  },
  footerDate: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#999999",
  },
});

export default ReceiptView;
