import { useState, useCallback } from "react"
import { CheckIcon, Cross2Icon } from "@radix-ui/react-icons"
import { useTranslation } from "react-i18next"
import { GitCompare } from "lucide-react"

import { Button, Popover, PopoverContent, PopoverTrigger, StandardTooltip } from "@/components/ui"
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
		<div className="flex flex-row items-center gap-2">
			{/* Пунктирная линия */}
			<div className="flex-1 border-t border-dashed border-[#3c3c3c]"></div>
			<Popover
				open={isOpen}
				onOpenChange={(open) => {
					setIsOpen(open)
					setIsConfirming(false)
				}}>
				<StandardTooltip content={t("chat:checkpoint.menu.restore")}>
					<PopoverTrigger asChild>
						<div className="w-2 h-2 bg-[#cccccc] hover:bg-white rounded-full cursor-pointer transition-colors duration-150"></div>
					</PopoverTrigger>
				</StandardTooltip>
				<PopoverContent align="end" container={portalContainer}>
					<div className="flex flex-col gap-2">
						{!isCurrent && (
							<div className="flex flex-col gap-1 group hover:text-foreground">
								<Button variant="secondary" onClick={onPreview}>
									{t("chat:checkpoint.menu.restoreFiles")}
								</Button>
								<div className="text-muted transition-colors group-hover:text-foreground">
									{t("chat:checkpoint.menu.restoreFilesDescription")}
								</div>
							</div>
						)}
						<div className="flex flex-col gap-1 group hover:text-foreground">
							<div className="flex flex-col gap-1 group hover:text-foreground">
								{!isConfirming ? (
									<Button variant="secondary" onClick={() => setIsConfirming(true)}>
										{t("chat:checkpoint.menu.restoreFilesAndTask")}
									</Button>
								) : (
									<>
										<Button variant="default" onClick={onRestore} className="grow">
											<div className="flex flex-row gap-1">
												<CheckIcon />
												<div>{t("chat:checkpoint.menu.confirm")}</div>
											</div>
										</Button>
										<Button variant="secondary" onClick={() => setIsConfirming(false)}>
											<div className="flex flex-row gap-1">
												<Cross2Icon />
												<div>{t("chat:checkpoint.menu.cancel")}</div>
											</div>
										</Button>
									</>
								)}
								{isConfirming ? (
									<div className="text-destructive font-bold">
										{t("chat:checkpoint.menu.cannotUndo")}
									</div>
								) : (
									<div className="text-muted transition-colors group-hover:text-foreground">
										{t("chat:checkpoint.menu.restoreFilesAndTaskDescription")}
									</div>
								)}
							</div>
						</div>
					</div>
				</PopoverContent>
			</Popover>

			{/* Компактная кнопка различий */}
			<StandardTooltip content={t("chat:checkpoint.menu.viewDiff")}>
				<button
					onClick={onCheckpointDiff}
					className="relative inline-flex items-center justify-center bg-[#2d2d30] hover:bg-[#3c3c3c] border border-[#3c3c3c] rounded-full w-6 h-6 text-[#cccccc] hover:text-white transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#4a4a4a] active:scale-95 cursor-pointer">
					<GitCompare className="w-3 h-3" />
				</button>
			</StandardTooltip>
		</div>
	)
}
