import { useEffect, useMemo, useState } from "react";
import { CodeRun } from "./CodeRun";

export function RunnerToolBox({
  onLoop,
  socketMap,
  code,
  useStore,
  domElement,
}) {
  //
  let [mounted, setMount] = useState(null);
  //
  let codePromise = useMemo(() => {
    return code.loadCode();
  }, [code]);
  //
  let codeName = code.codeName;
  //

  useEffect(() => {
    codePromise.then((mod) => {
      setMount(
        <CodeRun
          onLoop={onLoop}
          socketMap={socketMap}
          domElement={domElement}
          useStore={useStore}
          codeName={codeName}
          Algorithm={mod.ToolBox}
        ></CodeRun>
      );
    });

    return () => {
      setMount(null);
    };
  }, [codeName, onLoop, codePromise, socketMap, domElement, useStore]);

  //
  return (
    <>
      {/*  */}

      {mounted}

      {/*  */}
    </>
  );
}