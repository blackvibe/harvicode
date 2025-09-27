import { useCallback, useState, memo, useMemo } from "react"
import { useEvent } from "react-use"
import { ChevronDown, Skull, Play, X, MoreHorizontal } from "lucide-react"

import { CommandExecutionStatus, commandExecutionStatusSchema } from "@roo-code/types"

import { ExtensionMessage } from "@roo/ExtensionMessage"
import { safeJsonParse } from "@roo/safeJsonParse"

import { COMMAND_OUTPUT_STRING } from "@roo/combineCommandSequences"

import { vscode } from "@src/utils/vscode"
import { useExtensionState } from "@src/context/ExtensionStateContext"
import { cn } from "@src/lib/utils"
import { Button } from "@src/components/ui"
import CodeBlock from "../kilocode/common/CodeBlock" // kilocode_change
import { CommandPatternSelector } from "./CommandPatternSelector"
import { parseCommand } from "../../utils/command-validation"
import { extractPatternsFromCommand } from "../../utils/command-parser"

interface CommandPattern {
	pattern: string
	description?: string
}

interface CommandExecutionProps {
	executionId: string
	text?: string
	icon?: JSX.Element | null
	title?: JSX.Element | null
	isAwaitingApproval?: boolean
	onApprove?: () => void
	onReject?: () => void
}

export const CommandExecution = ({
	executionId,
	text,
	icon,
	title,
	isAwaitingApproval,
	onApprove,
	onReject,
}: CommandExecutionProps) => {
	const {
		terminalShellIntegrationDisabled = true, // kilocode_change: default
		allowedCommands = [],
		deniedCommands = [],
		setAllowedCommands,
		setDeniedCommands,
	} = useExtensionState()

	const { command, output: parsedOutput } = useMemo(() => parseCommandAndOutput(text), [text])

	// If we aren't opening the VSCode terminal for this command then we default
	// to expanding the command execution output.
	const [isExpanded, setIsExpanded] = useState(terminalShellIntegrationDisabled)
	const [streamingOutput, setStreamingOutput] = useState("")
	const [status, setStatus] = useState<CommandExecutionStatus | null>(null)

	// The command's output can either come from the text associated with the
	// task message (this is the case for completed commands) or from the
	// streaming output (this is the case for running commands).
	const output = streamingOutput || parsedOutput

	// Extract command patterns from the actual command that was executed
	const commandPatterns = useMemo<CommandPattern[]>(() => {
		// First get all individual commands (including subshell commands) using parseCommand
		const allCommands = parseCommand(command)

		// Then extract patterns from each command using the existing pattern extraction logic
		const allPatterns = new Set<string>()

		// Add all individual commands first
		allCommands.forEach((cmd) => {
			if (cmd.trim()) {
				allPatterns.add(cmd.trim())
			}
		})

		// Then add extracted patterns for each command
		allCommands.forEach((cmd) => {
			const patterns = extractPatternsFromCommand(cmd)
			patterns.forEach((pattern) => allPatterns.add(pattern))
		})

		return Array.from(allPatterns).map((pattern) => ({
			pattern,
		}))
	}, [command])

	// Handle pattern changes
	const handleAllowPatternChange = (pattern: string) => {
		const isAllowed = allowedCommands.includes(pattern)
		const newAllowed = isAllowed ? allowedCommands.filter((p) => p !== pattern) : [...allowedCommands, pattern]
		const newDenied = deniedCommands.filter((p) => p !== pattern)

		setAllowedCommands(newAllowed)
		setDeniedCommands(newDenied)
		vscode.postMessage({ type: "allowedCommands", commands: newAllowed })
		vscode.postMessage({ type: "deniedCommands", commands: newDenied })
	}

	const handleDenyPatternChange = (pattern: string) => {
		const isDenied = deniedCommands.includes(pattern)
		const newDenied = isDenied ? deniedCommands.filter((p) => p !== pattern) : [...deniedCommands, pattern]
		const newAllowed = allowedCommands.filter((p) => p !== pattern)

		setAllowedCommands(newAllowed)
		setDeniedCommands(newDenied)
		vscode.postMessage({ type: "allowedCommands", commands: newAllowed })
		vscode.postMessage({ type: "deniedCommands", commands: newDenied })
	}

	const onMessage = useCallback(
		(event: MessageEvent) => {
			const message: ExtensionMessage = event.data

			if (message.type === "commandExecutionStatus") {
				const result = commandExecutionStatusSchema.safeParse(safeJsonParse(message.text, {}))

				if (result.success) {
					const data = result.data

					if (data.executionId !== executionId) {
						return
					}

					switch (data.status) {
						case "started":
							setStatus(data)
							break
						case "output":
							setStreamingOutput(data.output)
							break
						case "fallback":
							setIsExpanded(true)
							break
						default:
							setStatus(data)
							break
					}
				}
			}
		},
		[executionId],
	)

	useEvent("message", onMessage)

	return (
		<div className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg overflow-hidden">
			{/* Compact header with command info, status and controls */}
			<div className="flex items-center justify-between px-2 py-1.5 bg-[#2d2d30] border-b border-[#3c3c3c]">
				<div className="flex items-center gap-1.5 min-w-0 flex-1">
					{icon && <div className="flex-shrink-0">{icon}</div>}
					{title && <span className="text-xs font-medium text-[#cccccc] truncate">{title}</span>}
				</div>
				<div className="flex items-center gap-1 flex-shrink-0">
					{isAwaitingApproval && onApprove && onReject && (
						<div className="flex items-center gap-1">
							<button
								onClick={onApprove}
								className="relative inline-flex items-center justify-center bg-[#2d2d30] hover:bg-[#3c3c3c] border border-[#3c3c3c] rounded-full px-2 py-0.5 h-5 text-[#cccccc] hover:text-white opacity-90 hover:opacity-100 transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#4a4a4a] active:scale-95 cursor-pointer">
								<Play className="h-2.5 w-2.5 mr-1" />
								<span className="text-[10px] font-medium">Запустить</span>
							</button>
							<button
								onClick={onReject}
								className="text-[10px] text-[#cccccc] hover:text-white opacity-70 hover:opacity-100 transition-all duration-150 cursor-pointer px-1">
								Отклонить
							</button>
						</div>
					)}
					{status?.status === "started" && (
						<div className="flex items-center gap-1 font-mono text-[10px] text-[#cccccc]">
							<div className="rounded-full size-1 bg-lime-400 animate-pulse" />
							<span>Running</span>
							{status.pid && <span className="text-[#888888]">(PID: {status.pid})</span>}
							<Button
								variant="ghost"
								size="sm"
								className="h-4 w-4 p-0 hover:bg-red-500/20 hover:text-red-400"
								onClick={() =>
									vscode.postMessage({ type: "terminalOperation", terminalOperation: "abort" })
								}>
								<Skull className="h-2.5 w-2.5" />
							</Button>
						</div>
					)}
					{status?.status === "exited" && (
						<div className="flex items-center gap-1 font-mono text-[10px]">
							<div
								className={cn(
									"rounded-full size-1",
									status.exitCode === 0 ? "bg-lime-400" : "bg-red-400",
								)}
							/>
							<span className={status.exitCode === 0 ? "text-lime-400" : "text-red-400"}>
								Exited ({status.exitCode})
							</span>
						</div>
					)}
					{output.length > 0 && (
						<Button
							variant="ghost"
							size="sm"
							className="h-4 w-4 p-0 hover:bg-[#3c3c3c]"
							onClick={() => setIsExpanded(!isExpanded)}>
							<ChevronDown
								className={cn("h-2.5 w-2.5 transition-transform duration-200", {
									"rotate-180": isExpanded,
								})}
							/>
						</Button>
					)}
					{/* Three dots menu button */}
					{command && command.trim() && (
						<CommandPatternSelector
							patterns={commandPatterns}
							allowedCommands={allowedCommands}
							deniedCommands={deniedCommands}
							onAllowPatternChange={handleAllowPatternChange}
							onDenyPatternChange={handleDenyPatternChange}
						/>
					)}
				</div>
			</div>

			{/* Compact command content */}
			<div className="px-2 py-1.5">
				<CodeBlock source={command} language="shell" />
				<OutputContainer isExpanded={isExpanded} output={output} />
			</div>
		</div>
	)
}

CommandExecution.displayName = "CommandExecution"

const OutputContainerInternal = ({ isExpanded, output }: { isExpanded: boolean; output: string }) => (
	<div
		className={cn("overflow-hidden", {
			"max-h-0": !isExpanded,
			"max-h-[100%] mt-1 pt-1 border-t border-border/25": isExpanded,
		})}>
		{output.length > 0 && <CodeBlock source={output} language="log" />}
	</div>
)

const OutputContainer = memo(OutputContainerInternal)

const parseCommandAndOutput = (text: string | undefined) => {
	if (!text) {
		return { command: "", output: "" }
	}

	const index = text.indexOf(COMMAND_OUTPUT_STRING)

	if (index === -1) {
		return { command: text, output: "" }
	}

	return {
		command: text.slice(0, index),
		output: text.slice(index + COMMAND_OUTPUT_STRING.length),
	}
}
