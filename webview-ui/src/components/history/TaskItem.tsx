import { memo } from "react"
import type { HistoryItem } from "@roo-code/types"

import { vscode } from "@/utils/vscode"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { formatTimeAgo } from "@/utils/format"
import { FavoriteButton } from "../kilocode/history/FavoriteButton"
import { ExportButton } from "./ExportButton"
import { DeleteButton } from "./DeleteButton"

interface DisplayHistoryItem extends HistoryItem {
	highlight?: string
}

interface TaskItemProps {
	item: DisplayHistoryItem
	variant: "compact" | "full"
	showWorkspace?: boolean
	isSelectionMode?: boolean
	isSelected?: boolean
	onToggleSelection?: (taskId: string, isSelected: boolean) => void
	onDelete?: (taskId: string) => void
	className?: string
}

const TaskItem = ({
	item,
	variant,
	showWorkspace = false,
	isSelectionMode = false,
	isSelected = false,
	onToggleSelection,
	onDelete,
	className,
}: TaskItemProps) => {
	const handleClick = () => {
		if (isSelectionMode && onToggleSelection) {
			onToggleSelection(item.id, !isSelected)
		} else {
			vscode.postMessage({ type: "showTaskWithId", text: item.id })
		}
	}

	const isCompact = variant === "compact"

	return (
		<div
			key={item.id}
			data-testid={`task-item-${item.id}`}
			className={cn(
				"cursor-pointer group bg-vscode-editor-background relative overflow-hidden border border-transparent hover:bg-[#1a1a1a] transition-colors",
				{
					"bg-red-900 text-white": item.fileNotfound, // kilocode_change added this state instead of removing
					"bg-vscode-editor-background": !item.fileNotfound, //kilocode_change this is the default normally in the regular classname list
				},
				className,
			)}
			onClick={handleClick}>
			<div className="flex items-center gap-2 px-3 py-2">
				{/* Selection checkbox - only in full variant */}
				{!isCompact && isSelectionMode && (
					<div
						className="task-checkbox flex-shrink-0"
						onClick={(e) => {
							e.stopPropagation()
						}}>
						<Checkbox
							checked={isSelected}
							onCheckedChange={(checked: boolean) => onToggleSelection?.(item.id, checked === true)}
							variant="description"
						/>
					</div>
				)}

				{/* Main content area */}
				<div className="flex-1 min-w-0">
					<div
						className={cn(
							"overflow-hidden whitespace-pre-wrap text-vscode-foreground text-ellipsis line-clamp-2 mb-1",
							{
								"text-base": !isCompact,
							},
						)}
						data-testid="task-content"
						{...(item.highlight ? { dangerouslySetInnerHTML: { __html: item.highlight } } : {})}>
						{item.highlight ? undefined : item.task}
					</div>

					{/* Footer info without favorite button */}
					<div className="text-xs text-vscode-descriptionForeground/60 flex gap-2 items-center">
						<span className="first-letter:uppercase">{formatTimeAgo(item.ts)}</span>
						<span>·</span>
						{!!item.totalCost && (
							<span data-testid="cost-footer-compact">{"$" + item.totalCost.toFixed(2)}</span>
						)}
					</div>

					{showWorkspace && item.workspace && (
						<div className="flex flex-row gap-1 text-vscode-descriptionForeground text-xs mt-1">
							<span className="codicon codicon-folder scale-80" />
							<span>{item.workspace}</span>
						</div>
					)}
				</div>

				{/* Action buttons - always centered vertically */}
				{!isSelectionMode && (
					<div className="flex items-center gap-0 flex-shrink-0">
						<FavoriteButton isFavorited={item.isFavorited ?? false} id={item.id} />
						{variant === "full" && <ExportButton itemId={item.id} />}
						{onDelete && <DeleteButton itemId={item.id} onDelete={onDelete} />}
					</div>
				)}
			</div>
		</div>
	)
}

export default memo(TaskItem)
