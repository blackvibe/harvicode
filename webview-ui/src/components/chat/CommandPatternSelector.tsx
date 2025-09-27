import React, { useState, useMemo } from "react"
import { Check, ChevronDown, Info, X, MoreHorizontal } from "lucide-react"
import { cn } from "../../lib/utils"
import { useTranslation } from "react-i18next"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"

interface CommandPattern {
	pattern: string
	description?: string
}

interface CommandPatternSelectorProps {
	patterns: CommandPattern[]
	allowedCommands: string[]
	deniedCommands: string[]
	onAllowPatternChange: (pattern: string) => void
	onDenyPatternChange: (pattern: string) => void
}

export const CommandPatternSelector: React.FC<CommandPatternSelectorProps> = ({
	patterns,
	allowedCommands,
	deniedCommands,
	onAllowPatternChange,
	onDenyPatternChange,
}) => {
	const { t } = useTranslation()
	const [isExpanded, setIsExpanded] = useState(false)
	const [editingStates, setEditingStates] = useState<Record<string, { isEditing: boolean; value: string }>>({})

	const handleOpenSettings = () => {
		window.postMessage({ type: "action", action: "settingsButtonClicked", values: { section: "autoApprove" } })
	}

	// Create a combined list with full command first, then patterns
	const allPatterns = useMemo(() => {
		// Create a set to track unique patterns we've already seen
		const seenPatterns = new Set<string>()

		// Filter out any patterns that are duplicates or are the same as the full command
		const uniquePatterns = patterns.filter((p) => {
			if (seenPatterns.has(p.pattern)) {
				return false
			}
			seenPatterns.add(p.pattern)
			return true
		})

		return uniquePatterns
	}, [patterns])

	const getPatternStatus = (pattern: string): "allowed" | "denied" | "none" => {
		if (allowedCommands.includes(pattern)) return "allowed"
		if (deniedCommands.includes(pattern)) return "denied"
		return "none"
	}

	const getEditState = (pattern: string) => {
		return editingStates[pattern] || { isEditing: false, value: pattern }
	}

	const setEditState = (pattern: string, isEditing: boolean, value?: string) => {
		setEditingStates((prev) => ({
			...prev,
			[pattern]: { isEditing, value: value ?? pattern },
		}))
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="h-4 w-4 p-0 hover:bg-[#3c3c3c]">
					<MoreHorizontal className="h-2.5 w-2.5" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56 bg-[#2d2d30] border border-[#3c3c3c]">
				<DropdownMenuItem
					onClick={() => setIsExpanded(!isExpanded)}
					className="flex items-center gap-2 text-[#cccccc] hover:bg-[#3c3c3c] focus:bg-[#3c3c3c]">
					<ChevronDown
						className={cn("size-4 transition-transform", {
							"-rotate-90": !isExpanded,
						})}
					/>
					<span>{t("chat:commandExecution.manageCommands")}</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={handleOpenSettings}
					className="flex items-center gap-2 text-[#cccccc] hover:bg-[#3c3c3c] focus:bg-[#3c3c3c]">
					<Info className="size-4" />
					<span>Настройки разрешений</span>
				</DropdownMenuItem>
			</DropdownMenuContent>

			{isExpanded && (
				<div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-2 space-y-2">
					{allPatterns.map((item) => {
						const editState = getEditState(item.pattern)
						const status = getPatternStatus(editState.value)

						return (
							<div key={item.pattern} className="flex items-center gap-2">
								<div className="flex-1">
									{editState.isEditing ? (
										<input
											type="text"
											value={editState.value}
											onChange={(e) => setEditState(item.pattern, true, e.target.value)}
											onBlur={() => setEditState(item.pattern, false)}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													setEditState(item.pattern, false)
												}
												if (e.key === "Escape") {
													setEditState(item.pattern, false, item.pattern)
												}
											}}
											className="font-mono text-xs bg-[#2d2d30] text-[#cccccc] border border-[#3c3c3c] rounded px-2 py-1 w-full focus:outline-0 focus:ring-1 focus:ring-[#4a4a4a]"
											placeholder={item.pattern}
											autoFocus
										/>
									) : (
										<div
											onClick={() => setEditState(item.pattern, true)}
											className="font-mono text-xs text-[#cccccc] cursor-pointer hover:bg-[#3c3c3c] px-2 py-1 rounded transition-colors border border-transparent break-all"
											title="Click to edit pattern">
											<span className="break-all">{editState.value}</span>
											{item.description && (
												<span className="text-[#888888] ml-2">- {item.description}</span>
											)}
										</div>
									)}
								</div>
								<div className="flex items-center gap-1">
									<button
										className={cn("p-1 rounded transition-all", {
											"bg-green-500/20 text-green-500 hover:bg-green-500/30":
												status === "allowed",
											"text-[#888888] hover:text-green-500 hover:bg-green-500/10":
												status !== "allowed",
										})}
										onClick={() => onAllowPatternChange(editState.value)}
										aria-label={t(
											status === "allowed"
												? "chat:commandExecution.removeFromAllowed"
												: "chat:commandExecution.addToAllowed",
										)}>
										<Check className="size-3" />
									</button>
									<button
										className={cn("p-1 rounded transition-all", {
											"bg-red-500/20 text-red-500 hover:bg-red-500/30": status === "denied",
											"text-[#888888] hover:text-red-500 hover:bg-red-500/10":
												status !== "denied",
										})}
										onClick={() => onDenyPatternChange(editState.value)}
										aria-label={t(
											status === "denied"
												? "chat:commandExecution.removeFromDenied"
												: "chat:commandExecution.addToDenied",
										)}>
										<X className="size-3" />
									</button>
								</div>
							</div>
						)
					})}
				</div>
			)}
		</DropdownMenu>
	)
}
