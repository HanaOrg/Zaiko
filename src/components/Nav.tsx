import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/navbar";
import { useLocation } from "react-router";
import { Link } from "@heroui/react";

export default function NavigationBar({ appName }: { appName: string }) {
  const location = useLocation();

  function getNavClassname(tab: string | string[]) {
    const color = Array.isArray(tab)
      ? tab.includes(location.pathname)
      : tab === location.pathname;
    return color ? true : false;
  }

  return (
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
        <NavbarItem isActive={getNavClassname(["/guide"])}>
          <Link color="foreground" aria-current="page" href="/guide">
            Guide
          </Link>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
