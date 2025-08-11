import { Divider, Link } from "@heroui/react";
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
          <h1 className="text-3xl">Zaiko,</h1>
          <h2>inventory made easy</h2>
          <p className="text-lg">
            Created and maintained by{" "}
            <Link
              className="text-lg"
              href="https://github.com/zakahacecosas"
              target="_blank"
              rel="noopener noreferrer"
            >
              @ZakaHaceCosas
            </Link>
            .<br />
            Published by the Hana org.
          </p>
          <Divider className="my-2" />
          <p>
            This program is free and open source software. You can redistribute
            it and/or modify it under the terms of the GNU General Public
            License, version 3.0.
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
            Powered by Tauri | Made by <b>Hana</b>
          </span>
        </div>
      </footer>

      <AboutModal display={display} close={() => setDisplay(false)} />
    </>
  );
}
