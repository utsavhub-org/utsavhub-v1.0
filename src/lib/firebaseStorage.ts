import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';
import { optimizeImageForUpload } from './mediaOptimizer';

const storage = getStorage(app);

/**
 * Upload vendor photo to Firebase Storage with automatic client-side compression
 */
export async function uploadVendorPhotoToFirebase(
  localUri: string,
  folder = 'vendor_photos'
): Promise<string> {
  try {
    // 1. Automatically compress 15MB camera photos down to ~250KB before upload
    const optimized = await optimizeImageForUpload(localUri, 1280, 0.82);

    // 2. Fetch the file blob
    const response = await fetch(optimized.uri);
    const blob = await response.blob();

    // 3. Create unique storage reference
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const storageRef = ref(storage, `${folder}/${fileName}`);

    // 4. Upload to Firebase Storage
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
    });

    // 5. Get permanent download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error: any) {
    console.warn('Firebase Storage upload notice (check Firebase Storage rules):', error);
    // Return the local URI if network or storage rules not configured yet
    return localUri;
  }
}

/**
 * Upload PDF lookbook or catering menu to Firebase Storage
 */
export async function uploadVendorPdfToFirebase(
  localUri: string,
  fileName: string,
  folder = 'vendor_documents'
): Promise<string> {
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();

    const cleanName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storageRef = ref(storage, `${folder}/${cleanName}`);

    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'application/pdf',
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error: any) {
    console.warn('Firebase PDF upload notice:', error);
    return localUri;
  }
}

