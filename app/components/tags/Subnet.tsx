import { Info } from "lucide-react";

import cn from "~/utils/cn";

import Chip from "../chip";
import Tooltip from "../tooltip";

export interface SubnetTagProps {
  isEnabled?: boolean;
}

export function SubnetTag({ isEnabled }: SubnetTagProps) {
  return (
    <Tooltip
      content={
        isEnabled ? (
          <>此裝置會通告子網路路由。</>
        ) : (
          <>
            This machine has unadvertised subnet routes. Review this from the "Edit route
            settings..." option in the machine's menu.
          </>
        )
      }
    >
      <Chip
        text="Subnets"
        className={cn("bg-blue-300 text-blue-900 dark:bg-blue-900 dark:text-blue-300")}
        rightIcon={isEnabled ? undefined : <Info className="h-full w-fit" />}
      />
    </Tooltip>
  );
}
