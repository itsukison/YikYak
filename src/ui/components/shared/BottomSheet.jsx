import React, { useEffect, useRef } from "react";
import {
  View,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../config/theme";

/**
 * Reusable BottomSheet component with slide-up animation
 *
 * Usage:
 * <BottomSheet visible={isVisible} onClose={handleClose}>
 *   <YourContent />
 * </BottomSheet>
 */
export default function BottomSheet({
  visible,
  onClose,
  children,
  maxHeight = "70%",
  showDragHandle = true,
}) {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  // Animation values
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height)
  ).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: Dimensions.get("window").height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    // Animate out before closing
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: Dimensions.get("window").height,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none" // We handle animation manually
      onRequestClose={handleClose}
    >
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View
          style={[
            styles.overlay,
            {
              backgroundColor: colors.overlay || "rgba(0, 0, 0, 0.5)",
              opacity: overlayOpacity,
            },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Bottom Sheet Content */}
      <Animated.View
        style={[
          styles.sheetContainer,
          {
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom || spacing.md,
          },
        ]}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              maxHeight: maxHeight,
            },
          ]}
        >
          {/* Drag Handle */}
          {showDragHandle && (
            <View style={styles.handleContainer}>
              <View
                style={[
                  styles.handle,
                  {
                    backgroundColor: colors.border,
                    borderRadius: radius.full,
                  },
                ]}
              />
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    width: "100%",
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
