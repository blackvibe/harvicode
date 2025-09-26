import { ClineMessage } from "@roo-code/types"
import { Mention } from "../../chat/Mention"
// import { Button } from "@src/components/ui"
import Thumbnails from "../../common/Thumbnails"
import { vscode } from "@src/utils/vscode"
import { useState, useRef, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"

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
	const { t: _t } = useTranslation()
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
			<div ref={containerRef} className="border border-[#3c3c3c] rounded-xl bg-[#1e1e1e] p-2">
				<textarea
					ref={textareaRef}
					className="w-full min-h-[45px] p-2 border-0 bg-transparent text-vscode-input-foreground resize-none outline-none focus:outline-none font-vscode-font-family text-vscode-editor-font-size leading-vscode-editor-line-height"
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
					placeholder="Редактировать сообщение..."
				/>
			</div>
		)
	}

	return (
		<div
			className="bg-[#1a1a1a] border border-[#3c3c3c] rounded-xl p-3 overflow-hidden whitespace-pre-wrap cursor-pointer hover:bg-[#252526]"
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
