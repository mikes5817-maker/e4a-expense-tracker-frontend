import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, radius } from '../../../src/theme';
import { InputField } from '../../../src/components/InputField';
import { GradientButton } from '../../../src/components/GradientButton';
import { createExpense } from '../../../src/services/expenses.service';
import { getPresignedUrl, uploadFileToS3, completeUpload } from '../../../src/services/upload.service';
import { EXPENSE_CATEGORIES, CATEGORY_LABELS, type ExpenseCategory } from '../../../src/types';
import { DatePickerModal } from 'react-native-paper-dates';

export default function AddExpenseScreen() {
  const { id: projectId = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [employeeName, setEmployeeName] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('GasolinaDiesel');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // File upload state
  const [fileUri, setFileUri] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileId, setFileId] = useState<string | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    setShowFilePicker(false);
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result?.canceled && result?.assets?.[0]) {
      const asset = result.assets[0];
      await uploadFile(asset.uri, asset.fileName ?? 'photo.jpg', asset.mimeType ?? 'image/jpeg');
    }
  };

  const pickDocument = async () => {
    setShowFilePicker(false);
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!result?.canceled && result?.assets?.[0]) {
      const asset = result.assets[0];
      await uploadFile(asset.uri, asset.name ?? 'document', asset.mimeType ?? 'application/pdf');
    }
  };

  const uploadFile = async (uri: string, name: string, type: string) => {
    setUploading(true);
    setUploadProgress(0);
    setFileUri(uri);
    setFileName(name);
    setFileType(type);
    try {
      const presigned = await getPresignedUrl(name, type);
      await uploadFileToS3(presigned?.uploadUrl ?? '', uri, type, setUploadProgress);
      const completed = await completeUpload(presigned?.cloud_storage_path ?? '', name, type);
      setFileId(completed?.id ?? undefined);
    } catch {
      setError('Failed to upload file');
      setFileUri('');
      setFileName('');
      setFileType('');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFileUri('');
    setFileName('');
    setFileType('');
    setFileId(undefined);
    setUploadProgress(0);
  };

  const handleSave = async () => {
    setError('');
    if (!employeeName?.trim()) { setError('Employee name is required'); return; }
    if (!amount?.trim() || isNaN(Number(amount))) { setError('Valid amount is required'); return; }
    if (category === 'Other' && !customCategory?.trim()) { setError('Please specify the custom category'); return; }
    setLoading(true);
    try {
      await createExpense(projectId, {
        employeeName: employeeName.trim(),
        date: date.toISOString(),
        category,
        ...(category === 'Other' ? { customCategory: customCategory.trim() } : {}),
        amount: Number(amount),
        ...(fileId ? { receiptFileId: fileId } : {}),
      });
      router.back();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create expense';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Expense</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <InputField label="Employee Name" value={employeeName} onChangeText={setEmployeeName} placeholder="e.g. John Smith" />
            <Text style={styles.label}>Date</Text>
            <Pressable style={styles.dateBtn} onPress={() => setShowDatePicker(true)} accessibilityLabel="Pick date">
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.dateText}>{date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
            </Pressable>
            <DatePickerModal locale="en" mode="single" visible={showDatePicker} onDismiss={() => setShowDatePicker(false)} date={date} onConfirm={({ date: d }) => { if (d) setDate(d); setShowDatePicker(false); }} />

            <Text style={[styles.label, { marginTop: spacing.md }]}>Category</Text>
            <View style={styles.categoryRow}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[styles.categoryChip, category === cat && { backgroundColor: (colors.categoryColors?.[cat] ?? '#6B7280') + '30', borderColor: colors.categoryColors?.[cat] ?? '#6B7280' }]}
                  onPress={() => setCategory(cat)}
                  accessibilityLabel={CATEGORY_LABELS?.[cat] ?? cat}
                >
                  <View style={[styles.categoryDot, { backgroundColor: colors.categoryColors?.[cat] ?? '#6B7280' }]} />
                  <Text style={[styles.categoryText, category === cat && { color: colors.categoryColors?.[cat] ?? '#6B7280', fontWeight: '600' }]}>{CATEGORY_LABELS?.[cat] ?? cat}</Text>
                </Pressable>
              ))}
            </View>
            {category === 'Other' && (
              <InputField label="Specify Category" value={customCategory} onChangeText={setCustomCategory} placeholder="e.g. Parking, Tools..." />
            )}

            <InputField label="Amount ($)" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />

            {/* Receipt Upload */}
            <Text style={[styles.label, { marginTop: spacing.xs }]}>Receipt (optional)</Text>
            {fileUri ? (
              <View style={styles.filePreview}>
                {fileType?.startsWith('image/') ? (
                  <Image source={{ uri: fileUri }} style={styles.previewImage} resizeMode="cover" />
                ) : (
                  <View style={styles.pdfPreview}>
                    <Ionicons name="document" size={32} color={colors.primary} />
                    <Text style={styles.pdfName} numberOfLines={1}>{fileName}</Text>
                  </View>
                )}
                <Pressable onPress={removeFile} style={styles.removeBtn} accessibilityLabel="Remove file">
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </Pressable>
              </View>
            ) : uploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.uploadingText}>Uploading... {Math.round(uploadProgress * 100)}%</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.round(uploadProgress * 100)}%` }]} />
                </View>
              </View>
            ) : (
              <View>
                <Pressable style={styles.uploadBtn} onPress={() => setShowFilePicker(!showFilePicker)} accessibilityLabel="Upload receipt">
                  <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                  <Text style={styles.uploadBtnText}>Upload Receipt</Text>
                </Pressable>
                {showFilePicker && (
                  <View style={styles.fileOptions}>
                    <Pressable style={styles.optionBtn} onPress={() => pickImage(true)}>
                      <Ionicons name="camera" size={20} color={colors.primary} />
                      <Text style={styles.optionText}>Take Photo</Text>
                    </Pressable>
                    <Pressable style={styles.optionBtn} onPress={() => pickImage(false)}>
                      <Ionicons name="images" size={20} color={colors.primary} />
                      <Text style={styles.optionText}>Choose from Gallery</Text>
                    </Pressable>
                    <Pressable style={styles.optionBtn} onPress={pickDocument}>
                      <Ionicons name="document" size={20} color={colors.primary} />
                      <Text style={styles.optionText}>Choose Document</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </View>
          <GradientButton title="Save Expense" onPress={handleSave} loading={loading} disabled={uploading} style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textDark },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  error: { backgroundColor: colors.error + '15', color: colors.error, fontSize: 13, padding: spacing.sm, borderRadius: radius.sm, marginBottom: spacing.sm, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: colors.textBody, marginBottom: 6 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FAFBFC', marginBottom: spacing.sm },
  dateText: { fontSize: 15, color: colors.textDark },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#FAFBFC' },
  categoryDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  categoryText: { fontSize: 13, color: colors.textBody },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: colors.primary + '40', borderStyle: 'dashed', borderRadius: radius.md, paddingVertical: 20, backgroundColor: colors.primary + '08' },
  uploadBtnText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  fileOptions: { marginTop: spacing.sm, backgroundColor: '#FAFBFC', borderRadius: radius.md, padding: spacing.sm },
  optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: spacing.sm },
  optionText: { fontSize: 15, color: colors.textDark },
  filePreview: { position: 'relative', borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#F0F4F8' },
  previewImage: { width: '100%', height: 200, borderRadius: radius.md },
  pdfPreview: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md },
  pdfName: { flex: 1, fontSize: 14, color: colors.textDark },
  removeBtn: { position: 'absolute', top: 8, right: 8 },
  uploadingContainer: { alignItems: 'center', padding: spacing.md },
  uploadingText: { fontSize: 13, color: colors.textBody, marginTop: 8 },
  progressBar: { width: '100%', height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: 8 },
  progressFill: { height: 4, backgroundColor: colors.primary, borderRadius: 2 },
});
