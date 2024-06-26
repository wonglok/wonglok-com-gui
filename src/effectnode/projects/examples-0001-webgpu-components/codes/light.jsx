import { Environment } from "@react-three/drei";
import { useEffect } from "react";
import hdr from "../assets/hdr/symmetrical_garden_02_1k.hdr";

export function ToolBox({ ui, useStore, domElement }) {
  return <>light</>;
}

export function Runtime({ ui, useStore, io }) {
  let Insert3D = useStore((r) => r.Insert3D) || (() => null);

  return (
    <>
      <Insert3D>
        <Environment files={[hdr]}></Environment>
        <pointLight
          position={[-2.0, 1.3, 1]}
          color={ui.pointLightColor}
          intensity={ui.intensity}
        ></pointLight>
      </Insert3D>
    </>
  );
}

//

//
