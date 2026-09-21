import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Typography";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, Text, useColorScheme } from "react-native";
import axiosInstance from "../../axiosInstance";
import { apiErrorMessage, type Booking } from "./bookingUtils";

type Props = {
  /** The visit being closed out: a Continuous booking, or one shift. */
  booking: Booking | null;
  onClose: () => void;
  onCompleted: () => void;
};

/**
 * The handover step: the patient reads out the 6-digit code from their app and
 * the nurse enters it here. The code is deliberately never exposed to the
 * nurse through the API, so this is the only way a visit becomes Completed.
 */
export function CompleteVisitSheet({ booking, onClose, onCompleted }: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (booking) {
      setOtp("");
      setError("");
    }
  }, [booking]);

  const handleSubmit = async () => {
    if (!booking || submitting) return;
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code from the patient's app.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await axiosInstance.post(`bookings/${booking.id}/complete`, { otp });
      onCompleted();
    } catch (e: any) {
      // The API distinguishes a wrong code (400), no code issued yet (409)
      // and too many attempts (429); each message is written for the nurse.
      setError(apiErrorMessage(e, "Could not complete this visit."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={!!booking}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(15,23,42,0.45)" }}
        onPress={onClose}
      >
        <Pressable
          className="rounded-t-3xl px-5 pt-5 pb-8"
          style={{ backgroundColor: colors.surface }}
          onPress={(event) => event.stopPropagation()}
        >
          <Text
            style={{ fontFamily: Fonts.semibold, color: colors.text }}
            className="text-[18px] mb-1"
          >
            Complete visit
          </Text>
          <Text
            style={{ fontFamily: Fonts.regular, color: colors.textSecondary }}
            className="text-[14px] mb-5 leading-5"
          >
            Ask the patient to open this booking in their app and read out the
            6-digit code.
          </Text>

          <Input
            className="rounded-xl h-16 pl-3 border"
            size="md"
            style={{
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
            }}
          >
            <InputField
              style={{
                fontFamily: Fonts.semibold,
                color: colors.text,
                fontSize: 24,
                letterSpacing: 8,
                textAlign: "center",
              }}
              placeholder="000000"
              placeholderTextColor={colors.textMuted}
              cursorColor={colors.cursorColor}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/\D/g, ""))}
            />
          </Input>

          {!!error && (
            <Box
              className="rounded-xl px-3 py-2 mt-3 border"
              style={{
                backgroundColor: colors.errorSoft,
                borderColor: colors.error,
              }}
            >
              <Text
                style={{ fontFamily: Fonts.regular, color: colors.error }}
                className="text-[13px] leading-5"
              >
                {error}
              </Text>
            </Box>
          )}

          <Button
            onPress={handleSubmit}
            isDisabled={submitting}
            style={{ backgroundColor: colors.secondaryBackgroundGradient }}
            className="h-14 rounded-xl items-center mt-4 active:opacity-90"
          >
            <ButtonText
              style={{
                fontFamily: Fonts.semibold,
                color: colors.textInverted,
                fontSize: 17,
                lineHeight: 22,
              }}
            >
              {submitting ? "Checking…" : "Complete visit"}
            </ButtonText>
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
