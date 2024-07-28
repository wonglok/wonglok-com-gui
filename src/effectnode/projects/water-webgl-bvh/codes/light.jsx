import { Environment, Sky } from "@react-three/drei";
import { Suspense } from "react";

export function ToolBox({}) {
  return <></>;
}

export function Runtime({ ui, useStore, io }) {
  let Insert3D = useStore((r) => r.Insert3D) || (() => null);
  let files = useStore((r) => r.files);

  // console.log(files["/hdr/shanghai_bund_1k.hdr"]);
  return (
    <>
      <Insert3D>
        {/* <pointLight
          position={[0, 2, 0]}
          color={ui.pointLightColor}
          intensity={ui.intensity}
          distance={-1}
        ></pointLight> */}
        <Suspense fallback={null}>
          <Environment
            background={false}
            environmentIntensity={1.5}
            files={[files["/hdr/shanghai_bund_1k.hdr"]]}
          ></Environment>
        </Suspense>

        {/* <Sky></Sky> */}
      </Insert3D>
    </>
  );
}

//

//

//
