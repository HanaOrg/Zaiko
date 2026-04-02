import { useEffect, useMemo, useState } from "react";
import { Inventory, InventoryItem, Settings } from "../types/types";
import { getUserData, fmtName, DEFAULT_PREFERENCES } from "../api/data";
import { Button, Alert } from "@heroui/react";
import {
  CreateSetModal,
  DeleteModal,
  SetStockModal,
} from "../components/Modals";
import { ItemsList } from "../components/Items";
import { useNavigate } from "react-router";
import Wrapper from "../components/Wrapper";

type ModalType =
  | "overwrite"
  | "increment"
  | "decrement"
  | "deleteItem"
  | "deleteSet"
  | null;

type ActiveModal = {
  type: ModalType;
  item: InventoryItem | null;
  set: string;
};

const defaultModal: ActiveModal = { type: null, item: null, set: "" };

const closeModal = (setFn: React.Dispatch<React.SetStateAction<ActiveModal>>) =>
  setFn(defaultModal);

export default function Home() {
  const navigate = useNavigate();
  const [newSetModal, setSetModal] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(defaultModal);

  const [userInv, setUserInv] = useState<Inventory>({});
  const [settings, setSettings] = useState<Settings>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState<boolean>(true);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    if (h < 22) return "Good evening";
    return "Good night";
  }, []);

  useEffect(() => {
    async function h() {
      const [inv, setts] = await Promise.all([
        getUserData("inventory"),
        getUserData("settings"),
      ]);
      setUserInv(inv);
      setSettings(setts);
      setLoading(false);
    }
    h();
  }, []);

  const openModal = (
    type: ModalType,
    item: InventoryItem | null,
    set: string,
  ) => setActiveModal({ type, item, set });

  const isOpen = (type: ModalType) => activeModal.type === type;

  return (
    <Wrapper
      loading={loading}
      header="Home"
      subheader={`${greeting} and welcome to your warehouse, boss.`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <Button color="primary" onPress={() => setSetModal(true)}>
            Create SET
          </Button>
          {Object.keys(userInv).length > 0 && (
            <Button
              variant="flat"
              color="primary"
              onPress={() => navigate("/create-item")}
            >
              Create ITEM
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-col" style={{ gap: 20 }}>
        <div className="grow list-group" id="inventory">
          {Object.values(userInv)
            .flatMap((s) => s.items)
            .filter((i) => i.stock <= settings.warn_threshold)
            .map((i) => (
              <Alert
                variant="solid"
                color={
                  i.stock <= settings.critical_threshold ? "danger" : "warning"
                }
                key={fmtName(i.id)}
                className="mb-2"
              >
                <span>
                  Item <strong>{i.name}</strong> is
                  {i.stock <= settings.critical_threshold
                    ? " critically low on "
                    : " running out of "}
                  stock.
                </span>
                <span>
                  {i.stock === 0 ? (
                    <b>It ran out!</b>
                  ) : (
                    `Only ${i.stock} ${i.stock === 1 ? "unit" : "units"} left!`
                  )}
                </span>
              </Alert>
            ))}
          {Object.keys(userInv).length === 0 ? (
            <>
              <h1>No SET exists.</h1>
              <p>Create your first SET to start tracking your stocking!</p>
            </>
          ) : (
            <ItemsList
              inventory={userInv}
              setDecrementStockModal={(a) =>
                openModal("decrement", a.item, a.set)
              }
              setIncrementStockModal={(a) =>
                openModal("increment", a.item, a.set)
              }
              setOverwriteStockModal={(a) =>
                openModal("overwrite", a.item, a.set)
              }
              setDeleteItemModal={(a) => openModal("deleteItem", a.item, a.set)}
              setDeleteSetModal={(a) => openModal("deleteSet", a.item, a.set)}
              settings={settings}
            />
          )}
        </div>
      </div>
      <CreateSetModal
        display={newSetModal}
        close={() => setSetModal(false)}
        inv={userInv}
      />
      <SetStockModal
        whatFor="overwrite"
        data={{
          visible: isOpen("overwrite"),
          item: activeModal.item,
          set: activeModal.set,
        }}
        close={() => closeModal(setActiveModal)}
      />
      <SetStockModal
        whatFor="increment"
        data={{
          visible: isOpen("increment"),
          item: activeModal.item,
          set: activeModal.set,
        }}
        close={() => closeModal(setActiveModal)}
      />
      <SetStockModal
        whatFor="decrement"
        data={{
          visible: isOpen("decrement"),
          item: activeModal.item,
          set: activeModal.set,
        }}
        close={() => closeModal(setActiveModal)}
      />
      <DeleteModal
        type="item"
        data={{
          visible: isOpen("deleteItem"),
          item: activeModal.item,
          set: activeModal.set,
        }}
        close={() => closeModal(setActiveModal)}
      />
      <DeleteModal
        type="set"
        data={{
          visible: isOpen("deleteSet"),
          item: activeModal.item,
          set: activeModal.set,
        }}
        close={() => closeModal(setActiveModal)}
      />
    </Wrapper>
  );
}
