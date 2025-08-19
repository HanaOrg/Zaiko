import {
  writeTextFile,
  exists,
  BaseDirectory,
  create,
  readTextFile,
  mkdir,
} from "@tauri-apps/plugin-fs";
import {
  Inventory,
  InventoryItem,
  InventorySet,
  isValidInventory,
  Settings,
} from "../types/types";
import { normalize, validate } from "@zakahacecosas/string-utils";
import { save, open, confirm } from "@tauri-apps/plugin-dialog";
import xlsx from "json-as-xlsx";
import { json2csv } from "json-2-csv";
import { appDataDir } from "@tauri-apps/api/path";

export const DEFAULT_PREFERENCES: Settings = {
  appName: "Zaiko",
  theme: "light",
  warnThreshold: 20,
  criticalThreshold: 5,
};

export function fmtName(s: string): string {
  return validate(s) ? normalize(s, { preserveCase: false }) : "";
}

export async function getUserData(concretely: "inventory"): Promise<Inventory>;
export async function getUserData(concretely: "settings"): Promise<Settings>;
export async function getUserData(
  concretely: "settings" | "inventory",
): Promise<Settings | Inventory> {
  const path = concretely === "settings" ? "settings.json" : "inventory.json";
  const defaultData = concretely === "settings" ? DEFAULT_PREFERENCES : [];
  if (!(await exists(await appDataDir()))) {
    await mkdir(await appDataDir());
  }
  const hasData = await exists(path, {
    baseDir: BaseDirectory.AppData,
  });
  if (!hasData) {
    const newFile = await create(path, {
      baseDir: BaseDirectory.AppData,
    });
    await newFile.write(new TextEncoder().encode(JSON.stringify(defaultData)));
    await newFile.close();
    return defaultData;
  }
  const data = await readTextFile(path, {
    baseDir: BaseDirectory.AppData,
  });
  if (!validate(data)) return defaultData;
  try {
    const returnedData = JSON.parse(data);
    if (concretely === "inventory") {
      const r = returnedData as Inventory;

      r.forEach((i) => {
        i.items = i.items.filter(
          (i) =>
            typeof i === "object" &&
            i !== null &&
            "name" in i &&
            validate(i.name),
        );
      });

      return r;
    }
    return {
      ...DEFAULT_PREFERENCES,
      ...returnedData,
      appName: validate(returnedData.appName) ? returnedData.appName : "Zaiko",
    };
  } catch {
    return defaultData;
  }
}

export async function setUserData(to: Settings | Inventory): Promise<void> {
  const path = Array.isArray(to) ? "inventory.json" : "settings.json";
  await writeTextFile(path, JSON.stringify(to), {
    baseDir: BaseDirectory.AppData,
  });
  return;
}

export async function createSet(setName: string): Promise<void> {
  const inv = await getUserData("inventory");

  const set: InventorySet = {
    name: fmtName(setName),
    items: [],
  };

  if (inv.map((i) => fmtName(i.name)).includes(set.name)) return;

  const newInv: Inventory = [set, ...inv];

  await setUserData(newInv);
}
export async function createItem(
  item: InventoryItem,
  at: string,
  edit: { item: InventoryItem; set: InventorySet } | null,
): Promise<void> {
  const inv = await getUserData("inventory");
  const set = inv.find((s) => fmtName(s.name) === fmtName(at));

  if (!set) return;

  if (
    !edit &&
    set.items.map((i) => fmtName(i.name)).includes(fmtName(item.name))
  )
    return;

  const items =
    edit === null
      ? [...set.items, item]
      : [...set.items.filter((i) => i.name !== edit.item.name), item];

  const newSet = {
    name: set.name,
    items,
  };

  const newInv = [
    ...inv.filter((s) => fmtName(s.name) !== fmtName(at)),
    newSet,
  ];

  await setUserData(newInv);
}

export async function refreshZaiko() {
  await writeTextFile("inventory.json", JSON.stringify([]), {
    baseDir: BaseDirectory.AppData,
  });
  return;
}

export async function overwriteStock(params: {
  item: string;
  set: string;
  stock: number;
  action: "overwrite" | "increment" | "decrement";
}) {
  const { item, set, stock, action } = params;
  const inv = await getUserData("inventory");
  const foundSet = inv.find((s) => fmtName(s.name) === fmtName(set));
  if (!foundSet) return;
  const foundItem = foundSet.items.find(
    (i) => fmtName(i.name) === fmtName(item),
  );
  if (!foundItem) return;

  if (action === "overwrite") foundItem.stock = stock;
  if (action === "increment") foundItem.stock += stock;
  if (action === "decrement") foundItem.stock -= stock;

  await setUserData(inv);
}

export async function deleteItem(params: { item: string; set: string }) {
  const { item, set } = params;
  const inv = await getUserData("inventory");
  const foundSet = inv.find((s) => fmtName(s.name) === fmtName(set));
  if (!foundSet) return;
  const newInv = inv.map((s) => {
    if (fmtName(s.name) !== fmtName(set)) return s;
    return {
      ...s,
      items: s.items.filter((i) => fmtName(i.name) !== fmtName(item)),
    };
  });
  await setUserData(newInv);
}

export async function deleteSet(set: string) {
  const inv = await getUserData("inventory");
  const foundSet = inv.find((s) => fmtName(s.name) === fmtName(set));
  if (!foundSet) return;
  const newInv = inv.filter((s) => fmtName(s.name) !== fmtName(set));
  await setUserData(newInv);
}

export async function exportData(format: "csv" | "json" | "xlsx") {
  const path = await save({
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
    await writeTextFile(path, JSON.stringify(data, undefined, 4));
    return;
  } else if (format === "csv") {
    await writeTextFile(
      path,
      json2csv(
        data.flatMap((s) =>
          s.items.map((i) => {
            return {
              "Parent SET Name": s.name,
              "ITEM Name": i.name,
              "ITEM Description": i.description,
              "ITEM Stock": i.stock,
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
    const excelData = data.map((s) => {
      return {
        sheet: fmtName(s.name),
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
        content: s.items.map((i) => {
          return {
            name: i.name,
            stock: i.stock,
            desc: i.description ?? null,
            barcode: i.barcode ?? null,
            zaikode: i.zaikode ?? null,
          };
        }),
      };
    });

    xlsx(excelData, {
      fileName: path,
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
    `Are you sure? Importing this file with ${obj.length} sets (totalling ${obj.reduce((count, current) => count + current.items.length, 0)} items) will overwrite all of your existing data.`,
    {
      title: "Zaiko",
      kind: "warning",
      okLabel: "Import",
      cancelLabel: "Never mind",
    },
  );

  if (!proceed) return "aborted";

  await setUserData(obj);

  return 0;
}
