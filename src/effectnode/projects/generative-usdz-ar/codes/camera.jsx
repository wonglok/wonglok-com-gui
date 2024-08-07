import { OrbitControls, PerspectiveCamera } from "@react-three/drei";

export function ToolBox({}) {
  return <>camera</>;
}

export function Runtime({ ui, useStore, io }) {
  let Insert3D = useStore((r) => r.Insert3D) || (() => null);

  return (
    <>
      <Insert3D>
        <PerspectiveCamera makeDefault position={[0, 2, 2]}></PerspectiveCamera>
        <OrbitControls makeDefault></OrbitControls>
      </Insert3D>
    </>
  );
}
