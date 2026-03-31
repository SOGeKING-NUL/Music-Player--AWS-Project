import { ReactFlowProvider } from "@xyflow/react";
import { InfiniteCanvas } from "./components/canvas/InfiniteCanvas";

function App() {
  return (
    <div className="h-screen w-screen bg-white overflow-hidden relative">
      {/* Branding Watermark */}
      <div className="fixed top-6 right-6 z-50 pointer-events-none select-none">
        <span className="text-xs font-semibold tracking-widest text-gray-300 uppercase">
          Music Player
        </span>
      </div>

      {/* Infinite Canvas (fills entire viewport) */}
      <ReactFlowProvider>
        <InfiniteCanvas />
      </ReactFlowProvider>
    </div>
  );
}

export default App;
