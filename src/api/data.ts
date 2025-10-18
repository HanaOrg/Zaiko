import Database from "@tauri-apps/plugin-sql";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import {
  type Inventory,
  isValidInventory,
  isValidItem,
  type Settings,
} from "../types/types";
import { normalize, validate } from "@zakahacecosas/string-utils";
import { save, open, confirm } from "@tauri-apps/plugin-dialog";
import xlsx from "json-as-xlsx";
import { json2csv } from "json-2-csv";
import { InventoryItem } from "../types/types";
import { uuidv7 } from "uuidv7";

export const DEFAULT_PREFERENCES: Settings = {
  app_name: "Zaiko",
  theme: "light",
  warn_threshold: 20,
  critical_threshold: 5,
};

export function fmtName(s: string): string {
  return validate(s) ? normalize(s, { preserveCase: false }) : "";
}

export async function getUserData(concretely: "inventory"): Promise<Inventory>;
export async function getUserData(concretely: "settings"): Promise<Settings>;
export async function getUserData(
  concretely: "settings" | "inventory",
): Promise<Settings | Inventory> {
  const db = await setupDB();
  if (concretely === "inventory") {
    const sets = await db.select(
      `
    SELECT * FROM inv_sets
  `,
    );
    const items = await db.select("SELECT * FROM inv_items");

    const inventory: Inventory = {};

    for (const set of sets as any) {
      inventory[set.name] = { id: set.id, items: [] };
    }

    for (const item of items as any) {
      const { set_id, ...row } = item as any;
      if (!isValidItem(item)) {
        console.warn(`Invalidated ${item} from DB. Something's wrong.`);
        continue;
      }
      const set_name = (sets as any).find(
        (s: { id: string; name: string }) => s.id === set_id,
      ).name;
      inventory[set_name]!.items.push(row);
    }

    return inventory;
  }
  return ((await db.select("SELECT * FROM settings")) as any)[0];
}

/** use 0 to indicate settings, 1 to indicate inventory */
export async function setUserData(to: 0, data: Settings): Promise<void>;
export async function setUserData(
  to: 1,
  data:
    | string
    | {
        set_id: string | 0;
        item: InventoryItem | InventoryItem[] | 0;
        gen?: string;
      },
): Promise<void>;
export async function setUserData(
  to: 0 | 1,
  data:
    | Settings
    | string
    | {
        set_id: string | 0;
        item: InventoryItem | InventoryItem[] | 0;
        gen?: string;
      },
): Promise<void> {
  const db = await setupDB();
  if (to === 0) {
    const d = data as Settings;
    await db.execute(
      "REPLACE INTO settings (id, app_name, theme, warn_threshold, critical_threshold) VALUES (1, $1, $2, $3, $4)",
      [d.app_name, d.theme, d.warn_threshold, d.critical_threshold],
    );
  } else {
    if (typeof data === "string") {
      await db.execute("INSERT INTO inv_sets (id, name) VALUES ($1, $2)", [
        uuidv7(),
        fmtName(data),
      ]);
    } else {
      const d = data as {
        set_id: string;
        item: InventoryItem | InventoryItem[] | 0;
        gen?: string;
      };
      if (d.gen) {
        await db.execute("INSERT INTO inv_sets (id, name) VALUES ($1, $2)", [
          d.set_id,
          fmtName(d.gen),
        ]);
      }
      if (Array.isArray(d.item)) {
        d.item.forEach(async (item) => {
          await db.execute(
            "INSERT INTO inv_items (set_id, name, description, stock, barcode, zaikode, id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [
              d.set_id,
              item.name,
              item.description,
              item.stock,
              item.barcode,
              item.zaikode,
              uuidv7(),
            ],
          );
        });
      } else if (d.item === 0) {
        await db.execute("DELETE * FROM inv_sets WHERE id = $1", [d.set_id]);
        await db.execute("DELETE * FROM inv_items WHERE set_id = $1", [
          d.set_id,
        ]);
      } else {
        await db.execute(
          "INSERT INTO inv_items (set_id, name, description, stock, barcode, zaikode) VALUES ($1, $2, $3, $4, $5, $6)",
          [
            d.set_id,
            d.item.name,
            d.item.description,
            d.item.stock,
            d.item.barcode,
            d.item.zaikode,
          ],
        );
      }
    }
  }

  return;
}

export async function createSet(setName: string): Promise<void> {
  const inv = await getUserData("inventory");
  if (inv[fmtName(setName)]) return;
  await setUserData(1, setName);
}
export async function createItem(
  item: InventoryItem,
  at: string,
  edit: { item: InventoryItem; set: string } | null,
): Promise<void> {
  const inv = await getUserData("inventory");
  const set = fmtName(at);

  if (!inv[set]) return;

  if (!edit && inv[set].items.map((i) => i.id).includes(item.id)) return;

  if (edit) {
    const db = await setupDB();
    await db.execute(
      [
        "UPDATE inv_items",
        "SET name = $1, description = $2, barcode = $3, zaikode = $4",
        "WHERE id = $5",
      ].join("\n"),
      [item.name, item.description, item.barcode, item.zaikode, edit.item.id],
    );
    return;
  }

  await setUserData(1, {
    set_id: inv[set].id,
    item: [item],
  });
}

export async function refreshZaiko() {
  const db = await setupDB();
  await db.execute("DELETE FROM inv_items");
  await db.execute("DELETE FROM inv_sets");
  await setUserData(0, DEFAULT_PREFERENCES);
  return;
}

export async function overwriteStock(params: {
  item: InventoryItem;
  set: string;
  stock: number;
  action: "overwrite" | "increment" | "decrement";
}) {
  const { item, set, stock, action } = params;
  const inv = await getUserData("inventory");
  const foundSet = inv[fmtName(set)];
  if (!foundSet) return;
  const foundItem = foundSet.items.find((i) => i.id === item.id);
  if (!foundItem) return;

  let newStock: number | null = null;

  if (action === "overwrite") newStock = stock;
  if (action === "increment") newStock = foundItem.stock + stock;
  if (action === "decrement") newStock = foundItem.stock - stock;

  if (!newStock || isNaN(newStock)) throw `newStock not set or not number`;

  const db = await setupDB();
  await db.execute(
    ["UPDATE inv_items", "SET stock = $1", "WHERE id = $2"].join("\n"),
    [newStock, item.id],
  );
}

export async function deleteItem(params: { item: InventoryItem; set: string }) {
  const { item, set } = params;
  const inv = await getUserData("inventory");
  const foundSet = inv[fmtName(set)];
  if (!foundSet) return;
  await (
    await setupDB()
  ).execute("DELETE FROM inv_items WHERE set_id = $1 AND id = $2", [
    foundSet.id,
    item.id,
  ]);
}

export async function deleteSet(set: string) {
  const inv = await getUserData("inventory");
  if (!inv[fmtName(set)]) return;
  const id = inv[fmtName(set)]!.id;
  const db = await setupDB();
  await db.execute("DELETE FROM inv_items WHERE set_id = $1", [id]);
  await db.execute("DELETE FROM inv_sets WHERE id = $1", [id]);
}

export async function exportData(format: "csv" | "json" | "xlsx") {
  const path =
    format === "xlsx"
      ? "a"
      : await save({
          title: "Where to export data to?",
          canCreateDirectories: true,
          defaultPath: "zaiko-inventory",
          filters:
            format === "json"
              ? [
                  {
                    name: "Valid JSON files",
                    extensions: ["json"],
                  },
                ]
              : format === "csv"
                ? [
                    {
                      name: "Valid CSV files",
                      extensions: ["csv"],
                    },
                  ]
                : [
                    {
                      name: "Valid Excel files",
                      extensions: ["xlsx"],
                    },
                  ],
        });
  if (!path) return;

  const data = await getUserData("inventory");

  if (format === "json") {
    await writeTextFile(path, JSON.stringify(data));
    return;
  } else if (format === "csv") {
    await writeTextFile(
      path,
      json2csv(
        Object.entries(data).map(([k, i]) =>
          i.items.map((it) => {
            return {
              "Parent SET Name": k,
              "ITEM Name": it.name,
              "ITEM Description": it.description,
              "ITEM Stock": it.stock,
            };
          }),
        ),
        {
          arrayIndexesAsKeys: false,
          checkSchemaDifferences: false,
          emptyFieldValue: "(NOT PROVIDED)",
          excelBOM: true,
          expandNestedObjects: false,
          expandArrayObjects: false,
        },
      ),
    );
    return;
  } else {
    const excelData = Object.entries(data).map(([k, i]) => {
      return {
        sheet: k,
        columns: [
          {
            label: "Name",
            value: (row: any) => row.name,
          },
          {
            label: "Stock",
            value: (row: any) => row.stock,
          },
          {
            label: "Description",
            value: (row: any) => row.desc ?? "(NOT PROVIDED)",
          },
          {
            label: "Barcode",
            value: (row: any) => row.barcode ?? "(NOT PROVIDED)",
          },
          {
            label: "Zaiko Barcode",
            value: (row: any) => row.zaikode ?? "(NOT PROVIDED)",
          },
        ],
        content: i.items.map((it) => {
          return {
            name: it.name,
            stock: it.stock,
            desc: it.description ?? null,
            barcode: it.barcode ?? null,
            zaikode: it.zaikode ?? null,
          };
        }),
      };
    });

    // TODO: this always saves to /Downloads, not to where the user specifies
    xlsx(excelData, {
      fileName: "zaiko-inventory",
      extraLength: 5,
      writeMode: "writeFile", // https://docs.sheetjs.com/docs/solutions/output#example-remote-file
      writeOptions: {}, // https://docs.sheetjs.com/docs/api/write-options
      RTL: false,
    });
    return;
  }
}

export async function importData(): Promise<
  "invalidData" | "noPath" | "isn'tJson" | "aborted" | 0
> {
  const path = await open({
    multiple: false,
    directory: false,
    filters: [
      {
        name: "Valid JSON files",
        extensions: ["json"],
      },
    ],
  });
  if (!path) return "noPath";
  const content = await readTextFile(path);

  try {
    JSON.parse(content);
  } catch {
    return "isn'tJson";
  }

  const obj = JSON.parse(content);

  if (!isValidInventory(obj)) return "invalidData";

  // bless https://stackoverflow.com/a/56116458
  const proceed = await confirm(
    `Are you sure? Importing this file with ${Object.keys(obj).length} sets (totalling ${Object.values(obj).reduce((count, current) => count + current.items.length, 0)} items) will overwrite all of your existing data.`,
    {
      title: "Zaiko",
      kind: "warning",
      okLabel: "Import",
      cancelLabel: "Never mind",
    },
  );

  if (!proceed) return "aborted";

  Object.entries(obj).forEach(async (o) => {
    await setUserData(1, { set_id: o[1].id, item: o[1].items, gen: o[0] });
  });

  return 0;
}

async function setupDB() {
  const database = await Database.load("sqlite:zaiko.db");
  await database.execute(`PRAGMA foreign_keys = ON;`);
  await database.execute(`
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    theme TEXT CHECK(theme IN ('dark','light')) NOT NULL DEFAULT 'light',
    app_name TEXT NOT NULL DEFAULT 'Zaiko',
    warn_threshold INTEGER NOT NULL DEFAULT 20,
    critical_threshold INTEGER NOT NULL DEFAULT 5
);
`);
  await database.execute(`
INSERT INTO settings (id)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);
`);
  await database.execute(`CREATE TABLE IF NOT EXISTS inv_sets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
`);
  await database.execute(`CREATE TABLE IF NOT EXISTS inv_items (
    id TEXT PRIMARY KEY,
    set_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    stock INTEGER NOT NULL,
    barcode TEXT,
    zaikode TEXT,
    FOREIGN KEY (set_id) REFERENCES inv_sets(id)
);
`);
  return database;
}
