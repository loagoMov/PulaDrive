const BUCKET = "vehicle-images";

/**
 * Given an array of Supabase public image URLs, extracts their storage paths
 * and removes them from the "vehicle-images" bucket using the authenticated
 * Clerk JWT (same pattern as uploads).
 *
 * URLs are expected to look like:
 *   https://<project>.supabase.co/storage/v1/object/public/vehicle-images/listings/filename.jpg
 *
 * @param imageUrls  Array of public Supabase storage URLs to delete
 * @param authToken  Clerk JWT from the "supabase" template — required for authed deletes
 */
export async function deleteVehicleImages(
  imageUrls: string[],
  authToken?: string
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || imageUrls.length === 0) return;

  const publicBase = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/`;

  // Extract relative storage paths for URLs that belong to our bucket
  const paths = imageUrls
    .filter((url) => url.startsWith(publicBase))
    .map((url) => url.slice(publicBase.length));

  if (paths.length === 0) return;

  // Use the Clerk JWT if available, otherwise fall back to the anon key
  const bearerToken = authToken ?? supabaseAnonKey;

  const deleteUrl = `${supabaseUrl}/storage/v1/object/${BUCKET}`;

  const res = await fetch(deleteUrl, {
    method: "DELETE",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefixes: paths }),
  });

  if (!res.ok) {
    const err = await res.text();
    // Non-fatal: log but don't block the listing deletion
    console.warn("Supabase image cleanup warning:", err);
  }
}
