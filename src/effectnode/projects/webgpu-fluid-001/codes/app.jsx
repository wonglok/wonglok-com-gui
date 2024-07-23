import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Add3D, useGPU } from "./main";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CircleGeometry,
  Clock,
  GridHelper,
  InstancedBufferGeometry,
  Object3D,
  RingGeometry,
  SphereGeometry,
  TextureLoader,
  Vector3,
} from "three";
import { Mesh } from "three";
import { resolveCollisions } from "../loklok/resolveCollisions";

import {
  uv,
  vec4,
  color,
  mix,
  range,
  pass,
  timerLocal,
  add,
  cos,
  sin,
  mat3,
  abs,
  sign,
  int,
  uint,
  pow,
  distance,
  min,
  max,
  timerDelta,
  positionLocal,
  attribute,
  buffer,
  tslFn,
  uniform,
  texture,
  instanceIndex,
  float,
  vec3,
  storage,
  SpriteNodeMaterial,
  If,
  mat4,
  normalLocal,
  MeshPhysicalNodeMaterial,
  floor,
  bool,
} from "three/examples/jsm/nodes/Nodes";
import StorageInstancedBufferAttribute from "three/examples/jsm/renderers/common/StorageInstancedBufferAttribute";
// import { calculateDensity } from "../loklok/calculateDensity";
// import { distanceTo } from "../loklok/distanceTo";
// import { smoothinKernel } from "../loklok/smoothKernel";
import { Plane, Sphere } from "@react-three/drei";

export function AppRun({ useStore, io }) {
  let files = useStore((r) => r.files);
  let renderer = useThree((r) => r.gl);
  let works = useMemo(() => [], []);

  let uiPointer = useMemo(() => {
    return uniform(vec3(0, 0, 0));
  }, []);

  const dimension = 15;
  const boundSizeMin = vec3(0, 0, 0);
  const boundSizeMax = vec3(dimension * 2, dimension * 6, dimension * 2);

  let uiOffset = useMemo(() => {
    return vec3(boundSizeMax.x.div(-2), 0, boundSizeMax.z.div(-2));
  }, [boundSizeMax.x, boundSizeMax.z]);

  useFrame((st, dt) => {
    works.forEach((t) => t(st, dt));
  }, 1);

  let onLoop = useCallback(
    (v) => {
      works.push(v);
    },
    [works]
  );

  //

  let { show, mounter } = useMemo(() => {
    let mounter = new Object3D();
    return {
      mounter,
      show: <primitive object={mounter}></primitive>,
    };
  }, []);

  let scene = useThree((r) => r.scene);

  useEffect(() => {
    async function runApp() {
      const createBuffer = ({ itemSize = 3, type = "vec3", count }) => {
        let attr = new StorageInstancedBufferAttribute(count, itemSize);

        let node = storage(attr, type, count);
        return {
          node,
          attr,
        };
      };

      //
      let side = 15;
      let COUNT = side * side * side;

      // let h = 16;

      // let VISCOUSITY = 900 * 5;
      // let PARTICLE_MASS = 500 * 0.13;
      // let STIFFNESS = 400 * 5;
      // let GRAVITY_CONST = 120000 * 9.82;
      // let dt = 0.0004;

      // // UI
      // const START_OFFSET_X = 100;
      // const START_OFFSET_Y = 256;
      // const OFFSET_Z = 750;
      // const SQUARE_SIZE = 512;
      // const LINEWIDTH = 10;
      // const PARTICLE_RADIUS = h / 2;

      const positionBuffer = createBuffer({
        itemSize: 3,
        type: "vec3",
        count: COUNT,
      });

      const velocityBuffer = createBuffer({
        itemSize: 3,
        type: "vec3",
        count: COUNT,
      });

      const pressureForceBuffer = createBuffer({
        itemSize: 3,
        type: "vec3",
        count: COUNT,
      });

      const particleSize = float(0.5);

      // const smoothingRadius = float(particleSize.mul(10));

      const mass = float(0.5);

      const gravity = float(-0.4);

      const pressureFactor = float(2);

      const SLOT_COUNT = dimension * 2 * (dimension * 6) * (dimension * 2);
      const spaceSlotCounter = createBuffer({
        itemSize: 1,
        type: "float",
        count: SLOT_COUNT,
      });

      // each center = floor each coord but add 0.5

      let delta = uniform();
      let clock = new Clock();

      onLoop(() => {
        delta.value = clock.getDelta();
        if (delta.value >= 1 / 30) {
          delta.value = 1 / 30;
        }
      });

      {
        //
        let i = 0;
        let full = COUNT;

        for (let z = 0; z < side; z++) {
          //
          for (let y = 0; y < side; y++) {
            //
            for (let x = 0; x < side; x++) {
              //

              //
              if (i < full) {
                positionBuffer.attr.setXYZ(
                  i,
                  x + dimension / 2,
                  y + dimension,
                  z + dimension / 2
                );
                positionBuffer.attr.needsUpdate = true;

                //
                velocityBuffer.attr.setXYZ(i, 0.0, 0.2, 0.0);
                velocityBuffer.attr.needsUpdate = true;

                i++;
              }
              //
            }

            //
          }

          //
        }
      }
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      let getXYZFromIndex = ({ index }) => {
        let idx = uint(index);
        let maxX = uint(boundSizeMax.x);
        let maxY = uint(boundSizeMax.y);
        let maxZ = uint(boundSizeMax.z);

        let x = idx.div(maxY).div(maxZ); // / maxY / maxZ;
        let y = idx.div(maxZ).remainder(maxY); // / maxZ
        let z = idx.remainder(maxZ); //

        return {
          x,
          y,
          z,
        };
      };

      let getIndexWithPosition = ({ position }) => {
        let maxX = uint(boundSizeMax.x);
        let maxY = uint(boundSizeMax.y);
        let maxZ = uint(boundSizeMax.z);

        // position.assign(max(min(position, boundSizeMax), boundSizeMin));

        let x = uint(position.x);
        let y = uint(position.y);
        let z = uint(position.z);

        // index = z + y * maxZ + x * maxY * maxZ

        let index = z.add(y.mul(maxZ)).add(x.mul(maxY).mul(maxZ));

        return index;
      };

      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      let calcSlotCounter = tslFn(() => {
        let position = positionBuffer.node.element(instanceIndex);
        If(instanceIndex.equal(uint(0)), () => {
          //
          let index = getIndexWithPosition({ position: position });
          let space = spaceSlotCounter.node.element(index);
          space.assign(0);
        });

        // particle
        {
          let index = getIndexWithPosition({ position: position });
          let space = spaceSlotCounter.node.element(index);
          space.addAssign(1);
        }

        // hand
        {
          {
            for (let z = -2; z <= 2; z++) {
              for (let y = -2; y <= 2; y++) {
                for (let x = -2; x <= 2; x++) {
                  let point = vec3(
                    //
                    floor(uiPointer.sub(uiOffset).x.add(x)),
                    floor(uiPointer.sub(uiOffset).y.add(y)),
                    floor(uiPointer.sub(uiOffset).z.add(z))
                  );

                  If(
                    bool(true).and(
                      point.x
                        .lessThan(boundSizeMax.x)
                        .and(point.x.greaterThan(boundSizeMin.x)),
                      point.y
                        .lessThan(boundSizeMax.y)
                        .and(point.y.greaterThan(boundSizeMin.y)),
                      point.z
                        .lessThan(boundSizeMax.z)
                        .and(point.z.greaterThan(boundSizeMin.z))
                    ),
                    () => {
                      let index = getIndexWithPosition({
                        position: point,
                      });

                      let spaceCount = spaceSlotCounter.node.element(index);

                      spaceCount.addAssign(20);
                    }
                  );
                }
              }
            }
          }

          // let index = getIndexWithPosition({ position: position });
          // let space = spaceSlotCounter.node.element(index);
          // space.addAssign(1);
        }
      });

      let calcSlotCounterComp = calcSlotCounter().compute(COUNT);

      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      let calcResetAllSpaceSlot = tslFn(() => {
        let slot = spaceSlotCounter.node.element(instanceIndex);
        slot.assign(0);
      }, []);

      let calcResetSpaceComp = calcResetAllSpaceSlot().compute(SLOT_COUNT);

      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      let calcIdle = tslFn(() => {
        //
        let position = positionBuffer.node.element(instanceIndex);
        let velocity = velocityBuffer.node.element(instanceIndex);
        // let pressureForce = pressureForceBuffer.node.element(instanceIndex);

        velocity.addAssign(vec3(0.0, gravity.mul(mass).mul(delta), 0.0));

        //
        {
          for (let z = -2; z <= 2; z++) {
            for (let y = -2; y <= 2; y++) {
              for (let x = -2; x <= 2; x++) {
                let index = getIndexWithPosition({
                  position: vec3(
                    //
                    position.x.add(x),
                    position.y.add(y),
                    position.z.add(z)
                  ),
                });

                let spaceCount = spaceSlotCounter.node.element(index);

                let center = vec3(
                  floor(position.x.add(x)).add(0.5),
                  floor(position.y.add(y)).add(0.5),
                  floor(position.z.add(z)).add(0.5)
                );

                let diff = position
                  .sub(center)
                  .normalize()
                  .mul(spaceCount)

                  .mul(delta)
                  .mul(1 / 2)
                  .mul(1 / 2)
                  .mul(1 / 2)
                  .mul(mass);

                velocity.addAssign(diff);
              }
            }
          }
        }

        //

        // velocity.addAssign(pressureForce);

        position.addAssign(velocity);

        resolveCollisions({
          collisionDamping: 1,
          boundSizeMax,
          boundSizeMin,
          position,
          velocity,
          particleSize,
          delta,
        });
      });

      let calcIdleComp = calcIdle().compute(COUNT);

      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      onLoop(() => {
        renderer.compute(calcIdleComp);
        renderer.compute(calcResetSpaceComp);
        renderer.compute(calcSlotCounterComp);
      });

      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      // render //
      {
        const particleMaterial = new SpriteNodeMaterial();
        let posAttr = positionBuffer.node.toAttribute();

        // display different
        particleMaterial.positionNode = posAttr.add(uiOffset);

        const velocity = velocityBuffer.node.toAttribute();
        const size = velocity.length();
        //
        //
        particleMaterial.colorNode = mix(vec3(0, 0, 1), vec3(0, 1, 1), size);
        particleMaterial.scaleNode = size.mul(3);

        //

        particleMaterial.depthTest = true;
        particleMaterial.depthWrite = false;
        particleMaterial.transparent = true;
        particleMaterial.alphaTest = 0.8;
        particleMaterial.opacity = 1;

        const particles = new Mesh(
          new SphereGeometry(particleSize.value, 32, 32),
          particleMaterial
        );
        particles.isInstancedMesh = true;
        particles.count = COUNT;
        particles.frustumCulled = false;

        mounter.add(particles);

        const helper = new GridHelper(100, 100, 0xff3030, 0x005555);

        mounter.add(helper);

        //
      }
    }
    runApp();

    return () => {
      mounter.clear();
    };
  }, [scene, onLoop, renderer, mounter, files]);

  //
  //
  useFrame(({ gl, scene, camera }) => {
    gl.renderAsync(scene, camera);
  }, 100);
  //

  let ref = useRef();
  let refBox = useRef();

  useFrame(({ camera }) => {
    if (ref) {
      ref.current.lookAt(
        camera.position.x,
        ref.current.position.y,
        camera.position.z
      );
    }
    if (refBox) {
      refBox.current.position.copy(uiPointer.value);
    }
  });
  return (
    <>
      {/*  */}
      {show}

      <Sphere scale={1} ref={refBox}>
        <meshStandardMaterial color={"#ff0000"}></meshStandardMaterial>
      </Sphere>
      <Plane
        ref={ref}
        scale={500}
        visible={false}
        onPointerMove={(ev) => {
          // ev.point;
          uiPointer.value.copy(ev.point);
        }}
      ></Plane>

      {/*  */}
    </>
  );
}

// export const
export function Runtime({ io, useStore }) {
  return (
    <>
      <Add3D>
        <AppRun io={io} useStore={useStore}></AppRun>
      </Add3D>
    </>
  );
}

export function ToolBox() {
  return <></>;
}
