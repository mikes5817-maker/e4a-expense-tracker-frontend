import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_EMPLOYEES = 'recent_employee_names';
const KEY_PROJECT_IDS = 'recent_project_ids';
const MAX = 20;

async function getList(key: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveToList(key: string, value: string) {
  if (!value.trim()) return;
  const list = await getList(key);
  const updated = [value.trim(), ...list.filter(n => n.toLowerCase() !== value.trim().toLowerCase())].slice(0, MAX);
  await AsyncStorage.setItem(key, JSON.stringify(updated));
}

export const getRecentEmployees = () => getList(KEY_EMPLOYEES);
export const saveEmployeeName = (name: string) => saveToList(KEY_EMPLOYEES, name);
export const getRecentProjectIds = () => getList(KEY_PROJECT_IDS);
export const saveProjectId = (id: string) => saveToList(KEY_PROJECT_IDS, id);
