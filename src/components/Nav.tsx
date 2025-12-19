import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/navbar";
import { useLocation } from "react-router";
import { Link } from "@heroui/react";

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

export default function NavigationBar({ appName }: { appName: string }) {
  const location = useLocation();
  const [display, setDisplay] = useState<boolean>(false);

  function getNavClassname(tab: string | string[]) {
    const color = Array.isArray(tab)
      ? tab.includes(location.pathname)
      : tab === location.pathname;
    return color ? true : false;
  }

  return (
    <>
      <Navbar>
        <NavbarBrand>
          <Link color="primary" href="/" className="font-bold text-inherit">
            {appName}
          </Link>
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem isActive={getNavClassname(["home", "/"])}>
            <Link color="foreground" aria-current="page" href="/">
              Home
            </Link>
          </NavbarItem>
          <NavbarItem isActive={getNavClassname(["/settings"])}>
            <Link color="foreground" aria-current="page" href="/settings">
              Settings
            </Link>
          </NavbarItem>
          <NavbarItem isActive={getNavClassname(["/help"])}>
            <Link color="foreground" aria-current="page" href="/help">
              Help
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              color="foreground"
              aria-current="page"
              href="#"
              onClick={() => setDisplay(true)}
            >
              About
            </Link>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      <AboutModal display={display} close={() => setDisplay(false)} />
    </>
  );
}
