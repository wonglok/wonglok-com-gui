import { useEffect, useMemo, useState } from "react";

import { RunnerRuntime } from "./RunnerRuntime";
import { RunnerToolBox } from "./RunnerToolBox";
import md5 from "md5";
import { create } from "zustand";
import { getSignature } from "./tools/getSignature";
import { Emit } from "./Emit";

export function EffectNode({
  useStore,
  projectName, //

  // optional for toolbox
  win = false,
  node = { title: false },
  mode = "runtime",

  //
}) {
  let graph = useStore((r) => r.graph) || {};
  let nodes = graph.nodes || [];
  let [api, setDisplay] = useState({ domElement: false });

  let [{ projects, map }, setProjects] = useState({ projects: [], map: false });
  let currentProject = projects.find((r) => r.projectName === projectName);
  useEffect(() => {
    let last = "";

    window.addEventListener("effectNode", ({ detail }) => {
      let { projects } = detail;
      let now = getSignature(projects);
      if (last !== now) {
        last = now;
        // console.log(now, last);

        //

        //
        setProjects({ projects: [], map: false });
        requestIdleCallback(
          () => {
            setProjects({
              projects,
              map: create((set, get) => {
                return {
                  set,
                  get,
                };
              }),
            });
          },
          { timeout: 500 }
        );
      }
    });

    window.dispatchEvent(new CustomEvent("requestEffectNode", { detail: {} }));
  }, []);

  let randID = useMemo(() => {
    return `_${md5(projectName)}`;
  }, [projectName]);

  useEffect(() => {
    let tt = setInterval(() => {
      //
      let domElement = document.querySelector(`#${randID}`);
      //
      if (domElement) {
        //
        clearInterval(tt);
        //
        setDisplay({
          domElement,
        });
      }
    }, 0);

    return () => {
      clearInterval(tt);
    };
  }, [randID]);

  let [{ onLoop }, setAPI] = useState({
    onLoop: () => {},
  });
  useEffect(() => {
    if (!map) {
      return;
    }
    let api = {
      tsk: [],
      onLoop: (v) => {
        api.tsk.push(v);
      },
      workAll: () => {},
    };

    setAPI(api);

    let rAFID = 0;
    let rAF = () => {
      rAFID = requestAnimationFrame(rAF);
      api.tsk.forEach((t) => t());
    };
    rAFID = requestAnimationFrame(rAF);

    return () => {
      cancelAnimationFrame(rAFID);
    };
  }, [map]);

  //
  // console.log(codes);
  //
  let codes = currentProject?.codes || [];
  return (
    <>
      <Emit></Emit>
      {map && (
        <div id={randID} className="w-full h-full overflow-hidden">
          {mode === "runtime" &&
            api.domElement &&
            codes
              .filter((code) => {
                //
                return nodes.some((node) => node.title === code.codeName);
              })
              .map((code) => {
                return (
                  <RunnerRuntime
                    onLoop={onLoop}
                    socketMap={map}
                    win={win}
                    key={code._id}
                    code={code}
                    useStore={useStore}
                    project={currentProject}
                    domElement={api.domElement}
                  ></RunnerRuntime>
                );
              })}

          {mode === "toolbox" &&
            api.domElement &&
            codes
              .filter((r) => {
                return r.codeName === node.title;
              })
              .map((code) => {
                return (
                  <RunnerToolBox
                    onLoop={onLoop}
                    win={win}
                    socketMap={map}
                    key={code._id}
                    code={code}
                    useStore={useStore}
                    project={currentProject}
                    domElement={api.domElement}
                  ></RunnerToolBox>
                );
              })}
        </div>
      )}
    </>
  );
}
