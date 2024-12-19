import * as React from "react"
import { cn } from "../../lib/utils"

const Tree = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Tree.displayName = "Tree"

const TreeItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-2 hover:bg-accent hover:text-accent-foreground",
      className
    )}
    {...props}
  />
))
TreeItem.displayName = "TreeItem"

export { Tree, TreeItem }
