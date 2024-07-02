import { useEffect, useMemo, useState } from "react";

import { RunnerRuntime } from "./RunnerRuntime";
import { RunnerToolBox } from "./RunnerToolBox";
import md5 from "md5";
import { create } from "zustand";
import { getSignature } from "./tools/getSignature";
import { Emit } from "./Emit";

export function EffectNode({
  useStore = false,
  projectName, //

  // optional for toolbox
  win = false,
  node = { title: false },
  mode = "runtime",
  onReady = () => {},
}) {
  //
  projectName = projectName.toLowerCase();
  //

  //
  let [api, setDisplay] = useState({ domElement: false });

  let [{ socketMap, useRuntime }, setProjects] = useState({
    socketMap: create(() => {
      return {};
    }),
    useRuntime: create(() => {
      return {
        codes: [],
        settings: [],
        project: false,
        graph: false,
      };
    }),
  });
  let codes = useRuntime((r) => r.codes);
  let graph = useRuntime((r) => r.graph);
  let project = useRuntime((r) => r.project);
  let nodes = graph.nodes || [];

  useEffect(() => {
    if (graph) {
      onReady({ useRuntime });
    }
  }, [graph, onReady, useRuntime]);

  useEffect(() => {
    if (!useRuntime) {
      return;
    }
    if (!useStore) {
      return;
    }
    return useStore.subscribe((state, before) => {
      if (state.settings) {
        useRuntime.setState({
          settings: JSON.parse(JSON.stringify(state.settings)),
        });
      }
    });
  }, [useRuntime, useStore]);

  useEffect(() => {
    let lastText = "";
    let lastCode = "";

    let hh = ({ detail }) => {
      let { projects } = detail;

      let { text, codes } = getSignature(projects);

      if (lastText !== text) {
        lastText = text;
        lastCode = codes;

        let project = projects.find((r) => r.projectName === projectName);

        if (project) {
          let useRuntime = create(() => {
            return {
              project: project,
              codes: project.codes,
              settings: project.settings,
              graph: project.graph,
            };
          });

          setProjects({
            useRuntime: useRuntime,
            socketMap: create(() => {
              return {};
            }),
          });
        }
      }
    };
    window.addEventListener("effectNode", hh);

    window.dispatchEvent(
      new CustomEvent("requestEffectNodeProjectJSON", { detail: {} })
    );

    return () => {
      window.removeEventListener("effectNode", hh);
    };
  }, [projectName]);

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
    if (!socketMap) {
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
  }, [socketMap]);

  return (
    <>
      <Emit></Emit>
      {socketMap && useRuntime && (
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
                    socketMap={socketMap}
                    win={win}
                    key={code._id}
                    code={code}
                    useStore={useRuntime}
                    project={project}
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
                    socketMap={socketMap}
                    key={code._id}
                    code={code}
                    useStore={useRuntime}
                    project={project}
                    domElement={api.domElement}
                  ></RunnerToolBox>
                );
              })}
        </div>
      )}
    </>
  );
}