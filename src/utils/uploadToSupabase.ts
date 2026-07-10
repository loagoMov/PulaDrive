/**
 * Uploads a single image file to Supabase Storage and returns its public URL.
 * Pass a Clerk session token (from the "supabase" template) as authToken so
 * the upload satisfies the authenticated RLS policy on the bucket.
 *
 * @param file       The file (already compressed) to upload
 * @param folder     Sub-folder within the bucket, e.g. "listings"
 * @param authToken  Clerk JWT (supabase template) — required for authed uploads
 * @returns          The public URL of the uploaded file
 */
export async function uploadVehicleImage(
  file: File,
  folder = "listings",
  authToken?: string
): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Generate a unique filename: <timestamp>-<random>.<ext>
  const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${folder}/${filename}`;

  const uploadUrl = `${supabaseUrl}/storage/v1/object/vehicle-images/${path}`;

  // Use the Clerk JWT if available, otherwise fall back to the anon key
  const bearerToken = authToken ?? supabaseAnonKey;

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upload failed: ${err}`);
  }

  // Construct the public URL
  return `${supabaseUrl}/storage/v1/object/public/vehicle-images/${path}`;
}
