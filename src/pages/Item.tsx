import { useEffect, useState } from "react";
import { Inventory, InventoryItem } from "../types/types";
import { validate } from "@zakahacecosas/string-utils";
import {
  Form,
  Alert,
  Button,
  Input,
  Select,
  SelectItem,
  Checkbox,
  NumberInput,
} from "@heroui/react";
import { createItem, fmtName, getUserData } from "../api/data";
import { validateBarcode } from "../api/barcode";
import Footer from "../components/Footer";
import { useNavigate } from "react-router";
import Wrapper from "../components/Wrapper";

export default function CreateItem() {
  const navigate = useNavigate();
  const [inv, setInv] = useState<Inventory>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [itemName, setItemName] = useState<string>("");
  const [itemParent, setItemParent] = useState<string>("");
  const [itemInitialStock, setItemInitialStock] = useState<number>(0);
  const [itemDescription, setItemDescription] = useState<string>("");
  const [itemBarcode, setItemBarcode] = useState<string>("");
  const [itemInternalBarcode, setItemInternalBarcode] =
    useState<boolean>(false);
  const [zaikoBarcode, setZaikoBarcode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function h() {
      const inv = await getUserData("inventory");
      setInv(inv);
      setLoading(false);
    }
    h();
  }, []);

  useEffect(() => {
    setZaikoBarcode(
      `ZAIKO-ITEM-${
        (inv
          .map((s) => s.items)
          .flat()
          .map((i) => i.zaikode)
          .filter((i) => i !== undefined)
          .map((s) => Number(s.split("-")[2]))
          .filter((s) => !isNaN(s))
          .sort()
          .pop() ?? -1) + 1
      }`,
    );
  }, [itemInternalBarcode]);

  async function handleCreateItem() {
    if (!validate(itemParent) || itemParent === "null") {
      setError(`Parent SET ${itemParent} is NOT valid.`);
      return;
    }

    if (!validate(itemName)) {
      setError(`Name ${itemName} is NOT valid.`);
      return;
    }

    if (
      inv
        .map((s) => s.items.map((i) => i.name))
        .flat(Infinity)
        .some((n) => n === itemName)
    ) {
      setError(`ITEM ${itemName} already exists.`);
      return;
    }

    if (isNaN(itemInitialStock) || itemInitialStock < 0) {
      setError(`Stock ${itemInitialStock} is invalid or lower than 0.`);
      return;
    }

    if (itemDescription && !validate(itemDescription)) {
      setError(`Description ${itemDescription} is NOT valid.`);
      return;
    }

    if (itemDescription && itemDescription.length > 255) {
      setError(`Description ${itemDescription} is too long.`);
      return;
    }

    if (itemBarcode && !validateBarcode(itemBarcode).valid) {
      setError(`Barcode ${itemBarcode} is NOT valid.`);
      return;
    }

    const itemToCreate: InventoryItem = {
      name: itemName,
      description: validate(itemDescription) ? itemDescription : undefined,
      stock: itemInitialStock,
      barcode: validateBarcode(itemBarcode).valid
        ? validateBarcode(itemBarcode).code!
        : undefined,
      zaikode: itemInternalBarcode ? zaikoBarcode : undefined,
    };

    setError(null);

    try {
      await createItem(itemToCreate, itemParent);
    } catch (e) {
      setError(`Error creating item: ${e}`);
      return;
    }

    navigate("/");
  }

  return (
    <Wrapper
      loading={loading}
      header="Create a new item"
      subheader="You'll be able to track its stock and generate PNG barcodes."
    >
      {error && (
        <Alert className="mb-4" color="danger">
          {error}
        </Alert>
      )}
      <Form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col w-full gap-4"
      >
        <div className="flex flex-row w-full gap-2">
          <div className="w-full">
            <Select
              label={<label>Where to store the ITEM?</label>}
              aria-label="Select SET"
              placeholder="SET where you'll store the ITEM"
              value={itemParent}
              onChange={(e) => setItemParent(e.target.value)}
            >
              {inv.map((s) => (
                <SelectItem key={fmtName(s.name)}>{s.name}</SelectItem>
              ))}
            </Select>
            <p className="text-sm text-default-700 mt-2">
              Required. Wraps your ITEM inside of this set.
            </p>
          </div>
          <div className="w-full">
            <Input
              label={<label>Name of your ITEM</label>}
              id="item_name"
              type="text"
              required
              placeholder="Name of your item here"
              title="Only letters, numbers, and spaces are allowed."
              onChange={(e) => setItemName(e.target.value.trim())}
            />
            <p className="text-sm text-default-700 mt-2">
              Only letters, numbers, and spaces are allowed. Required.
            </p>
          </div>
        </div>
        <div className="w-full">
          <Input
            label={<label>Description of your ITEM</label>}
            id="item_desc"
            type="text"
            placeholder="Description of your item here"
            title="Only letters, numbers, and spaces are allowed."
            onChange={(e) => setItemDescription(e.target.value.trim())}
          />
          <p className="text-sm text-default-700 mt-2">
            A description for you to better identify this item. Optional.
          </p>
        </div>
        <div className="flex flex-row w-full gap-2">
          <div className="w-full">
            <NumberInput
              label={<label>Initial stock of your ITEM</label>}
              id="item_stk"
              type="number"
              placeholder="Initial stock of your item here"
              required
              title="Only letters, numbers, and spaces are allowed."
              onValueChange={setItemInitialStock}
            />
            <p className="text-sm text-default-700 mt-2">
              Initial stock of this item, you can update it later on. Required.
            </p>
          </div>
          <div className="w-full">
            <Input
              label={<label>Barcode for your ITEM</label>}
              id="item_barcode"
              type="text"
              placeholder="Enter an EAN-13 or UPC-A code."
              onChange={(e) => setItemBarcode(e.target.value.trim())}
            />
            <p className="text-sm text-default-700 mt-2">
              {itemBarcode && validateBarcode(itemBarcode).valid && (
                <b>
                  This looks like a valid {validateBarcode(itemBarcode).type}{" "}
                  barcode.
                  <br />
                </b>
              )}
              You can enter this product's EAN-13 or UPC-A code for lookup,
              export, or simply for you to remember it. You should be sure the
              code is a valid code registered with the GS1.
            </p>
          </div>
        </div>
        <div className="w-full">
          <Checkbox
            type="checkbox"
            aria-label="Generate Zaiko barcode"
            onChange={(e) => setItemInternalBarcode(e.target.checked)}
          >
            Generate Zaiko barcode
          </Checkbox>
          <p className="text-sm text-default-700 mt-2">
            {itemInternalBarcode && (
              <b>
                This item's Zaiko barcode will be <code>{zaikoBarcode}</code>.
              </b>
            )}
            This is optional too. It'll generate a Code128 barcode for
            identifying this product inside of Zaiko. This is useful if you want
            to use a barcode scanner to associate real-life products with your
            Zaiko installation - especially as we plan to develop a mobile app
            and an API for Zaiko in the future.
          </p>
        </div>
        <Button
          type="submit"
          color="primary"
          onPress={async () => {
            await handleCreateItem();
          }}
        >
          Create item
        </Button>
      </Form>

      <Footer />
    </Wrapper>
  );
}
