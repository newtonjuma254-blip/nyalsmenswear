import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

export const CATEGORIES = [
  { name: "Suits & Blazers", slug: "Suits", img: "https://images.unsplash.com/photo-1594938298603-c8148c4b4b6a?q=80&w=700&auto=format&fit=crop", desc: "Tailored perfection" },
  { name: "Dress Shirts", slug: "Shirts", img: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=700&auto=format&fit=crop", desc: "Sharp essentials" },
  { name: "Trousers", slug: "Trousers", img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=700&auto=format&fit=crop", desc: "Clean lines" },
  { name: "Footwear", slug: "Footwear", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=700&auto=format&fit=crop", desc: "Step in style" },
  { name: "Accessories", slug: "Accessories", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=700&auto=format&fit=crop", desc: "The finishing touch" },
  { name: "Casual Wear", slug: "Casual", img: "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?q=80&w=700&auto=format&fit=crop", desc: "Everyday refined" },
];

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
