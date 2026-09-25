import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { createFeline } from "../lib/api";
import { useSession } from "../lib/auth-context";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// mobile-tokens.md `text` token — RN's placeholderTextColor can't take a Tailwind class.
const TEXT_TOKEN_COLOR = "#9A3412";

export default function Onboarding() {
  const { session, markHasFeline } = useSession();
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = name.trim().length > 0 && DATE_PATTERN.test(dateOfBirth.trim());

  async function handleCreate() {
    if (!session || !isValid) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await createFeline(session, {
        name: name.trim(),
        dateOfBirth: new Date(dateOfBirth.trim()),
      });
      markHasFeline();
      router.replace("/");
    } catch {
      setError("Couldn't add your cat. Check the details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="flex-1 justify-center gap-3 bg-background px-6">
      <Text className="mb-2 text-center font-heading text-2xl text-text">Add your first cat</Text>
      <Text className="mb-4 text-center font-body text-base text-text">
        CatOps tracks one household's cats — let's meet the first one.
      </Text>

      <TextInput
        className="min-h-[44px] rounded border border-secondary bg-white px-3 py-3 font-body text-base text-text"
        placeholder="Name"
        placeholderTextColor={TEXT_TOKEN_COLOR}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        className="min-h-[44px] rounded border border-secondary bg-white px-3 py-3 font-body text-base text-text"
        placeholder="Date of birth (YYYY-MM-DD)"
        placeholderTextColor={TEXT_TOKEN_COLOR}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
      />

      <Pressable
        className={`min-h-[44px] items-center justify-center rounded bg-cta px-4 py-3 ${
          isSubmitting || !isValid ? "opacity-50" : ""
        }`}
        disabled={isSubmitting || !isValid}
        onPress={handleCreate}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-body text-base font-semibold text-white">Add cat</Text>
        )}
      </Pressable>

      {error ? <Text className="text-center font-body text-status-danger">{error}</Text> : null}
    </View>
  );
}
