import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { HoverBorderGradient } from '../ui/hover-border-gradient';
import { Plus } from 'lucide-react';

function MainButtonNodeComponent() {
  return (
    <div className="relative">
      <HoverBorderGradient
        containerClassName="rounded-full"
        className="flex items-center gap-2 px-6 py-3 font-semibold text-sm"
      >
        <Plus className="w-4 h-4" />
        Add Artist
      </HoverBorderGradient>

      {/* Source Handle → Artist Pool (right side) */}
      <Handle 
        type="source" 
        id="to-pool"
        position={Position.Right} 
        className="!w-3 !h-3 !bg-gray-400 !border-[2px] !border-white shadow-sm"
      />
      {/* Source Handle → Add Artist form (top side) */}
      <Handle 
        type="source" 
        id="to-add-artist"
        position={Position.Top} 
        className="!w-3 !h-3 !bg-gray-400 !border-[2px] !border-white shadow-sm"
      />
    </div>
  );
}

export const MainButtonNode = memo(MainButtonNodeComponent);
