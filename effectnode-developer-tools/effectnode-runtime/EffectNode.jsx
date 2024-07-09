import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { RunnerRuntime } from "./RunnerRuntime";
import md5 from "md5";
import { create } from "zustand";
import { Emit } from "./Emit";
import { LastCache } from "./tools/LastCache";
import { getSignature } from "./tools/getSignature";
import { usePopStore } from "./tools/usePopStore";

export function EffectNode({
  projectName, //

  // optional for toolbox
  mode = "runtime",
  extNode = false,
  useEditorStore = false,
}) {
  //
  projectName = projectName.toLowerCase();
  //

  let [api, setDisplay] = useState({ domElement: false });

  let useRuntime = useMemo(() => {
    return create((set, get) => {
      //
      return {
        socketMap: create(() => ({})),

        codes: false,
        settings: [],

        projectName: projectName,
        files: false,
        project: false,
        graph: false,
      };
      //
    });
  }, [projectName]);

  let files = useRuntime((r) => r.files);
  let socketMap = useRuntime((r) => r.socketMap);
  let codes = useRuntime((r) => r.codes);
  let graph = useRuntime((r) => r.graph);
  let project = useRuntime((r) => r.project);
  let nodes = graph.nodes || [];

  useEffect(() => {
    if (!useRuntime) {
      return;
    }
    if (!useEditorStore) {
      return;
    }
    return useEditorStore.subscribe((state, before) => {
      if (state.settings) {
        useRuntime.setState({
          settings: JSON.parse(JSON.stringify(state.settings)),
        });
      }
    });
  }, [useRuntime, useEditorStore]);

  let randID = useMemo(() => {
    return `_${md5(projectName)}${mode}${extNode?._id || ""}`;
  }, [projectName, mode, extNode]);

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

  let onData = useCallback(
    async (data) => {
      //
      let projects = data.projects;
      let project = projects.find((r) => r.projectName === projectName);

      if (project) {
        let files = {};
        project.assets.forEach((ac) => {
          files[ac._id.split("/assets")[1]] = ac.assetURL;
        });

        useRuntime.setState({
          socketMap: create(() => {
            return {};
          }),
          files: files,
          project: project,
          codes: project.codes,
          settings: project.settings,
          graph: project.graph,
        });
      }
    },

    [projectName, useRuntime]
  );

  let projects = usePopStore((s) => s.projects);

  useEffect(() => {
    onData({ projects: usePopStore.getState().projects });

    return usePopStore.subscribe(async (now, b4) => {
      let nowSig = await getSignature(now.projects);
      let b4Sig = await getSignature(b4.projects);
      if (nowSig.text !== b4Sig.text) {
        onData({ projects: projects });
      }
    });
  }, [onData, projects]);

  codes = codes || [];
  let codeOne = codes.find((r) => r.codeName === extNode.title);
  return (
    <>
      {socketMap && files && useRuntime && (
        <div id={randID} className="w-full h-full overflow-hidden relative">
          {mode === "runtime" &&
            api.domElement &&
            codes
              .filter((code) => {
                return nodes.some((node) => node.title === code.codeName);
              })
              .map((code) => {
                return (
                  <RunnerRuntime
                    onLoop={onLoop}
                    socketMap={socketMap}
                    key={code._id}
                    code={code}
                    useStore={useRuntime}
                    project={project}
                    domElement={api.domElement}
                    mode={"runtime"}
                  ></RunnerRuntime>
                );
              })}

          {mode === "toolbox" && codeOne && codes && (
            <RunnerRuntime
              onLoop={onLoop}
              socketMap={socketMap}
              key={codeOne._id}
              code={codeOne}
              useStore={useRuntime}
              project={project}
              domElement={api.domElement}
              mode={"toolbox"}
            ></RunnerRuntime>
          )}
        </div>
      )}

      <Emit projectName={projectName}></Emit>

      {/*  */}

      {/*  */}
    </>
  );
}
