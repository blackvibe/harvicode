import React from "react"
import { X, Folder, Terminal, AlertTriangle, GitCommit, FileText } from "lucide-react"
import { getIconForFilePath, getIconUrlByName } from "vscode-material-icons"

import { ContextMenuOptionType } from "@src/utils/context-mentions"
import { cn } from "@/lib/utils"
import { useAppTranslation } from "@/i18n/TranslationContext"

export interface SelectedContext {
	id: string
	type: ContextMenuOptionType
	value: string
	displayName: string
}

interface SelectedContextsProps {
	contexts: SelectedContext[]
	onRemove: (contextId: string) => void
	materialIconsBaseUri?: string
}

export const SelectedContexts: React.FC<SelectedContextsProps> = ({
	contexts,
	onRemove,
	materialIconsBaseUri = "",
}) => {
	const { t } = useAppTranslation()

	if (contexts.length === 0) {
		return null
	}

	const getMaterialIcon = (context: SelectedContext): string | null => {
		// Используем material icons только для файлов
		if (context.type === ContextMenuOptionType.File || context.type === ContextMenuOptionType.OpenedFile) {
			const name = context.value?.split("/").filter(Boolean).at(-1) ?? ""
			const iconName = getIconForFilePath(name)
			return getIconUrlByName(iconName, materialIconsBaseUri)
		}
		return null
	}

	const getLucideIcon = (context: SelectedContext) => {
		switch (context.type) {
			case ContextMenuOptionType.Folder:
				return Folder
			case ContextMenuOptionType.Problems:
				return AlertTriangle
			case ContextMenuOptionType.Terminal:
				return Terminal
			case ContextMenuOptionType.Git:
				return GitCommit
			case ContextMenuOptionType.OpenedFile:
				return FileText
			default:
				return FileText
		}
	}

	const formatDisplayName = (context: SelectedContext): string => {
		if (context.type === ContextMenuOptionType.File || context.type === ContextMenuOptionType.Folder) {
			// Для файлов и папок показываем только имя файла/папки
			const parts = context.value.split("/").filter(Boolean)
			return parts[parts.length - 1] || context.displayName
		}
		return context.displayName
	}

	return (
		<div className="flex flex-wrap gap-1">
			{contexts.map((context) => {
				const displayName = formatDisplayName(context)

				return (
					<div
						key={context.id}
						className={cn(
							"group inline-flex items-center gap-1.5 px-1.5 py-0.5 h-5",
							"bg-[#2d2d30] border border-[#3c3c3c] rounded-full",
							"text-[#cccccc] text-[10px]",
							"hover:bg-[#3c3c3c] hover:border-[#4a4a4a]",
							"transition-all duration-150",
							"max-w-[200px]",
							"select-none",
						)}>
						{/* Единый контейнер для иконки и крестика */}
						<div className="w-3 h-3 flex-shrink-0 flex items-center justify-center relative">
							{/* Material icon для файлов, Lucide для остального */}
							{getMaterialIcon(context) ? (
								<img src={getMaterialIcon(context)!} alt="" className="w-3 h-3 group-hover:hidden" />
							) : (
								React.createElement(getLucideIcon(context), {
									className: "w-3 h-3 group-hover:hidden",
								})
							)}

							{/* Крестик - заменяет иконку при наведении */}
							<button
								onClick={(e) => {
									e.stopPropagation()
									onRemove(context.id)
								}}
								className="absolute inset-0 opacity-70 hidden group-hover:flex items-center justify-center cursor-pointer hover:opacity-100"
								aria-label={t("chat:removeContext")}>
								<X className="w-3 h-3" />
							</button>
						</div>

						{/* Название контекста */}
						<span className="truncate text-[10px] font-medium select-none">{displayName}</span>
					</div>
				)
			})}
		</div>
	)
}
