import { validate } from "@zakahacecosas/string-utils";
import { validateBarcode } from "../api/barcode";

/** App preferences. */
export interface Settings {
  /** App theme. */
  theme: "dark" | "light";
  /** Zaiko allows customizing the app name. */
  app_name: string;
  /** Threshold for showing stock warning. */
  warn_threshold: number;
  /** Threshold for showing stock critical warning. */
  critical_threshold: number;
}

export interface InventoryItem {
  /** Item's UUIDv7 */
  id: string;
  /** Unique and required. */
  name: string;
  /** Non required. */
  description: string | undefined;
  /** Obviously required. */
  stock: number;
  /** Either EAN-13 or UPC-A. Non required. */
  barcode: string | undefined;
  /** Code 128. Non required. */
  zaikode: string | undefined;
}

/** Zaiko Inventory */
export type Inventory = Record<string, { id: string; items: InventoryItem[] }>;

export function isValidItem(item: any): item is InventoryItem {
  if (!item || typeof item !== "object") return false;
  if (!validate(item.name)) return false;
  if (typeof item.stock !== "number" || item.stock == null || isNaN(item.stock))
    return false;
  if (item.description && typeof item.description !== "string") return false;
  if (item.barcode && validateBarcode(item.barcode).valid == false)
    return false;
  if (
    item.zaikode &&
    (!validate(item.zaikode) || !item.zaikode.startsWith("ZAIKO-ITEM"))
  )
    return false;
  return true;
}

export function isValidInventory(inv: any): inv is Inventory {
  if (!inv || typeof inv !== "object") return false;
  const keys = Object.keys(inv);
  const vals = Object.values(inv);
  if (!keys.every((key) => validate(key))) return false;
  if (!vals.every(isValidItem)) return false;
  return true;
}
