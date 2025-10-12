import { Alert, Spinner } from "@heroui/react";
import { ReactNode, useEffect, useState } from "react";
import { getUserData } from "../api/data";
import NavigationBar from "./Nav";

export default function Wrapper({
  loading,
  header,
  subheader,
  children,
}: {
  loading: boolean;
  header: string;
  subheader: string;
  children: ReactNode;
}) {
  const [appName, setAppName] = useState<string>("Zaiko");

  useEffect(() => {
    async function h() {
      const set = await getUserData("settings");
      document.getElementsByTagName("html")![0]!.className = set.theme;
      setAppName(set.app_name);
    }
    h();
  }, []);

  if (loading)
    return (
      <div
        style={{
          backgroundColor: "#000",
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <Spinner variant="default" role="status" />
        <h1 className="text-white text-3xl font-bold">Loading...</h1>
      </div>
    );

  return (
    <>
      <Alert className="small-warn" title="Screen too small!" />
      <NavigationBar appName={appName} />
      <div className="flex flex-col my-5 px-12">
        <h1 className="text-3xl">{header}</h1>
        <p className="text-1xl mb-2">{subheader}</p>
        {children}
      </div>
    </>
  );
}
