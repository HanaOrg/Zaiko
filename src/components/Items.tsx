import { fmtName } from "../api/data";
import { InventoryItem, InventorySet, Settings } from "../types/types";
import {
  Button,
  Chip,
  Input,
  Divider,
  ButtonGroup,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
} from "@heroui/react";
import { validate, normalize } from "@zakahacecosas/string-utils";
import { useState } from "react";
import { generateBarcode, validateBarcode } from "../api/barcode";
import { useNavigate } from "react-router";

type MatchSet = { type: "set"; set: InventorySet };
type MatchItem = { type: "item"; set: InventorySet; item: InventoryItem };
type Matches = MatchSet | MatchItem;

export type ModalCallback = (a: {
  visible: boolean;
  item: string;
  set: string;
}) => void;

function ListedItem({
  colorizer,
  parentSet,
  item,
  setOverwriteStockModal,
  setIncrementStockModal,
  setDecrementStockModal,
  setDeleteItemModal,
  settings,
}: {
  colorizer: string | null;
  parentSet: InventorySet;
  item: InventoryItem;
  setOverwriteStockModal: ModalCallback;
  setIncrementStockModal: ModalCallback;
  setDecrementStockModal: ModalCallback;
  setDeleteItemModal: ModalCallback;
  settings: Settings;
}) {
  const navigate = useNavigate();

  function colorizeMatch(str: string) {
    if (!validate(colorizer)) return str;
    const normalizedSet = new Set(colorizer.split("").map((s) => normalize(s)));
    return str
      .split("")
      .map((c) =>
        normalizedSet.has(normalize(c)) ? (
          <span className="text-primary-500 font-bold">{c}</span>
        ) : (
          c
        ),
      );
  }

  return (
    <Card key={fmtName(item.name)} className="flex items-start justify-between">
      <CardHeader>
        <h3 className="text-lg mr-auto">{colorizeMatch(item.name)}</h3>
        <Chip
          color={
            item.stock <= settings.criticalThreshold
              ? "danger"
              : item.stock <= settings.warnThreshold
                ? "warning"
                : "primary"
          }
        >
          {item.stock}
        </Chip>
      </CardHeader>
      <CardBody className="pt-0">
        <p className="italic">
          {item.description && colorizeMatch(item.description)}
        </p>
        <p className="italic">
          {item.barcode && (
            <>
              {validateBarcode(item.barcode).type} barcode:{" "}
              <b>{colorizeMatch(item.barcode)}</b>
            </>
          )}
        </p>
        <p className="italic">
          {item.zaikode && (
            <>
              {item.zaikode} (<i>Code128 / Zaiko-only</i>)
            </>
          )}
        </p>
        <div className="mt-1">
          <ButtonGroup className="me-2">
            <Button
              color="primary"
              onPress={() =>
                setOverwriteStockModal({
                  visible: true,
                  item: item.name,
                  set: parentSet.name,
                })
              }
            >
              <b>•</b> Manually set stock
            </Button>
            <Button
              color="secondary"
              onPress={() =>
                setIncrementStockModal({
                  visible: true,
                  item: item.name,
                  set: parentSet.name,
                })
              }
            >
              <b>+</b> Increment stock
            </Button>
            <Button
              color="secondary"
              onPress={() =>
                setDecrementStockModal({
                  visible: true,
                  item: item.name,
                  set: parentSet.name,
                })
              }
            >
              <b>-</b> Decrease stock
            </Button>
            <Button
              href="#"
              variant="flat"
              color="primary"
              onPress={() =>
                navigate(
                  `/create-item?edit=true&item=${encodeURIComponent(JSON.stringify(item))}&set=${encodeURIComponent(JSON.stringify(parentSet))}`,
                )
              }
            >
              Edit this item
            </Button>
            <Button
              color="danger"
              onPress={() =>
                setDeleteItemModal({
                  visible: true,
                  item: item.name,
                  set: parentSet.name,
                })
              }
            >
              <b>X</b> Delete
            </Button>
          </ButtonGroup>
          {(item.barcode || item.zaikode) && (
            <ButtonGroup>
              {item.barcode && (
                <Button
                  color="default"
                  onPress={() => generateBarcode(item, "irl")}
                >
                  <b>[=]</b> Export {validateBarcode(item.barcode).type} barcode
                </Button>
              )}
              {item.zaikode && (
                <Button
                  color="default"
                  onPress={() => generateBarcode(item, "zaiko")}
                >
                  <b>|=|</b> Export Zaiko-only barcode
                </Button>
              )}
            </ButtonGroup>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export function ItemsList({
  inventory,
  setOverwriteStockModal,
  setIncrementStockModal,
  setDecrementStockModal,
  setDeleteItemModal,
  setDeleteSetModal,
  settings,
}: {
  inventory: InventorySet[];
  setOverwriteStockModal: ModalCallback;
  setIncrementStockModal: ModalCallback;
  setDecrementStockModal: ModalCallback;
  setDeleteItemModal: ModalCallback;
  setDeleteSetModal: ModalCallback;
  settings: Settings;
}) {
  const [matches, setMatches] = useState<Matches[]>([]);
  const [searchQ, setSearchQ] = useState<string>("");

  function search(query: string) {
    setSearchQ(query.trim());

    const newMatches: Matches[] = [];

    inventory.forEach((set) => {
      const setMatch = fmtName(set.name).includes(fmtName(query));
      const matchingItems = set.items.filter(
        (item) =>
          fmtName(item.name).includes(fmtName(query)) ||
          (item.barcode || "").includes(query) ||
          (item.description || "").includes(query),
      );

      newMatches.push(
        ...matchingItems.map((item) => {
          return { type: "item", item, set } as Matches;
        }),
      );

      if (setMatch) {
        newMatches.push({ type: "set", set: set });
      }
    });

    setMatches(newMatches);
  }

  return (
    <>
      <Input
        label={
          <label>Got a lot of stuff? Type here to search stuff by name.</label>
        }
        onChange={(e) => search(e.target.value)}
        className="mb-2"
        type="search"
        id="searchInput"
        name="query"
        placeholder="Search by SET or ITEM name..."
        aria-label="Search"
        pattern="^\S.*$"
      />
      <Divider className="my-4" />
      {searchQ ? (
        <>
          {matches.length == 0 ? (
            <h1 className="text-lg">No results!</h1>
          ) : (
            <div className="flex flex-col gap-2 mb-4">
              <h1>Results</h1>

              {matches.map((i) =>
                i.type === "set" ? (
                  <li key={i.set.name}>
                    Found SET <b>{i.set.name}</b>.<br />
                    {i.set.items.length === 0 ? (
                      <p>This SET is empty.</p>
                    ) : (
                      <p>
                        This SET contains a total stock of{" "}
                        {i.set.items
                          .map((i) => i.stock)
                          .reduce((acc, cur) => acc + cur)}{" "}
                        and a total of {i.set.items.length}{" "}
                        {i.set.items.length === 1 ? "item" : "items"}.<br />
                        Items are{" "}
                        <b>{i.set.items.map((i) => i.name).join(", ")}</b>.
                      </p>
                    )}
                    <span
                      className="text-danger"
                      style={{
                        textDecoration: "underline",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setDeleteSetModal({
                          visible: true,
                          set: i.set.name,
                          item: "",
                        })
                      }
                    >
                      Delete this set?
                    </span>
                  </li>
                ) : (
                  <>
                    <p className=" opacity-[0.5] italic">
                      Found this match on SET {i.set.name}.{" "}
                      <span
                        className="text-danger"
                        style={{
                          textDecoration: "underline",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          setDeleteSetModal({
                            visible: true,
                            set: i.item.name,
                            item: "",
                          })
                        }
                      >
                        (Delete this set?)
                      </span>
                    </p>
                    <ListedItem
                      colorizer={searchQ}
                      parentSet={i.set}
                      item={i.item}
                      key={i.item.name}
                      setDecrementStockModal={setDecrementStockModal}
                      setIncrementStockModal={setIncrementStockModal}
                      setOverwriteStockModal={setOverwriteStockModal}
                      setDeleteItemModal={setDeleteItemModal}
                      settings={settings}
                    />
                  </>
                ),
              )}
            </div>
          )}
        </>
      ) : (
        <ItemRenderer
          inventory={inventory}
          setDecrementStockModal={setDecrementStockModal}
          setIncrementStockModal={setIncrementStockModal}
          setOverwriteStockModal={setOverwriteStockModal}
          setDeleteItemModal={setDeleteItemModal}
          setDeleteSetModal={setDeleteSetModal}
          settings={settings}
        />
      )}
    </>
  );
}

function ItemRenderer({
  inventory,
  setDecrementStockModal,
  setIncrementStockModal,
  setOverwriteStockModal,
  setDeleteItemModal,
  setDeleteSetModal,
  settings,
}: {
  inventory: InventorySet[];
  setDecrementStockModal: ModalCallback;
  setIncrementStockModal: ModalCallback;
  setOverwriteStockModal: ModalCallback;
  setDeleteItemModal: ModalCallback;
  setDeleteSetModal: ModalCallback;
  settings: Settings;
}) {
  return (
    <>
      {inventory.map((s) => {
        if (s.items.length === 0) {
          return (
            <Card key={fmtName(s.name)} className="flex flex-col my-2">
              <CardHeader
                className="flex flex-row w-full justify-content-between"
                style={{ alignItems: "center" }}
              >
                <h3 className="fw-bold">{s.name}</h3>
              </CardHeader>
              <CardBody>
                <p>
                  <b>This set is empty. Add some items to it!</b>
                  <br />
                  <Button
                    color="danger"
                    variant="bordered"
                    onPress={() =>
                      setDeleteSetModal({
                        visible: true,
                        set: s.name,
                        item: "",
                      })
                    }
                  >
                    Delete this set instead.
                  </Button>
                </p>
              </CardBody>
            </Card>
          );
        } else {
          const count = s.items
            .map((i) => i.stock)
            .reduce((acc, cur) => acc + cur);
          return (
            <Card key={fmtName(s.name)} className="flex flex-col my-2">
              <CardHeader
                className="flex flex-row w-full justify-content-between"
                style={{ alignItems: "center" }}
              >
                <h3 className="text-xl mr-auto">{s.name}</h3>
                <Chip
                  color={
                    count < settings.criticalThreshold
                      ? "danger"
                      : count < settings.warnThreshold
                        ? "warning"
                        : "primary"
                  }
                  style={{ fontWeight: 400 }}
                >
                  Totalling <b>{count}</b>
                </Chip>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col gap-2">
                  {s.items.map((item) => (
                    <ListedItem
                      colorizer={null}
                      parentSet={s}
                      item={item}
                      key={item.name}
                      setDecrementStockModal={setDecrementStockModal}
                      setIncrementStockModal={setIncrementStockModal}
                      setOverwriteStockModal={setOverwriteStockModal}
                      setDeleteItemModal={setDeleteItemModal}
                      settings={settings}
                    />
                  ))}
                </div>
              </CardBody>
              <CardFooter>
                <Button
                  color="danger"
                  variant="flat"
                  className="w-full"
                  onPress={() =>
                    setDeleteSetModal({ visible: true, set: s.name, item: "" })
                  }
                  key={s.name + "_DELETE"}
                >
                  <b>X</b> Delete this SET (all items will be deleted too!)
                </Button>
              </CardFooter>
            </Card>
          );
        }
      })}
    </>
  );
}
