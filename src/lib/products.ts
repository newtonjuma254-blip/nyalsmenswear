import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

export const CATEGORIES = [
  { name: "Suits & Blazers", slug: "Suits", images: [
    "https://images.unsplash.com/photo-1594938298603-c8148c4b4b6a?q=80&w=700&auto=format&fit=crop",
    "https://i.postimg.cc/0yPNn23G/OIP.webp",
    "https://i.postimg.cc/x1nd5T7y/download.webp",
  ], desc: "Tailored perfection" },
  { name: "Dress Shirts", slug: "Shirts", images: [
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=700&auto=format&fit=crop",
    "https://i.postimg.cc/mrSCj58M/71lg-A5q7QQL.jpg",
    "https://i.postimg.cc/HLtXzhBM/COSFO-Short-Sleeve-Mens-Button-Down-Shirt-Casual-Collared-Solid-Tops-with-Pocket-Cotton-Linen-Regula.jpg",
  ], desc: "Sharp essentials" },
  { name: "Trousers", slug: "Trousers", images: ["https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=700&auto=format&fit=crop"], desc: "Clean lines" },
  { name: "Footwear", slug: "Footwear", images: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=700&auto=format&fit=crop",
    "https://i.postimg.cc/Sx3vqJ40/OIP-(1).webp",
    "https://i.postimg.cc/TPbHPfdS/product-jpeg.jpg",
  ], desc: "Step in style" },
  { name: "Accessories", slug: "Accessories", images: [
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=700&auto=format&fit=crop",
    "https://i.postimg.cc/N0G73tyb/New-Fashion-Men-Messenger-Bags-Casual-Mens-Leather-Chest-Bags-Big-Chest-Back-Pack-Male-Shoulder.jpg",
    "https://i.postimg.cc/mrZNv4cj/OIP-(2).webp",
  ], desc: "The finishing touch" },
  { name: "Casual Wear", slug: "Casual", images: [
    "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?q=80&w=700&auto=format&fit=crop",
    "https://i.postimg.cc/GmgHpn7W/68fb87fda6cc39a141cfa8f97c6a43e3.jpg",
    "https://i.postimg.cc/8CFsJX9Y/acbcc6f204ea32535e707dc6be9c8393.png",
    "https://i.postimg.cc/MpQhnydw/2017-NEW-fashion-brand-casual-fitness-tshirt-striped-patchwork-Long-Sleeve-t-shirt-men-Slim-Fit.jpg",
    "https://i.postimg.cc/htdHX9pF/SD-03-T28-6711M-Z4-X-EC-0.jpg",
  ], desc: "Everyday refined" },
];

import nyalsLogoAsset from "@/assets/nyals-logo.png.asset.json";
export const NYALS_LOGO_URL = nyalsLogoAsset.url;

export const ALL_CATEGORIES = ["Suits", "Blazers", "Shirts", "Trousers", "Footwear", "Accessories", "Casual"];

export async function fetchProducts(cat: string = "All"): Promise<Product[]> {
  let q = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (cat !== "All") q = q.eq("category", cat);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export function formatKES(n: number | string | null | undefined) {
  if (n == null) return "";
  const num = typeof n === "string" ? parseFloat(n) : n;
  return `KES ${num.toLocaleString()}`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
