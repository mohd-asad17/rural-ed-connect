import { supabase } from "@/integrations/supabase/client";

/**
 * Open a file stored in a (possibly private) Supabase storage bucket in a new tab.
 *
 * Accepts either:
 *  - a full public URL (legacy data) — opened directly
 *  - a storage path inside the given bucket — a short-lived signed URL is generated
 *
 * Private buckets (course-content, assignment-files, submissions) require signed URLs;
 * public buckets (avatars, resources) work with public URLs but signed URLs work too.
 */
export async function openStorageFile(
  bucket: string,
  pathOrUrl: string,
  expiresIn = 3600
): Promise<void> {
  if (!pathOrUrl) return;

  // If it's already a full URL, just open it.
  if (/^https?:\/\//i.test(pathOrUrl)) {
    // Try to extract the storage path from a Supabase URL so we can re-sign
    // when the bucket is private (which is why the public URL returns 404).
    const match = pathOrUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(\?.*)?$/);
    if (match) {
      const urlBucket = match[1];
      const path = decodeURIComponent(match[2]);
      const { data, error } = await supabase.storage.from(urlBucket).createSignedUrl(path, expiresIn);
      if (!error && data?.signedUrl) {
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
        return;
      }
    }
    window.open(pathOrUrl, "_blank", "noopener,noreferrer");
    return;
  }

  // Treat as storage path: generate a signed URL.
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(pathOrUrl, expiresIn);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Could not generate file URL");
  }
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}
