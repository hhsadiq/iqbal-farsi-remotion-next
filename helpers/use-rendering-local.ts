import { z } from "zod";
import { useCallback, useState } from "react";
import { renderStill, renderFrames, stitchFramesToVideo } from "@remotion/renderer";
import { CompositionProps } from "../types/constants";

export type State =
  | {
      status: "init";
    }
  | {
      status: "rendering";
      progress: number;
    }
  | {
      status: "error";
      error: Error;
    }
  | {
      url: string;
      status: "done";
    };

export const useRendering = (
  id: string,
  inputProps: z.infer<typeof CompositionProps>
) => {
  const [state, setState] = useState<State>({ status: "init" });

  const renderMedia = useCallback(async () => {
    setState({ status: "rendering", progress: 0 });

    try {
      // Define the output file path
      const outputFile = `out/${inputProps.title}.mp4`;

      // Render frames and stitch them into a video
      const { cancel, getProgress } = renderFrames({
        config: {
          id,
          inputProps,
          compositionWidth: 1920, // Set according to your composition
          compositionHeight: 1080, // Set according to your composition
          durationInFrames: 150, // Set according to your composition
          fps: 30, // Set according to your composition
        },
        onStart: () => console.log("Rendering started"),
        onFrameUpdate: (frame) => {
          console.log(`Rendering frame: ${frame}`);
          setState((prevState) => ({
            ...prevState,
            progress: frame / 150, // Update progress based on your total frames
          }));
        },
        outputDir: "./out", // Temporary directory to store frames
      });

      
      await stitchFramesToVideo({
        dir: "./out", // Directory where frames are stored
        force: true,
        fps: 30, // Set according to your composition
        height: 1080, // Set according to your composition
        outputLocation: outputFile,
        width: 1920, // Set according to your composition
        assetsInfo: {
          assets: [],
          imageSequenceName: '',
          firstFrameIndex: 0,
          downloadMap: {},
        }, // Minimal assetsInfo structure
            });

      setState({ status: "done", url: outputFile });
    } catch (error) {
      setState({ status: "error", error: error as Error });
      console.error("Rendering error:", error);
    }
  }, [id, inputProps]);

  const undo = useCallback(() => {
    setState({ status: "init" });
  }, []);

  return { renderMedia, state, undo };
};
