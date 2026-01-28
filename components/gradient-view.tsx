import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export type GradientViewProps = ViewProps & {
  colors?: string[];
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
  useGradient?: boolean;
};

export function GradientView({
  style,
  colors = ["#C8E6C9", "#81C784", "#4CAF50", "#2E7D32", "#1B5E20"],
  startPoint = { x: 0.5, y: 0 },
  endPoint = { x: 0.5, y: 1 },
  useGradient = true,
  children,
  ...otherProps
}: GradientViewProps) {
  if (!useGradient) {
    return (
      <View style={[styles.container, style]} {...otherProps}>
        {children}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={colors}
      start={startPoint}
      end={endPoint}
      style={[styles.container, style]}
      {...otherProps}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
