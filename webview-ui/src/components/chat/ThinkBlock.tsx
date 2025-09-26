import React, { useState } from "react"
import { cn } from "@/lib/utils"
import MarkdownBlock from "../common/MarkdownBlock"

interface ThinkBlockProps {
	content: string
	isStreaming?: boolean
}

export const ThinkBlock: React.FC<ThinkBlockProps> = ({ content, isStreaming = false }) => {
	const [isExpanded, setIsExpanded] = useState(false)

	const toggleExpanded = () => {
		setIsExpanded(!isExpanded)
	}

	return (
		<div className="mb-4">
			<div
				className={cn(
					"flex items-center gap-2 p-3 rounded-t-lg cursor-pointer transition-colors",
					"bg-vscode-badge-background hover:bg-vscode-list-hoverBackground",
					"border border-vscode-border",
				)}
				onClick={toggleExpanded}>
				<div className="flex items-center gap-2 flex-1">
					<span className="text-vscode-badge-foreground font-medium">Размышления</span>
					{isStreaming && (
						<div className="flex gap-1">
							<div className="w-1 h-1 bg-vscode-badge-foreground rounded-full animate-pulse"></div>
							<div className="w-1 h-1 bg-vscode-badge-foreground rounded-full animate-pulse delay-100"></div>
							<div className="w-1 h-1 bg-vscode-badge-foreground rounded-full animate-pulse delay-200"></div>
						</div>
					)}
				</div>
				<span
					className={cn(
						"codicon transition-transform",
						isExpanded ? "codicon-chevron-up" : "codicon-chevron-down",
					)}
					style={{ color: "var(--vscode-badge-foreground)" }}
				/>
			</div>

			{isExpanded && content?.trim()?.length > 0 && (
				<div
					className={cn(
						"p-4 rounded-b-lg border-l border-r border-b border-vscode-border",
						"bg-vscode-editor-background",
					)}>
					<MarkdownBlock markdown={content} />
				</div>
			)}
		</div>
	)
}

export default ThinkBlock
