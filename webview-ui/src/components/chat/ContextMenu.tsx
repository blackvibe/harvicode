import React, { useEffect, useMemo, useRef, useState } from "react"
import { getIconForFilePath, getIconUrlByName } from "vscode-material-icons"
import { Folder, Terminal, AlertTriangle, GitCommit, FileText, Link, Info, Settings, Play, Camera } from "lucide-react"

import type { ModeConfig } from "@roo-code/types"
import type { Command } from "@roo/ExtensionMessage"

import {
	ContextMenuOptionType,
	ContextMenuQueryItem,
	getContextMenuOptions,
	SearchResult,
} from "@src/utils/context-mentions"
import { removeLeadingNonAlphanumeric } from "@src/utils/removeLeadingNonAlphanumeric"
import { useAppTranslation } from "@/i18n/TranslationContext"

interface ContextMenuProps {
	onSelect: (type: ContextMenuOptionType, value?: string) => void
	searchQuery: string
	inputValue: string
	onMouseDown: () => void
	selectedIndex: number
	setSelectedIndex: (index: number) => void
	selectedType: ContextMenuOptionType | null
	queryItems: ContextMenuQueryItem[]
	modes?: ModeConfig[]
	loading?: boolean
	dynamicSearchResults?: SearchResult[]
	commands?: Command[]
}

const ContextMenu: React.FC<ContextMenuProps> = ({
	onSelect,
	searchQuery,
	onMouseDown,
	selectedIndex,
	setSelectedIndex,
	selectedType,
	queryItems,
	modes,
	dynamicSearchResults = [],
	commands = [],
}) => {
	const { t } = useAppTranslation()
	const [materialIconsBaseUri, setMaterialIconsBaseUri] = useState("")
	const menuRef = useRef<HTMLDivElement>(null)

	const filteredOptions = useMemo(() => {
		return getContextMenuOptions(searchQuery, selectedType, queryItems, dynamicSearchResults, modes, commands)
	}, [searchQuery, selectedType, queryItems, dynamicSearchResults, modes, commands])

	useEffect(() => {
		if (menuRef.current) {
			const selectedElement = menuRef.current.children[selectedIndex] as HTMLElement
			if (selectedElement) {
				const menuRect = menuRef.current.getBoundingClientRect()
				const selectedRect = selectedElement.getBoundingClientRect()

				if (selectedRect.bottom > menuRect.bottom) {
					menuRef.current.scrollTop += selectedRect.bottom - menuRect.bottom
				} else if (selectedRect.top < menuRect.top) {
					menuRef.current.scrollTop -= menuRect.top - selectedRect.top
				}
			}
		}
	}, [selectedIndex])

	// get the icons base uri on mount
	useEffect(() => {
		const w = window as any
		setMaterialIconsBaseUri(w.MATERIAL_ICONS_BASE_URI)
	}, [])

	const renderOptionContent = (option: ContextMenuQueryItem) => {
		switch (option.type) {
			case ContextMenuOptionType.SectionHeader:
				return <span className="font-bold text-xs opacity-80 uppercase tracking-wider">{option.label}</span>
			case ContextMenuOptionType.Mode:
				return (
					<div className="flex flex-col gap-0.5">
						<div className="leading-tight">
							<span className="font-medium">{option.slashCommand}</span>
						</div>
						{option.description && (
							<span className="opacity-70 text-xs leading-tight whitespace-nowrap overflow-hidden text-ellipsis text-vscode-descriptionForeground">
								{option.description}
							</span>
						)}
					</div>
				)
			case ContextMenuOptionType.Command:
				return (
					<div className="flex flex-col gap-0.5">
						<div className="leading-tight flex items-center gap-1.5">
							<span className="font-medium">{option.slashCommand}</span>
							{option.argumentHint && (
								<span className="opacity-70 text-xs leading-tight text-vscode-descriptionForeground">
									{option.argumentHint}
								</span>
							)}
						</div>
						{option.description && (
							<span className="opacity-70 text-xs leading-tight whitespace-nowrap overflow-hidden text-ellipsis text-vscode-descriptionForeground">
								{option.description}
							</span>
						)}
					</div>
				)
			case ContextMenuOptionType.Problems:
				return <span>{t("context:problems")}</span>
			case ContextMenuOptionType.Terminal:
				return <span>{t("context:terminal")}</span>
			case ContextMenuOptionType.URL:
				return <span>{t("context:pasteUrl")}</span>
			case ContextMenuOptionType.NoResults:
				return <span>{t("context:noResults")}</span>
			// kilocode_change start
			case ContextMenuOptionType.Image:
				return <span>{t("context:addImage")}</span>
			// kilocode_change end
			case ContextMenuOptionType.Git:
				if (option.value) {
					return (
						<div className="flex flex-col">
							<span className="leading-tight font-medium">{option.label}</span>
							<span className="text-xs opacity-70 whitespace-nowrap overflow-hidden text-ellipsis leading-tight text-vscode-descriptionForeground">
								{option.description}
							</span>
						</div>
					)
				} else {
					return <span>{t("context:gitCommits")}</span>
				}
			case ContextMenuOptionType.File:
			case ContextMenuOptionType.OpenedFile:
			case ContextMenuOptionType.Folder:
				if (option.value) {
					// remove trailing slash
					const path = removeLeadingNonAlphanumeric(option.value || "").replace(/\/$/, "")
					const pathList = path.split("/")
					const filename = pathList.at(-1)
					const folderPath = pathList.slice(0, -1).join("/")
					return (
						<div className="flex-1 overflow-hidden flex gap-2 whitespace-nowrap items-center justify-between text-left">
							<span className="font-medium">{filename}</span>
							<span
								className="whitespace-nowrap overflow-hidden text-ellipsis text-right flex-1 opacity-75 text-xs text-vscode-descriptionForeground"
								style={{ direction: "rtl" }}>
								{folderPath}
							</span>
						</div>
					)
				} else {
					return (
						<span>
							{option.type === ContextMenuOptionType.File ? t("context:addFile") : t("context:addFolder")}
						</span>
					)
				}
		}
	}

	const getMaterialIconForOption = (option: ContextMenuQueryItem): string => {
		if (option.type === ContextMenuOptionType.File) {
			const name = option.value?.split("/").filter(Boolean).at(-1) ?? ""
			const iconName = getIconForFilePath(name)
			return getIconUrlByName(iconName, materialIconsBaseUri)
		}
		return ""
	}

	const isOptionSelectable = (option: ContextMenuQueryItem): boolean => {
		return (
			option.type !== ContextMenuOptionType.NoResults &&
			option.type !== ContextMenuOptionType.URL &&
			option.type !== ContextMenuOptionType.SectionHeader
		)
	}

	return (
		<div
			className="absolute bottom-[calc(100%-10px)] left-[15px] right-[15px] overflow-x-hidden"
			onMouseDown={onMouseDown}>
			<div
				ref={menuRef}
				className="p-0 overflow-hidden min-w-60 max-w-80 rounded-lg shadow-lg z-[1000] flex flex-col max-h-[300px] overflow-y-auto overflow-x-hidden bg-vscode-dropdown-background border border-vscode-dropdown-border">
				<div className="py-1">
					{filteredOptions && filteredOptions.length > 0 ? (
						filteredOptions.map((option, index) => (
							<div
								key={`${option.type}-${option.value || index}`}
								onClick={() => isOptionSelectable(option) && onSelect(option.type, option.value)}
								className={`
									${
										option.type === ContextMenuOptionType.SectionHeader
											? "px-2 py-0.5 border-b border-vscode-dropdown-border mb-0.5"
											: "px-2 py-1"
									}
									${isOptionSelectable(option) ? "cursor-pointer" : "cursor-default"}
									text-vscode-dropdown-foreground flex items-center justify-between relative text-xs
									${option.type !== ContextMenuOptionType.SectionHeader ? "hover:bg-[rgba(255,255,255,0.05)]" : ""}
									${index === selectedIndex && isOptionSelectable(option) ? "bg-[rgba(255,255,255,0.05)]" : ""}
								`}
								onMouseEnter={() => isOptionSelectable(option) && setSelectedIndex(index)}>
								<div className="flex items-center flex-1 min-w-0 overflow-hidden pt-0 relative">
									{/* Material icon только для конкретных файлов (с option.value) */}
									{option.type === ContextMenuOptionType.File && option.value && (
										<img
											src={getMaterialIconForOption(option)}
											alt="File"
											className="mr-1.5 flex-shrink-0 w-3 h-3"
										/>
									)}
									{/* Lucide иконки для главных пунктов и остального */}
									{option.type === ContextMenuOptionType.File && !option.value && (
										<FileText className="mr-1.5 flex-shrink-0 w-3 h-3" />
									)}
									{option.type === ContextMenuOptionType.Folder && (
										<Folder className="mr-1.5 flex-shrink-0 w-3 h-3" />
									)}
									{option.type === ContextMenuOptionType.OpenedFile && (
										<FileText className="mr-1.5 flex-shrink-0 w-3 h-3" />
									)}
									{option.type === ContextMenuOptionType.Problems && (
										<AlertTriangle className="mr-1.5 flex-shrink-0 w-3 h-3" />
									)}
									{option.type === ContextMenuOptionType.Terminal && (
										<Terminal className="mr-1.5 flex-shrink-0 w-3 h-3" />
									)}
									{option.type === ContextMenuOptionType.Git && (
										<GitCommit className="mr-1.5 flex-shrink-0 w-3 h-3" />
									)}
									{option.type === ContextMenuOptionType.URL && (
										<Link className="mr-1.5 flex-shrink-0 w-3 h-3" />
									)}
									{option.type === ContextMenuOptionType.NoResults && (
										<Info className="mr-1.5 flex-shrink-0 w-3 h-3" />
									)}
									{option.type === ContextMenuOptionType.Mode && (
										<Settings className="mr-1.5 flex-shrink-0 w-3 h-3" />
									)}
									{option.type === ContextMenuOptionType.Command && (
										<Play className="mr-1.5 flex-shrink-0 w-3 h-3" />
									)}
									{option.type === ContextMenuOptionType.Image && (
										<Camera className="mr-1.5 flex-shrink-0 w-3 h-3" />
									)}
									{renderOptionContent(option)}
								</div>
								{(option.type === ContextMenuOptionType.File ||
									option.type === ContextMenuOptionType.Folder ||
									option.type === ContextMenuOptionType.Git) &&
									!option.value && (
										<i className="codicon codicon-chevron-right text-[10px] flex-shrink-0 ml-2" />
									)}
							</div>
						))
					) : (
						<div className="py-1 px-3 flex items-center justify-center text-vscode-foreground opacity-70 text-sm">
							<span>{t("context:noResults")}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default ContextMenu
