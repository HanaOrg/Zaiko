import { save } from "@tauri-apps/plugin-dialog";
import { InventoryItem } from "../types/types";
import { writeFile } from "@tauri-apps/plugin-fs";
import JsBarcode from "jsbarcode";
import { isEven, isOdd, sumArray } from "@zakahacecosas/number-utils";

function validateEAN13(code: string): { valid: boolean; code: string | null } {
  const numbers = code
    .split("")
    .map((c) => parseInt(c))
    .filter((n) => !isNaN(n));

  if (numbers.length !== 13 || !numbers.every((n) => isNaN(n) == false))
    return { valid: false, code: null };

  const evens = sumArray(numbers.filter((_, i) => isEven(i + 1))) * 3;
  const odds = sumArray(numbers.filter((_, i) => isOdd(i + 1) && i < 12));
  const sum = odds + evens;
  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;

  if (checkDigit !== numbers[12]) {
    return { valid: false, code: null };
  }
  return { valid: true, code: code };
}

function validateUPCa(code: string): { valid: boolean; code: string | null } {
  const numbers = code
    .split("")
    .map((c) => parseInt(c))
    .filter((n) => !isNaN(n));

  if (numbers.length !== 12 || !numbers.every((n) => isNaN(n) == false))
    return { valid: false, code: null };

  const odds = sumArray(numbers.filter((_, i) => isOdd(i + 1))) * 3;
  const evens = sumArray(numbers.filter((_, i) => isEven(i + 1) && i < 11));
  const sum = odds + evens;
  const nextTenMultiple = Math.ceil(sum / 10) * 10;
  const checkDigit = nextTenMultiple - sum;

  if (checkDigit !== numbers[11]) {
    return { valid: false, code: null };
  }
  return { valid: true, code: code };
}

export function validateBarcode(code: string): {
  valid: boolean;
  type: "EAN-13" | "UPC-A" | null;
  code: string | null;
} {
  const justNumbers = /^\d+$/.test(code);
  if (!justNumbers) return { valid: false, type: null, code: null };

  const len = code.length;
  const UPCa = validateUPCa(code);
  const EAN13 = validateEAN13(code);

  if (len === 12) return { valid: UPCa.valid, type: "UPC-A", code: UPCa.code };
  if (len === 13)
    return { valid: EAN13.valid, type: "EAN-13", code: EAN13.code };

  return { valid: false, type: null, code: null };
}

function dataURLtoUint8Array(dataURL: string): Uint8Array {
  const base64 = dataURL.split(",")[1];
  if (!base64) throw new Error("Data URL (base64encoded) lacks comma (,).");
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function generateBarcode(
  item: InventoryItem,
  what: "zaiko" | "irl",
) {
  const barcode = what === "zaiko" ? item.zaikode : item.barcode;
  if (!barcode) return;

  const path = await save({
    title: "Where to save barcode image to?",
    canCreateDirectories: true,
    defaultPath: item.name,
    filters: [
      {
        name: "Valid PNG image files",
        extensions: ["png"],
      },
    ],
  });

  if (!path) return;

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("xmlns", svgNS);
  svg.setAttribute("width", "400");
  svg.setAttribute("height", "200");
  svg.setAttribute("viewBox", "0 0 200 100");

  const format =
    what === "zaiko"
      ? "CODE128"
      : validateBarcode(barcode).type === "EAN-13"
        ? "EAN13"
        : "UPC";

  JsBarcode(svg, barcode, {
    format,
    lineColor: "#000",
    width: 4,
    height: 200,
    displayValue: true,
  });

  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Error loading SVG as image"));
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");

  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);

  const pngDataUrl = canvas.toDataURL("image/png");
  const pngBytes = dataURLtoUint8Array(pngDataUrl);

  await writeFile(path, pngBytes);
}
