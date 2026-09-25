import type { InventoryType, InventoryWithStatus } from "@cat-in-sack/shared";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { createInventoryItem, deleteInventoryItem, listInventory, updateInventoryItem } from "../../lib/api";
import { useSession } from "../../lib/auth-context";

// mobile-tokens.md `text` token — RN's placeholderTextColor can't take a Tailwind class.
const TEXT_TOKEN_COLOR = "#9A3412";

const INVENTORY_TYPES: InventoryType[] = ["FOOD", "LITTER", "MEDS"];
const TYPE_LABELS: Record<InventoryType, string> = { FOOD: "Food", LITTER: "Litter", MEDS: "Meds" };
const TYPE_UNITS: Record<InventoryType, string> = { FOOD: "kg", LITTER: "kg", MEDS: "doses" };

type FormState = {
  type: InventoryType;
  totalAmount: string;
  dailyBurnRate: string;
  reorderThresholdDays: string;
};

const EMPTY_FORM: FormState = { type: "FOOD", totalAmount: "", dailyBurnRate: "", reorderThresholdDays: "3" };

function parseForm(form: FormState) {
  const totalAmount = Number(form.totalAmount);
  const dailyBurnRate = Number(form.dailyBurnRate);
  const reorderThresholdDays = Number(form.reorderThresholdDays);

  if (!Number.isFinite(totalAmount) || totalAmount < 0) return null;
  if (!Number.isFinite(dailyBurnRate) || dailyBurnRate <= 0) return null;
  if (!Number.isInteger(reorderThresholdDays) || reorderThresholdDays <= 0) return null;

  return { type: form.type, totalAmount, dailyBurnRate, reorderThresholdDays };
}

function formatDepletionDate(depletionDate: Date | null) {
  if (!depletionDate) return "Never runs out at this rate";
  const isPast = depletionDate.getTime() <= Date.now();
  const formatted = depletionDate.toLocaleDateString();
  return isPast ? `Ran out ${formatted}` : `Runs out ${formatted}`;
}

function TypePicker({ value, onChange }: { value: InventoryType; onChange: (type: InventoryType) => void }) {
  return (
    <View className="flex-row gap-2">
      {INVENTORY_TYPES.map((type) => (
        <Pressable
          key={type}
          className={`min-h-[44px] flex-1 items-center justify-center rounded border px-2 py-2 ${
            value === type ? "border-primary bg-primary" : "border-secondary bg-white"
          }`}
          onPress={() => onChange(type)}
        >
          <Text className={`font-body text-base ${value === type ? "font-semibold text-white" : "text-text"}`}>
            {TYPE_LABELS[type]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ItemForm({
  form,
  onChange,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  form: FormState;
  onChange: (form: FormState) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  const isValid = parseForm(form) !== null;

  return (
    <View className="gap-2">
      <TypePicker value={form.type} onChange={(type) => onChange({ ...form, type })} />
      <TextInput
        className="min-h-[44px] rounded border border-secondary bg-white px-3 py-3 font-body text-base text-text"
        placeholder={`Total amount (${TYPE_UNITS[form.type]})`}
        placeholderTextColor={TEXT_TOKEN_COLOR}
        keyboardType="decimal-pad"
        value={form.totalAmount}
        onChangeText={(totalAmount) => onChange({ ...form, totalAmount })}
      />
      <TextInput
        className="min-h-[44px] rounded border border-secondary bg-white px-3 py-3 font-body text-base text-text"
        placeholder={`Daily burn rate (${TYPE_UNITS[form.type]}/day)`}
        placeholderTextColor={TEXT_TOKEN_COLOR}
        keyboardType="decimal-pad"
        value={form.dailyBurnRate}
        onChangeText={(dailyBurnRate) => onChange({ ...form, dailyBurnRate })}
      />
      <TextInput
        className="min-h-[44px] rounded border border-secondary bg-white px-3 py-3 font-body text-base text-text"
        placeholder="Reorder threshold (days)"
        placeholderTextColor={TEXT_TOKEN_COLOR}
        keyboardType="number-pad"
        value={form.reorderThresholdDays}
        onChangeText={(reorderThresholdDays) => onChange({ ...form, reorderThresholdDays })}
      />
      <Pressable
        className={`min-h-[44px] items-center justify-center rounded bg-cta px-4 py-3 ${
          isSubmitting || !isValid ? "opacity-50" : ""
        }`}
        disabled={isSubmitting || !isValid}
        onPress={onSubmit}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-body text-base font-semibold text-white">{submitLabel}</Text>
        )}
      </Pressable>
    </View>
  );
}

export default function PantryScreen() {
  const { session } = useSession();
  const [items, setItems] = useState<InventoryWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      setItems(await listInventory(session));
      setError(null);
    } catch {
      setError("Couldn't load the pantry.");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd() {
    if (!session) return;
    const input = parseForm(addForm);
    if (!input) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createInventoryItem(session, input);
      setAddForm(EMPTY_FORM);
      await load();
    } catch {
      setError("Couldn't add that item.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(item: InventoryWithStatus) {
    setEditingId(item.id);
    setEditForm({
      type: item.type,
      totalAmount: String(item.totalAmount),
      dailyBurnRate: String(item.dailyBurnRate),
      reorderThresholdDays: String(item.reorderThresholdDays),
    });
  }

  async function handleSaveEdit() {
    if (!session || !editingId) return;
    const input = parseForm(editForm);
    if (!input) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await updateInventoryItem(session, editingId, input);
      setEditingId(null);
      await load();
    } catch {
      setError("Couldn't save that item.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDelete(item: InventoryWithStatus) {
    if (!session) return;
    Alert.alert(`Remove ${TYPE_LABELS[item.type]}?`, "This item will be removed from the pantry.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteInventoryItem(session, item.id);
            await load();
          } catch {
            setError("Couldn't delete that item.");
          }
        },
      },
    ]);
  }

  return (
    <FlatList
      className="flex-1 bg-background"
      contentContainerClassName="gap-3 px-6 py-4"
      data={items}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View className="mb-2 gap-3">
          <Text className="font-heading text-2xl text-text">Pantry</Text>
          <ItemForm form={addForm} onChange={setAddForm} onSubmit={handleAdd} isSubmitting={isSubmitting} submitLabel="Add item" />
          {error ? <Text className="text-center font-body text-status-danger">{error}</Text> : null}
          {isLoading ? <ActivityIndicator color={TEXT_TOKEN_COLOR} /> : null}
        </View>
      }
      ListEmptyComponent={
        isLoading ? null : (
          <Text className="text-center font-body text-base text-text">No items yet — add your first one above.</Text>
        )
      }
      renderItem={({ item }) => {
        if (editingId === item.id) {
          return (
            <View className="gap-2 rounded border border-secondary bg-white p-3">
              <ItemForm
                form={editForm}
                onChange={setEditForm}
                onSubmit={handleSaveEdit}
                isSubmitting={isSubmitting}
                submitLabel="Save"
              />
              <Pressable className="min-h-[44px] items-center justify-center" onPress={() => setEditingId(null)}>
                <Text className="font-body text-base text-text">Cancel</Text>
              </Pressable>
            </View>
          );
        }

        const badge = item.reorderDue
          ? item.depletionDate && item.depletionDate.getTime() <= Date.now()
            ? { label: "Out of stock", className: "bg-status-danger" }
            : { label: "Low stock", className: "bg-status-warning" }
          : null;

        return (
          <View className="gap-1 rounded border border-secondary bg-white p-3">
            <View className="flex-row items-center justify-between">
              <Text className="font-body text-base font-semibold text-text">{TYPE_LABELS[item.type]}</Text>
              {badge ? (
                <View className={`rounded px-2 py-1 ${badge.className}`}>
                  <Text className="font-body text-sm font-semibold text-white">{badge.label}</Text>
                </View>
              ) : null}
            </View>
            <Text className="font-body text-base text-text">
              {item.totalAmount} {TYPE_UNITS[item.type]} remaining · {item.dailyBurnRate} {TYPE_UNITS[item.type]}/day
            </Text>
            <Text className="font-body text-base text-text">{formatDepletionDate(item.depletionDate)}</Text>
            <View className="mt-2 flex-row gap-4">
              <Pressable className="min-h-[44px] justify-center" onPress={() => startEdit(item)}>
                <Text className="font-body text-base font-semibold text-cta">Edit</Text>
              </Pressable>
              <Pressable className="min-h-[44px] justify-center" onPress={() => handleDelete(item)}>
                <Text className="font-body text-base font-semibold text-status-danger">Delete</Text>
              </Pressable>
            </View>
          </View>
        );
      }}
    />
  );
}
