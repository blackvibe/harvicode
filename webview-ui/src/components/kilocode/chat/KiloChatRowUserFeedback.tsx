import { ClineMessage } from "@roo-code/types"
import { Mention } from "../../chat/Mention"
// import { Button } from "@src/components/ui"
import Thumbnails from "../../common/Thumbnails"
import { vscode } from "@src/utils/vscode"
import { useState, useRef, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { ArrowUp } from "lucide-react"

interface KiloChatRowUserFeedbackProps {
	message: ClineMessage
	isStreaming: boolean
	onChatReset?: () => void
}

export const KiloChatRowUserFeedback = ({
	message,
	isStreaming,
	onChatReset: _onChatReset,
}: KiloChatRowUserFeedbackProps) => {
	const { t } = useTranslation()
	const [isEditing, setIsEditing] = useState(false)
	const [editedText, setEditedText] = useState(message.text)
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	const handleCancel = useCallback(() => {
		setEditedText(message.text)
		setIsEditing(false)
	}, [message.text])

	const handleRevertAndResend = () => {
		vscode.postMessage({ type: "editMessage", values: { ts: message.ts, text: editedText, revert: true } })
		setIsEditing(false)
		// Убираем вызов onChatReset чтобы избежать перезагрузки чата
	}

	// Handle click outside to cancel editing
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (isEditing && containerRef.current && !containerRef.current.contains(event.target as Node)) {
				handleCancel()
			}
		}

		if (isEditing) {
			document.addEventListener("mousedown", handleClickOutside)
			// Focus the textarea when editing starts
			setTimeout(() => {
				textareaRef.current?.focus()
			}, 0)
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [isEditing, handleCancel])

	if (isEditing) {
		return (
			<div
				ref={containerRef}
				className="border border-[#3c3c3c] focus-within:border-[#4a4a4a] rounded-xl bg-[#1e1e1e] p-2 transition-colors">
				<textarea
					ref={textareaRef}
					className="w-full min-h-[45px] p-2 border-0 bg-transparent text-vscode-input-foreground resize-none font-vscode-font-family text-vscode-editor-font-size leading-vscode-editor-line-height"
					style={{
						outline: "none !important",
						border: "none !important",
						boxShadow: "none !important",
						WebkitAppearance: "none",
						MozAppearance: "none",
					}}
					value={editedText}
					onChange={(e) => setEditedText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
							e.preventDefault()
							handleRevertAndResend()
						}
						if (e.key === "Escape") {
							e.preventDefault()
							handleCancel()
						}
					}}
					placeholder={t("chat:editMessage.placeholder")}
				/>
				<div className="flex items-center justify-between mt-2 pt-2 border-t border-[#3c3c3c]">
					<div className="flex items-center text-xs text-vscode-descriptionForeground opacity-70 flex-1 mr-2">
						<span className="codicon codicon-warning mr-2"></span>
						<span>{t("chat:editMessage.restoreWarning")}</span>
					</div>
					<button
						onClick={handleRevertAndResend}
						className="relative inline-flex items-center justify-center bg-[#2d2d30] hover:bg-[#3c3c3c] border border-[#3c3c3c] rounded-full w-6 h-6 text-[#cccccc] hover:text-white opacity-90 hover:opacity-100 transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#4a4a4a] active:scale-95 cursor-pointer flex-shrink-0">
						<ArrowUp className="w-4 h-4 opacity-80" />
					</button>
				</div>
			</div>
		)
	}

	return (
		<div
			className="bg-[#1a1a1a] border border-[#3c3c3c] rounded-xl px-3 py-2 overflow-hidden whitespace-pre-wrap cursor-pointer hover:bg-[#252526]"
			onClick={() => !isStreaming && setIsEditing(true)}>
			<div className="wrap-anywhere">
				<Mention text={message.text} withShadow />
			</div>
			{/* Кнопки редактировать/удалить закомментированы */}
			{/* <div className="flex">
				<Button
					variant="ghost"
					size="icon"
					className="shrink-0"
					disabled={isStreaming}
					onClick={(e) => {
						e.stopPropagation()
						setIsEditing(true)
					}}>
					<span className="codicon codicon-edit" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="shrink-0"
					disabled={isStreaming}
					onClick={(e) => {
						e.stopPropagation()
						vscode.postMessage({ type: "deleteMessage", value: message.ts })
					}}>
					<span className="codicon codicon-trash" />
				</Button>
			</div> */}
			{message.images && message.images.length > 0 && (
				<Thumbnails images={message.images} style={{ marginTop: "8px" }} />
			)}
		</div>
	)
}
