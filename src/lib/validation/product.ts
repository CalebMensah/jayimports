import { z } from "zod";

export const productColorSchema = z.object({
  client_id: z.string(), // stable id used to link colors -> stock rows, even before saving
  color_name: z.string().trim().min(1, "Color name is required").max(50),
  image_url: z.string().url("Upload an image for this color"),
});

export const productSizeSchema = z.object({
  client_id: z.string(),
  size_value: z.string().trim().min(1, "Size is required").max(30),
  price_adjustment: z.coerce.number().default(0),
});

export const colorSizeStockSchema = z.object({
  color_client_id: z.string(),
  size_client_id: z.string(),
  stock_quantity: z.coerce.number().int().min(0),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(150),
  description: z.string().trim().max(3000).optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  category_id: z.string().uuid("Choose a category"),
  stock_quantity: z.coerce.number().int().min(0), // used only when no colors exist
  moq: z.coerce.number().int().min(1, "MOQ must be at least 1").default(1),
  is_preorder: z.boolean().default(false),
  preorder_fulfillment_note: z.string().trim().max(200).optional(),
  status: z.enum(["active", "draft", "archived"]).default("active"),
  colors: z.array(productColorSchema).optional().default([]),
  sizes: z.array(productSizeSchema).optional().default([]),
  stock: z.array(colorSizeStockSchema).optional().default([]),
});

export type ProductInput = z.infer<typeof productSchema>;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;