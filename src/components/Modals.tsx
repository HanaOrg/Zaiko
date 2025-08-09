import { useState } from "react";
import { Inventory } from "../types/types";
import { validate } from "@zakahacecosas/string-utils";
import { createSet, deleteItem, deleteSet, overwriteStock } from "../api/data";
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Alert, Button, Form, Input, NumberInput } from "@heroui/react";

export function CreateSetModal({
  display,
  close,
  inv,
}: {
  display: boolean;
  close: () => void;
  inv: Inventory;
}) {
  const [setName, setSetName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreateSet() {
    if (!validate(setName)) {
      setError(`Name ${setName} is NOT valid.`);
      return;
    }

    if (inv.some((s) => s.name === setName)) {
      setError(`SET ${setName} already exists.`);
      return;
    }

    await createSet(setName);

    window.location.reload();
  }

  return (
    <Modal isOpen={display} onOpenChange={close}>
      <ModalContent>
        <ModalHeader>
          <h1>Create a new set</h1>
        </ModalHeader>
        <ModalBody>
          {error && <Alert color="warning">{error}</Alert>}
          <Form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-3">
              <label>Name of your SET</label>
              <Input
                id="set_name"
                type="text"
                required
                placeholder="Name of your set here"
                title="Only letters, numbers, and spaces are allowed."
                onChange={(e) => setSetName(e.target.value.trim())}
              />
              <p className="text-sm text-default-700 mt-2">
                Only letters and numbers are allowed. Required.
              </p>
            </div>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button type="submit" onPress={handleCreateSet}>
            Create set
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function ValidationErrorModal({
  visible,
  close,
  message,
}: {
  visible: boolean;
  close: () => void;
  message: string;
}) {
  return (
    <Modal isOpen={visible} onOpenChange={close}>
      <ModalContent>
        <ModalHeader>
          <h1>Error</h1>
        </ModalHeader>
        <ModalBody>{message}</ModalBody>
      </ModalContent>
    </Modal>
  );
}

export function SetStockModal({
  data,
  whatFor,
  close,
}: {
  data: {
    item: string;
    set: string;
    visible: boolean;
  };
  whatFor: "increment" | "decrement" | "overwrite";
  close: () => void;
}) {
  const { item, set, visible } = data;

  const [error, setError] = useState<string | null>(null);
  const [stock, setStock] = useState<number>(0);

  async function handler() {
    if (isNaN(stock) || stock < 0) {
      setError(`Error: stock ${stock} is invalid or lower than 0.`);
      return;
    }

    await overwriteStock({
      item,
      set,
      stock,
      action: whatFor,
    });

    window.location.reload();
  }

  if (!validate(item))
    return (
      <ValidationErrorModal
        visible={visible}
        close={close}
        message="Invalid item."
      />
    );
  if (!validate(set))
    return (
      <ValidationErrorModal
        visible={visible}
        close={close}
        message="Invalid set."
      />
    );

  return (
    <Modal isOpen={visible} onOpenChange={close}>
      <ModalContent>
        <ModalHeader>
          <h1>
            {whatFor === "overwrite"
              ? "Manually set stock of an item"
              : whatFor === "increment"
                ? "Increment stock of an item"
                : "Decrement stock of an item"}
          </h1>
        </ModalHeader>
        <ModalBody>
          {error && <Alert color="warning">{error}</Alert>}
          <Form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-3">
              <NumberInput
                label={
                  <label>
                    Update stock for <code>{item}</code>
                  </label>
                }
                id="stock"
                placeholder="Amount here"
                required
                title="Number must be equal to or greater than zero."
                onValueChange={(e) => setStock(e)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") await handler();
                }}
              />
              <p className="text-sm text-default-700 mt-2">
                On SET <code>{set}</code>. Number must be equal to or greater
                than zero.
                {whatFor === "overwrite"
                  ? " Your item's stock will be set to this amount regardless of what it previous was."
                  : whatFor === "increment"
                    ? " Your item's stock will be INCREMENTED by this amount - so if you type \"5\" and the previous stock was 15, it'll set to 20."
                    : " Your item's stock will be DECREMENTED by this amount - so if you type \"5\" and the previous stock was 15, it'll set to 10."}
              </p>
            </div>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button onPress={handler}>
            Update <code>{item}</code>'s stock
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function DeleteModal({
  type,
  data,
  close,
}: {
  type: "item" | "set";
  data: {
    item: string;
    set: string;
    visible: boolean;
  };
  close: () => void;
}) {
  const { item, set, visible } = data;

  const deletable = type === "item" ? item : set;

  const [error, setError] = useState<string | null>(null);
  const [itemName, setItemName] = useState<string>("");

  async function handler() {
    if (itemName !== deletable) {
      setError(`The ${type.toUpperCase()}'s name isn't correct...`);
      return;
    }

    if (type === "item")
      await deleteItem({
        item,
        set,
      });
    else await deleteSet(set);

    window.location.reload();
  }

  if (type === "item" && !validate(item))
    return (
      <ValidationErrorModal
        visible={visible}
        close={close}
        message="Invalid item."
      />
    );
  if (!validate(set))
    return (
      <ValidationErrorModal
        visible={visible}
        close={close}
        message="Invalid set."
      />
    );

  return (
    <Modal isOpen={visible} onOpenChange={close}>
      <ModalContent>
        <ModalHeader>
          <h1>Are you sure about that?</h1>
        </ModalHeader>
        <ModalBody>
          {error && <Alert color="warning">{error}</Alert>}
          <Form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-3">
              <p className="mb-2">
                Please, double check you want to{" "}
                <b>
                  delete {type.toUpperCase()}{" "}
                  <code className="bg-yellow-300">{deletable}</code>
                  {type === "item" ? (
                    <>
                      {" "}
                      from <code>{set}</code>
                    </>
                  ) : (
                    <></>
                  )}
                </b>
                . You cannot undo this.
                <br />
                Type the {type.toUpperCase()}'s name below to confirm you want
                to delete it. Input is case-sensitive.
              </p>
              <Input
                id="id"
                type="text"
                placeholder={`Type the ${type.toUpperCase()}'s name to confirm.`}
                required
                onChange={(e) => setItemName(e.target.value.trim())}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") await handler();
                }}
              />
              <p className="text-sm text-default-700 mt-2">
                This {type}'s name is <code>{item}</code>. We ask you to write
                it to prevent a mistaken click from becoming a larger mistake.
              </p>
            </div>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            color={itemName === deletable ? "danger" : "default"}
            onPress={handler}
          >
            Delete <code>{deletable}</code>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function DeleteSetModal({
  data,
  close,
}: {
  data: {
    set: string;
    visible: boolean;
  };
  close: () => void;
}) {
  const { set, visible } = data;

  const [error, setError] = useState<string | null>(null);
  const [setName, setSetName] = useState<string>("");

  async function handler() {
    if (setName !== set) {
      setError("The set's name isn't correct...");
      return;
    }

    await deleteSet(set);

    window.location.reload();
  }

  if (!validate(set))
    return (
      <ValidationErrorModal
        visible={visible}
        close={close}
        message="Invalid set."
      />
    );

  return (
    <Modal isOpen={visible} onOpenChange={close}>
      <ModalContent>
        <ModalHeader>
          <h1>Are you sure about that?</h1>
        </ModalHeader>
        <ModalBody>
          {error && <Alert color="warning">{error}</Alert>}
          <Form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-3">
              <label>
                Please, double check you'd like to{" "}
                <b>
                  permanently delete set <code>{set}</code>
                </b>
                . You cannot undo this.
                <br />
                Type the set's name below to confirm you want to delete it. It
                must match casing and spacing.
              </label>
              <Input
                id="id"
                type="text"
                placeholder="Type the set's name to confirm."
                required
                onChange={(e) => setSetName(e.target.value.trim())}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") await handler();
                }}
              />
              <p className="text-sm text-default-700 mt-2">
                This set's name is <code>{set}</code>. We ask you to write it
                simply to prevent a mistaken click from becoming a larger
                mistake.
              </p>
            </div>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            color={setName === set ? "danger" : "default"}
            onPress={handler}
          >
            Delete <code>{set}</code>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
