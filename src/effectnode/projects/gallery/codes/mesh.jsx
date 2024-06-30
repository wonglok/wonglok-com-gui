// import { Box, PerspectiveCamera } from "@react-three/drei";
// import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Clock } from "three";
import { FlowGallery } from "../modules/FlowGallery";

export function ToolBox({ ui, io, useStore, onLoop }) {
  //

  return <>Toolbox {ui.speed}</>;
}

export function Runtime({ ui, io, useStore, onLoop }) {
  let Insert3D = useStore((r) => r.Insert3D) || (() => null);

  let ref = useRef();

  useEffect(() => {
    let clock = new Clock();
    return onLoop(() => {
      let dt = clock.getDelta();

      // if (ref.current) {
      //   ref.current.rotation.y += dt * ui.speed;
      // }
    });
  }, [onLoop, ui]);

  let [color, setColor] = useState("#ffffff");

  useEffect(() => {
    io.in(0, (color) => {
      setColor(color);
    });
  }, [ui, io]);

  return (
    <>
      <Insert3D>
        {/* <group ref={ref}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry></boxGeometry>
            <meshStandardMaterial color={color}></meshStandardMaterial>
          </mesh>
        </group> */}

        <FlowGallery></FlowGallery>
      </Insert3D>
    </>
  );
}

//

//

//
