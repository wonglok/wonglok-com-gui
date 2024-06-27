import { Box, PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Clock } from "three";

export function ToolBox({ ui }) {
  return <>Toolbox HA {ui.baseColor}</>;
}

export function Runtime({ ui, io, useStore, onLoop }) {
  let Insert3D = useStore((r) => r.Insert3D) || (() => null);

  let ref = useRef();

  useEffect(() => {
    let clock = new Clock();
    return onLoop(() => {
      let dt = clock.getDelta();
      if (ref.current) {
        ref.current.rotation.y += dt * ui.speed;
      }
    });
  }, [onLoop, ui]);

  return (
    <>
      <Insert3D>
        <group ref={ref}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry></boxGeometry>
            <meshStandardMaterial color={ui.baseColor}></meshStandardMaterial>
          </mesh>
        </group>

        <PerspectiveCamera makeDefault position={[0, 0, 5]}></PerspectiveCamera>
      </Insert3D>

      <div></div>
      {/* <span style={{ color: ui.baseColor }}>Runtime {ui.baseColor}</span> */}
    </>
  );
}

//