import { memo, useMemo, useState, useEffect, useRef } from "react"
import { VSCodeProgressRing } from "@vscode/webview-ui-toolkit/react"
import { type ToolProgressStatus } from "@roo-code/types"
import { getLanguageFromPath } from "@src/utils/getLanguageFromPath"
import { removeLeadingNonAlphanumeric } from "@src/utils/removeLeadingNonAlphanumeric"
import { getIconForFilePath, getIconUrlByName } from "vscode-material-icons"
import { Copy, GitCompare, Check } from "lucide-react"
import { useCopyToClipboard } from "@src/utils/clipboard"
import { StandardTooltip } from "@/components/ui"
import { useAppTranslation } from "@/i18n/TranslationContext"

import { ToolUseBlock, ToolUseBlockHeader } from "./ToolUseBlock"
import CodeBlock from "../kilocode/common/CodeBlock" // kilocode_change

interface CodeAccordianProps {
	path?: string
	code?: string
	language: string
	progressStatus?: ToolProgressStatus
	isLoading?: boolean
	isExpanded: boolean
	isFeedback?: boolean
	onToggleExpand: () => void
	header?: string
	onJumpToFile?: () => void
}

// Функция для получения иконки файла с использованием VSCode Material Icons
const getFileIcon = (path: string, materialIconsBaseUri: string) => {
	if (!path) {
		return <span className="codicon codicon-file w-4 h-4 flex items-center justify-center" />
	}

	const iconName = getIconForFilePath(path)
	const iconUrl = getIconUrlByName(iconName, materialIconsBaseUri)

	return <img src={iconUrl} alt="File icon" className="w-4 h-4" style={{ flexShrink: 0 }} />
}

const CodeAccordian = ({
	path,
	code = "",
	language,
	progressStatus,
	isLoading,
	isExpanded: _isExpanded,
	isFeedback,
	onToggleExpand,
	header,
	onJumpToFile: _onJumpToFile,
}: CodeAccordianProps) => {
	const { t } = useAppTranslation()
	const [materialIconsBaseUri, setMaterialIconsBaseUri] = useState("")
	const [showCopySuccess, setShowCopySuccess] = useState(false)
	const inferredLanguage = useMemo(() => language ?? (path ? getLanguageFromPath(path) : "txt"), [path, language])
	const source = useMemo(() => code.trim(), [code])
	const hasHeader = Boolean(path || isFeedback || header)
	const { copyWithFeedback } = useCopyToClipboard()

	// Определяем финальный язык с учетом автоопределения diff-git
	const finalLanguage = useMemo(() => {
		if (source && source.includes("<<<<<<< SEARCH")) {
			return "diff-git"
		}
		return inferredLanguage
	}, [source, inferredLanguage])

	// Получаем базовый URI для material icons при монтировании компонента
	useEffect(() => {
		const w = window as any
		setMaterialIconsBaseUri(w.MATERIAL_ICONS_BASE_URI)
	}, [])

	const handleCopy = async (e: React.MouseEvent) => {
		e.stopPropagation()
		if (source) {
			const success = await copyWithFeedback(source)
			if (success) {
				setShowCopySuccess(true)
				setTimeout(() => setShowCopySuccess(false), 1500)
			}
		}
	}

	return (
		<ToolUseBlock>
			{hasHeader && (
				<ToolUseBlockHeader onClick={onToggleExpand} className="px-1 py-0.5">
					{isLoading && <VSCodeProgressRing className="size-3 mr-2" />}
					{header ? (
						<div className="flex items-center">
							<span className="codicon codicon-server mr-1.5"></span>
							<span className="whitespace-nowrap overflow-hidden text-ellipsis mr-2">{header}</span>
						</div>
					) : isFeedback ? (
						<div className="flex items-center">
							<span className={`codicon codicon-${isFeedback ? "feedback" : "codicon-output"} mr-1.5`} />
							<span className="whitespace-nowrap overflow-hidden text-ellipsis mr-2 rtl">
								{isFeedback ? "User Edits" : "Console Logs"}
							</span>
						</div>
					) : (
						<div className="flex items-center">
							{path && getFileIcon(path, materialIconsBaseUri)}
							<span className="ml-2 whitespace-nowrap overflow-hidden text-ellipsis text-left rtl">
								{path?.startsWith(".") && <span>.</span>}
								{removeLeadingNonAlphanumeric(path ?? "") + "\u200E"}
							</span>
							{/* Бейдж с типом файла */}
							<span
								className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-neutral-800 text-neutral-400 rounded-full border border-neutral-700 opacity-50 hover:opacity-75 transition-opacity"
								style={{ fontSize: "10px" }}>
								{finalLanguage}
							</span>
						</div>
					)}
					<div className="flex-grow-1" />
					{progressStatus && progressStatus.text && (
						<>
							<GitCompare className="w-3 h-3 mr-1" />
							<span className="mr-1 ml-auto text-vscode-descriptionForeground">
								{progressStatus.text}
							</span>
						</>
					)}
					<StandardTooltip content={t("chat:codeblock.tooltips.copy_code")}>
						<button
							onClick={handleCopy}
							className="relative inline-flex items-center justify-center bg-[#2d2d30] hover:bg-[#3c3c3c] border border-[#3c3c3c] rounded-full w-6 h-6 text-[#cccccc] hover:text-white transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#4a4a4a] active:scale-95 cursor-pointer ml-1">
							{showCopySuccess ? (
								<Check className="w-3 h-3 text-green-400" />
							) : (
								<Copy className="w-3 h-3" />
							)}
						</button>
					</StandardTooltip>
				</ToolUseBlockHeader>
			)}
			<ScrollableCodeContainer source={source} language={finalLanguage} />
		</ToolUseBlock>
	)
}

// Компонент для скроллируемого контейнера с тенями
const ScrollableCodeContainer = memo(({ source, language }: { source: string; language: string }) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const [showTopShadow, setShowTopShadow] = useState(false)
	const [showBottomShadow, setShowBottomShadow] = useState(false)

	const handleScroll = () => {
		if (!containerRef.current) return

		const { scrollTop, scrollHeight, clientHeight } = containerRef.current
		setShowTopShadow(scrollTop > 0)
		setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 1)
	}

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		// Проверяем начальное состояние
		handleScroll()

		container.addEventListener("scroll", handleScroll)
		return () => container.removeEventListener("scroll", handleScroll)
	}, [source])

	return (
		<div className="relative overflow-hidden h-[150px]">
			{/* Верхняя тень */}
			{showTopShadow && (
				<div
					className="absolute top-0 left-0 right-0 h-6 pointer-events-none z-10"
					style={{
						background: "linear-gradient(to bottom, var(--vscode-editor-background) 0%, transparent 100%)",
					}}
				/>
			)}
			{/* Нижняя тень */}
			{showBottomShadow && (
				<div
					className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none z-10"
					style={{
						background: "linear-gradient(to top, var(--vscode-editor-background) 0%, transparent 100%)",
					}}
				/>
			)}
			<div
				ref={containerRef}
				className="overflow-x-auto overflow-y-auto h-full max-w-full px-0 scroll-smooth code-block-scrollable">
				<CodeBlock
					source={source}
					language={language}
					preStyle={{
						overflowY: "visible", // Убираем внутренний скроллбар
						maxHeight: "none", // Убираем ограничение высоты
					}}
				/>
			</div>
		</div>
	)
})

export default memo(CodeAccordian)
