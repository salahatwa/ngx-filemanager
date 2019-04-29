import { Bucket } from '../../types/google-cloud-types';
import { CoreTypes } from 'ngx-filemanager-core/public_api';

export async function EditFile(
  bucket: Bucket,
  item: string,
  content: string,
  claims: CoreTypes.UserCustomClaims
) {
  const result = { success: true };
  try {
    await bucket.file(item).save(content);
  } catch (error) {
    result.success = false;
  }
  return result;
}
