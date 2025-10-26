import { Divider } from "@heroui/react";
import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";

export function AboutModal({
  display,
  close,
}: {
  display: boolean;
  close: () => void;
}) {
  return (
    <Modal isOpen={display} onOpenChange={close}>
      <ModalContent>
        <ModalHeader>
          <h1>About</h1>
        </ModalHeader>
        <ModalBody>
          <div>
            <h1 className="text-3xl p-0 m-0">Zaiko,</h1>
            <h2 className="m-0 p-0">inventory made easy</h2>
          </div>
          <p className="text-lg">
            Created and maintained by{" "}
            <a
              className="text-lg text-primary"
              href="https://github.com/ZakaHaceCosas/"
              target="_blank"
              rel="noopener noreferrer"
            >
              @ZakaHaceCosas
            </a>
            .<br />
            Published by{" "}
            <a
              className="text-lg text-primary"
              href="https://hana-org.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              the Hana org
            </a>
            .
          </p>
          <Divider className="my-2" />
          <p>
            This program is free and open source software. You can redistribute
            it and/or modify it under the terms of the GNU General Public
            License, version 3.0.
            <br />
            <span className="text-sm">Powered by Tauri 2 and BunJS.</span>
          </p>
        </ModalBody>
        <ModalFooter />
      </ModalContent>
    </Modal>
  );
}

export default function Footer() {
  const [display, setDisplay] = useState<boolean>(false);

  return (
    <>
      <Divider className="mt-4" />
      <footer className="flex flex-row w-full flex-wrap justify-between items-center py-3 my-4">
        <p
          style={{ cursor: "pointer" }}
          onClick={() => setDisplay(true)}
          className="col-auto mb-0 flex justify-content-start text-body-secondary"
        >
          Zaiko, &copy; 2025 the Hana Org.
        </p>

        <div className="col-auto mb-0 flex justify-content-end">
          <span
            style={{ cursor: "pointer" }}
            onClick={() => setDisplay(true)}
            className="text-body-secondary"
          >
            Made by <b>Hana</b>
          </span>
        </div>
      </footer>

      <AboutModal display={display} close={() => setDisplay(false)} />
    </>
  );
}
