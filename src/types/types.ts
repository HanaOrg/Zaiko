import { validate } from "@zakahacecosas/string-utils";
import { validateBarcode } from "../api/barcode";

/** App preferences. */
export interface Settings {
  /** App theme. */
  theme: "dark" | "light";
  /** Zaiko allows customizing the app name. */
  appName: string;
  /** Threshold for showing stock warning. */
  warnThreshold: number;
  /** Threshold for showing stock critical warning. */
  criticalThreshold: number;
}

export interface InventoryItem {
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

export interface InventorySet {
  /** Unique and required. */
  name: string;
  items: InventoryItem[];
}

/** Zaiko Inventory */
export type Inventory = InventorySet[];

export function isValidItem(item: any): item is InventoryItem {
  if (!item || typeof item !== "object") return false;
  if (!validate(item.name)) return false;
  if (!item.stock || isNaN(item.stock)) return false;
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

export function isValidSet(set: any): set is InventorySet {
  if (!set || typeof set !== "object") return false;
  if (!validate(set.name)) return false;
  if (!set.items) return false;
  if (!set.items.every(isValidItem)) return false;
  return true;
}

export function isValidInventory(inv: any): inv is Inventory {
  if (!inv || !Array.isArray(inv)) return false;
  if (!inv.every(isValidSet)) return false;
  return true;
}
