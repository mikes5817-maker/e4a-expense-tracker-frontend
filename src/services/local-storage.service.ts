import * as FileSystem from 'expo-file-system/legacy';

const RECEIPTS_DIR = `${FileSystem.documentDirectory}receipts/`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(RECEIPTS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(RECEIPTS_DIR, { intermediates: true });
  }
}

export async function saveReceiptLocally(sourceUri: string, fileName: string): Promise<string> {
  await ensureDir();
  const safeName = fileName.replace(/[^a-zA-Z0-9._]/g, '_');
  const dest = `${RECEIPTS_DIR}${Date.now()}_${safeName}`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

export async function getLocalReceiptUri(localPath: string): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(localPath);
    return info.exists ? localPath : null;
  } catch { return null; }
}
