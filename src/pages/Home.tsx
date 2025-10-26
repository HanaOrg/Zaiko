import { useEffect, useState } from "react";
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

type stockModal = {
  visible: boolean;
  item: InventoryItem | null;
  set: string;
};

const defaultStockModal = { visible: false, item: null, set: "" };

export default function Home() {
  const navigate = useNavigate();
  const [newSetModal, setSetModal] = useState<boolean>(false);
  const [overwriteStockModal, setOverwriteStockModal] =
    useState<stockModal>(defaultStockModal);
  const [incrementStockModal, setIncrementStockModal] =
    useState<stockModal>(defaultStockModal);
  const [decrementStockModal, setDecrementStockModal] =
    useState<stockModal>(defaultStockModal);
  const [deleteItemModal, setDeleteItemModal] =
    useState<stockModal>(defaultStockModal);
  const [deleteSetModal, setDeleteSetModal] =
    useState<stockModal>(defaultStockModal);

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : new Date().getHours() < 22
          ? "Good evening"
          : "Good night";

  const [userInv, setUserInv] = useState<Inventory>({});
  const [settings, setSettings] = useState<Settings>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function h() {
      const inv = await getUserData("inventory");
      const setts = await getUserData("settings");
      setUserInv(inv);
      setSettings(setts);
      setLoading(false);
    }
    h();
  }, []);

  return (
    <Wrapper
      loading={loading}
      header="Home"
      subheader={`${greeting} and welcome to your warehouse, boss.`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <Button href="#" color="primary" onPress={() => setSetModal(true)}>
            Create SET
          </Button>
          {Object.keys(userInv).length > 0 && (
            <Button
              href="#"
              variant="flat"
              color="primary"
              onPress={() => navigate("/create-item")}
            >
              Create ITEM
            </Button>
          )}
        </div>
        <div id="alerts"></div>
      </div>
      <div className="flex flex-column" style={{ gap: 20 }}>
        <div className="flex-grow-1 list-group" id="inventory">
          {Object.values(userInv).length > 0 ? (
            Object.values(userInv)
              .map((s) => s.items)
              .flat()
              .filter((i) => i.stock <= settings.warn_threshold)
              .map((i) => (
                <Alert
                  variant="solid"
                  color={
                    i.stock <= settings.critical_threshold
                      ? "danger"
                      : "warning"
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
              ))
          ) : (
            <></>
          )}
          {!userInv || Object.keys(userInv).length === 0 ? (
            <>
              <h1>No SET exists.</h1>
              <p>Create your first SET to start tracking your stocking!</p>
            </>
          ) : (
            <ItemsList
              inventory={userInv}
              setDecrementStockModal={setDecrementStockModal}
              setIncrementStockModal={setIncrementStockModal}
              setOverwriteStockModal={setOverwriteStockModal}
              setDeleteItemModal={setDeleteItemModal}
              setDeleteSetModal={setDeleteSetModal}
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
        data={overwriteStockModal}
        close={() =>
          setOverwriteStockModal({
            visible: false,
            item: null,
            set: "",
          })
        }
      />
      <SetStockModal
        whatFor="increment"
        data={incrementStockModal}
        close={() =>
          setIncrementStockModal({
            visible: false,
            item: null,
            set: "",
          })
        }
      />
      <SetStockModal
        whatFor="decrement"
        data={decrementStockModal}
        close={() =>
          setDecrementStockModal({
            visible: false,
            item: null,
            set: "",
          })
        }
      />
      <DeleteModal
        type="item"
        data={deleteItemModal}
        close={() =>
          setDeleteItemModal({
            visible: false,
            item: null,
            set: "",
          })
        }
      />
      <DeleteModal
        type="set"
        data={deleteSetModal}
        close={() =>
          setDeleteSetModal({
            visible: false,
            item: null,
            set: "",
          })
        }
      />
    </Wrapper>
  );
}
