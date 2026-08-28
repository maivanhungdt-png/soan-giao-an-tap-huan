export const DB_NAME = 'LessonPlanDB';
export const DB_VERSION = 1;
export const STORE_NAME = 'sgkFiles';

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveSgkImages = async (subject: string, grade: number, imagesBase64: string[]) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    store.put({
      id: `${subject}_${grade}`,
      images: imagesBase64,
      timestamp: Date.now()
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Error saving files to IndexedDB:', error);
    throw error;
  }
};

export const loadSgkImages = async (subject: string, grade: number): Promise<string[] | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(`${subject}_${grade}`);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (!result || !result.images) {
          resolve(null);
          return;
        }
        resolve(result.images);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error loading files from IndexedDB:', error);
    return null;
  }
};
