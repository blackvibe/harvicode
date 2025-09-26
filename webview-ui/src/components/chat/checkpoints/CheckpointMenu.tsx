import { useState, useCallback } from "react"
import { CheckIcon, Cross2Icon as _Cross2Icon } from "@radix-ui/react-icons"
import { useTranslation } from "react-i18next"
import { GitCompare, RotateCcw } from "lucide-react"

import { Button as _Button, Popover, PopoverContent, PopoverTrigger, StandardTooltip } from "@/components/ui"
import { useRooPortal } from "@/components/ui/hooks"

import { vscode } from "@src/utils/vscode"
import { Checkpoint } from "./schema"

type CheckpointMenuProps = {
	ts: number
	commitHash: string
	currentHash?: string
	checkpoint: Checkpoint
}

export const CheckpointMenu = ({ ts, commitHash, currentHash, checkpoint }: CheckpointMenuProps) => {
	const { t } = useTranslation()
	const [isOpen, setIsOpen] = useState(false)
	const [isConfirming, setIsConfirming] = useState(false)
	const portalContainer = useRooPortal("roo-portal")

	const isCurrent = currentHash === commitHash

	const previousCommitHash = checkpoint?.from

	const onCheckpointDiff = useCallback(() => {
		vscode.postMessage({
			type: "checkpointDiff",
			payload: { ts, previousCommitHash, commitHash, mode: "checkpoint" },
		})
	}, [ts, previousCommitHash, commitHash])

	const onPreview = useCallback(() => {
		vscode.postMessage({ type: "checkpointRestore", payload: { ts, commitHash, mode: "preview" } })
		setIsOpen(false)
	}, [ts, commitHash])

	const onRestore = useCallback(() => {
		vscode.postMessage({ type: "checkpointRestore", payload: { ts, commitHash, mode: "restore" } })
		setIsOpen(false)
	}, [ts, commitHash])

	return (
		<div className="flex flex-row items-center gap-2 py-1">
			{/* Пунктирная линия */}
			<div className="flex-1 border-t border-dashed border-[#3c3c3c]"></div>

			{/* Кнопка "Вернуться к точке" */}
			<Popover
				open={isOpen}
				onOpenChange={(open) => {
					setIsOpen(open)
					setIsConfirming(false)
				}}>
				<StandardTooltip content={t("chat:checkpoint.menu.returnToPoint")}>
					<PopoverTrigger asChild>
						<button className="relative inline-flex items-center justify-center gap-1 bg-[#2d2d30] hover:bg-[#3c3c3c] border border-[#3c3c3c] rounded-full px-2 py-1 h-6 text-[#cccccc] hover:text-white transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#4a4a4a] active:scale-95 cursor-pointer">
							<RotateCcw className="w-3 h-3" />
							<span className="text-[10px] font-medium">{t("chat:checkpoint.menu.returnToPoint")}</span>
						</button>
					</PopoverTrigger>
				</StandardTooltip>
				<PopoverContent
					align="end"
					container={portalContainer}
					className="w-80 p-0 bg-vscode-dropdown-background border border-vscode-dropdown-border shadow-lg rounded-lg">
					{!isCurrent && (
						<div
							className="flex items-center gap-3 p-3 hover:bg-vscode-list-hoverBackground cursor-pointer group rounded-t-lg"
							onClick={onPreview}>
							<div className="flex-1">
								<div className="text-sm text-vscode-foreground font-medium">
									{t("chat:checkpoint.menu.restoreFiles")}
								</div>
								<div className="text-xs text-vscode-descriptionForeground mt-1">
									{t("chat:checkpoint.menu.restoreFilesDescription")}
								</div>
							</div>
						</div>
					)}
					{!isCurrent && <div className="border-t border-vscode-dropdown-border"></div>}
					<div
						className={`flex items-center gap-3 p-3 hover:bg-vscode-list-hoverBackground cursor-pointer group ${!isCurrent ? "rounded-b-lg" : "rounded-lg"}`}>
						<div className="flex-1">
							{!isConfirming ? (
								<div onClick={() => setIsConfirming(true)}>
									<div className="text-sm text-vscode-foreground font-medium">
										{t("chat:checkpoint.menu.restoreFilesAndTask")}
									</div>
									<div className="text-xs text-vscode-descriptionForeground mt-1">
										{t("chat:checkpoint.menu.restoreFilesAndTaskDescription")}
									</div>
								</div>
							) : (
								<div className="space-y-2">
									<div className="text-xs text-red-700/60 font-bold">
										{t("chat:checkpoint.menu.cannotUndo")}
									</div>
									<div className="flex gap-2">
										<button
											onClick={onRestore}
											className="relative inline-flex items-center justify-center gap-1 bg-red-900/40 hover:bg-red-800/50 border border-red-700/60 rounded-full px-3 py-1 h-6 text-red-300 hover:text-red-200 transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-600/50 active:scale-95 cursor-pointer">
											<CheckIcon className="w-3 h-3" />
											<span className="text-[10px] font-medium">
												{t("chat:checkpoint.menu.confirm")}
											</span>
										</button>
										<button
											onClick={() => setIsConfirming(false)}
											className="text-xs text-vscode-descriptionForeground hover:text-vscode-foreground transition-colors cursor-pointer">
											{t("chat:checkpoint.menu.cancel")}
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</PopoverContent>
			</Popover>

			{/* Кнопка "Посмотреть изменения" */}
			<StandardTooltip content={t("chat:checkpoint.menu.viewDiff")}>
				<button
					onClick={onCheckpointDiff}
					className="relative inline-flex items-center justify-center bg-[#2d2d30] hover:bg-[#3c3c3c] border border-[#3c3c3c] rounded-full w-6 h-6 text-[#cccccc] hover:text-white transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#4a4a4a] active:scale-95 cursor-pointer mr-1">
					<GitCompare className="w-3 h-3" />
				</button>
			</StandardTooltip>
		</div>
	)
}
