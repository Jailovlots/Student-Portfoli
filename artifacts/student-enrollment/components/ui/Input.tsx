import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  secureTextEntry,
  ...props
}: InputProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  const borderColor = error ? colors.destructive : focused ? colors.primary : colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            backgroundColor: colors.card,
            borderRadius: colors.radius,
          },
        ]}
      >
        {leftIcon && (
          <Feather
            name={leftIcon}
            size={18}
            color={focused ? colors.primary : colors.mutedForeground}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          {...props}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[
            styles.input,
            {
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
            },
            leftIcon ? styles.inputWithLeft : undefined,
            (rightIcon || secureTextEntry) ? styles.inputWithRight : undefined,
          ]}
          placeholderTextColor={colors.mutedForeground}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setHidden(!hidden)} style={styles.rightIcon}>
            <Feather name={hidden ? "eye" : "eye-off"} size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
        {rightIcon && !secureTextEntry && (
          <Pressable onPress={onRightIconPress} style={styles.rightIcon}>
            <Feather name={rightIcon} size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    height: 52,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    paddingHorizontal: 16,
  },
  inputWithLeft: {
    paddingLeft: 4,
  },
  inputWithRight: {
    paddingRight: 4,
  },
  leftIcon: {
    paddingLeft: 14,
  },
  rightIcon: {
    paddingRight: 14,
  },
  error: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
});
