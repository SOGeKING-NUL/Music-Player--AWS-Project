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

      {/* Source Handle (connects to the pool) */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-4 !h-4 !bg-black !border-[3px] !border-white shadow-sm"
      />
    </div>
  );
}

export const MainButtonNode = memo(MainButtonNodeComponent);
