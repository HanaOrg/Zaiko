import {
  DEFAULT_PREFERENCES,
  exportData,
  getUserData,
  setUserData,
  refreshZaiko,
  importData,
} from "../api/data";
import { useEffect, useState } from "react";
import type { Settings } from "../types/types";
import {
  Form,
  Button,
  ButtonGroup,
  Input,
  Select,
  SelectItem,
  Divider,
  NumberInput,
  addToast,
} from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import Wrapper from "../components/Wrapper";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_PREFERENCES);
  const [appName, setAppName] = useState<string>("Zaiko");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function handler() {
      const setts = await getUserData("settings");
      setSettings(setts);
      setAppName(setts.app_name);

      setLoading(false);
    }
    handler();
  }, []);

  async function handleSettings() {
    try {
      await setUserData(0, settings);
      addToast({
        title: "Changes saved!",
        description: "Settings were successfully updated.",
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        color: "primary",
        variant: "bordered",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: String(error),
        timeout: 4000,
        shouldShowTimeoutProgress: true,
        color: "danger",
        variant: "bordered",
      });
    }
  }

  const [refreshModalVisible, setRefreshModalVisible] =
    useState<boolean>(false);

  return (
    <Wrapper
      loading={loading}
      header="Settings"
      subheader="Tweak Zaiko to your liking"
    >
      <h3 className="text-lg">App settings</h3>
      <Form onSubmit={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-2 w-full">
          <Input
            type="text"
            id="app_name"
            value={settings.app_name}
            onChange={(e) =>
              setSettings({
                ...settings,
                app_name: e.target.value,
              })
            }
            onKeyDown={async (e) => {
              if (e.key === "Enter") await handleSettings();
            }}
            label="App name"
            placeholder="Enter app name. Leave blank to default to our original name (Zaiko)."
          />
          <Select
            label="Choose a theme"
            defaultSelectedKeys={[settings.theme]}
            onChange={(e) =>
              setSettings({
                ...settings,
                theme: e.target.value as "dark" | "light",
              })
            }
          >
            <SelectItem key="light">Light</SelectItem>
            <SelectItem key="dark">Dark</SelectItem>
          </Select>
          <NumberInput
            id="warn_threshold"
            value={settings.warn_threshold}
            onValueChange={(v) =>
              setSettings({
                ...settings,
                warn_threshold: v,
              })
            }
            onKeyDown={async (e) => {
              if (e.key === "Enter") await handleSettings();
            }}
            label="Warning threshold"
            placeholder="What stock an item needs to go below of to show a warning."
          />
          <NumberInput
            id="critical_threshold"
            value={settings.critical_threshold}
            onValueChange={(v) =>
              setSettings({
                ...settings,
                critical_threshold: v,
              })
            }
            onKeyDown={async (e) => {
              if (e.key === "Enter") await handleSettings();
            }}
            label="Alert threshold"
            placeholder="What stock an item needs to go below of to show a critical warning."
          />
        </div>
        <Button
          type="submit"
          color="primary"
          onPress={async () => {
            handleSettings();
          }}
        >
          Save changes
        </Button>
      </Form>
      <Divider className="my-4" />
      <h3 className="text-lg">Export your data</h3>
      <p>
        Export all of your SETs and ITEMs into a single file. We recommend JSON
        for backup and Excel for working outside of Zaiko.
        <br />
        CSV isn't really recommended, however if you feel like you need it, we
        made sure it works fine.
      </p>
      <ButtonGroup className="rounded-xl overflow-hidden mr-auto mt-2">
        <Button
          color={
            document.body.dataset["bsTheme"] === "light" ? "primary" : "default"
          }
          variant="flat"
          onPress={async () => {
            try {
              await exportData("json");
              addToast({
                title: "JSON file exported!",
                description: "It's right where you specified.",
                timeout: 3000,
                shouldShowTimeoutProgress: true,
                color: "foreground",
                variant: "bordered",
              });
            } catch (error) {
              addToast({
                title: "Error",
                description: String(error),
                timeout: 4000,
                shouldShowTimeoutProgress: true,
                color: "danger",
                variant: "bordered",
              });
            }
          }}
        >
          Export in JSON format
        </Button>
        <Button
          color={
            document.body.dataset["bsTheme"] === "light" ? "primary" : "default"
          }
          variant="flat"
          onPress={async () => {
            try {
              await exportData("xlsx");
              addToast({
                title: "Excel file exported!",
                description: "It's on your Downloads folder.",
                timeout: 3000,
                shouldShowTimeoutProgress: true,
                color: "foreground",
                variant: "bordered",
              });
            } catch (error) {
              addToast({
                title: "Error",
                description: String(error),
                timeout: 4000,
                shouldShowTimeoutProgress: true,
                color: "danger",
                variant: "bordered",
              });
            }
          }}
        >
          Export in Microsoft Excel format
        </Button>
        <Button
          color={
            document.body.dataset["bsTheme"] === "light" ? "primary" : "default"
          }
          variant="flat"
          onPress={async () => {
            try {
              await exportData("csv");
              addToast({
                title: "CSV file exported!",
                description: "It's right where you specified.",
                timeout: 3000,
                shouldShowTimeoutProgress: true,
                color: "foreground",
                variant: "bordered",
              });
            } catch (error) {
              addToast({
                title: "Error",
                description: String(error),
                timeout: 4000,
                shouldShowTimeoutProgress: true,
                color: "danger",
                variant: "bordered",
              });
            }
          }}
        >
          Export in CSV format
        </Button>
      </ButtonGroup>
      <Divider className="my-4" />
      <h3 className="text-lg">Import your data</h3>
      <p>
        Import a JSON export file to bring in your data. This file must comply
        with the Zaiko JSON specification.
      </p>
      <Button
        className="mt-2 mr-auto"
        color={
          document.body.dataset["bsTheme"] === "light" ? "primary" : "default"
        }
        variant="flat"
        onPress={async () => {
          await importData();
        }}
      >
        Import JSON file
      </Button>
      <Divider className="my-4" />
      <h3 className="text-lg">Danger zone</h3>
      <p>Refreshing the app cannot be undone. Be certain.</p>
      <Button
        color="danger"
        className="mt-2 mr-auto"
        onPress={() => setRefreshModalVisible(true)}
      >
        Refresh {appName}
      </Button>
      <Modal
        isOpen={refreshModalVisible}
        onOpenChange={() => setRefreshModalVisible(false)}
      >
        <ModalContent>
          <ModalHeader>
            <h1>Are you sure about that?</h1>
          </ModalHeader>
          <ModalBody>
            Are you sure you want to refresh {appName}? This action cannot be
            undone.
            <b>
              This means ALL your data (SETs, items, and stock) will be deleted,
              and all your settings will be reset.
            </b>
          </ModalBody>
          <ModalFooter>
            <Button
              type="submit"
              color="danger"
              onPress={async () => {
                await refreshZaiko();
                setRefreshModalVisible(false);
              }}
            >
              Confirm, I want to refresh
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Wrapper>
  );
}
