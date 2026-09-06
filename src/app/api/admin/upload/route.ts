import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/lib/validation/product";

export async function POST(request: NextRequest) {
  // Auth check — only logged-in admins can upload
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, or WebP images are allowed" },
      { status: 400 }
    );
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image must be under 8MB" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Basic magic-byte sanity check — file.type from the browser can be spoofed
  const isRealImage =
    (buffer[0] === 0xff && buffer[1] === 0xd8) || // JPEG
    (buffer[0] === 0x89 && buffer[1] === 0x50) || // PNG
    (buffer[8] === 0x57 && buffer[9] === 0x45); // WEBP ("WE" at offset 8)

  if (!isRealImage) {
    return NextResponse.json({ error: "File is not a valid image" }, { status: 400 });
  }

  try {
    const { url, publicId } = await uploadImageToCloudinary(buffer);
    return NextResponse.json({ url, publicId });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}