import { z } from "zod";

export const productVariantSchema = z.object({
  id: z.string().optional(), // present when editing an existing variant
  name: z.string().min(1, "Variant name is required").max(50),
  value: z.string().min(1, "Variant value is required").max(50),
  stock_quantity: z.coerce.number().int().min(0),
  price_adjustment: z.coerce.number().default(0),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(150),
  description: z.string().trim().max(3000).optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  category_id: z.string().uuid("Choose a category"),
  stock_quantity: z.coerce.number().int().min(0),
  is_preorder: z.boolean().default(false),
  preorder_fulfillment_note: z.string().trim().max(200).optional(),
  status: z.enum(["active", "draft", "archived"]).default("active"),
  variants: z.array(productVariantSchema).optional().default([]),
});

export type ProductInput = z.infer<typeof productSchema>;

// Allowed image types/size — enforced server-side, not just in the file picker
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB raw upload cap, Cloudinary resizes down