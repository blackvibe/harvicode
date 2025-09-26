import React from "react"
import { Mode, defaultModeSlug, getAllModes } from "@roo/modes"
import { ModeConfig } from "@roo-code/types"
import { SelectDropdown, DropdownOptionType } from "@/components/ui"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { vscode } from "@/utils/vscode"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface KiloModeSelectorProps {
	value: Mode
	onChange: (value: Mode) => void
	modeShortcutText: string
	customModes?: ModeConfig[]
	disabled?: boolean
	title?: string
	triggerClassName?: string
	initiallyOpen?: boolean
}

export const KiloModeSelector = ({
	value,
	onChange,
	modeShortcutText,
	customModes,
	disabled = false,
	title,
	triggerClassName,
	initiallyOpen,
}: KiloModeSelectorProps) => {
	const { t } = useAppTranslation()
	const allModes = React.useMemo(() => getAllModes(customModes), [customModes])
	const currentModeSlug = allModes.find((m) => m.slug === value)?.slug ?? defaultModeSlug

	const handleChange = React.useCallback(
		(selectedValue: string) => {
			const newMode = selectedValue as Mode
			onChange(newMode)
			vscode.postMessage({ type: "mode", text: selectedValue })
		},
		[onChange],
	)

	return (
		<SelectDropdown
			value={currentModeSlug}
			title={title || t("chat:selectMode")}
			disabled={disabled}
			initiallyOpen={initiallyOpen}
			searchPlaceholder="Поиск режимов..."
			disableSearch={false}
			options={[
				{
					value: "shortcut",
					label: modeShortcutText,
					disabled: true,
					type: DropdownOptionType.SHORTCUT,
				},
				...allModes.map((mode) => ({
					value: mode.slug,
					label: t(`modes:${mode.slug}.name`, { defaultValue: mode.name }),
					codicon: mode.iconName,
					description: t(`modes:${mode.slug}.description`, { defaultValue: mode.description }), // kilocode_change
					type: DropdownOptionType.ITEM,
				})),
				// Edit button commented out for Harvi Code
				// {
				// 	value: "sep-1",
				// 	label: t("chat:separator"),
				// 	type: DropdownOptionType.SEPARATOR,
				// },
				// {
				// 	value: "promptsButtonClicked",
				// 	label: t("chat:edit"),
				// 	type: DropdownOptionType.ACTION,
				// },
			]}
			onChange={handleChange}
			shortcutText={modeShortcutText}
			contentClassName="max-h-[200px] overflow-y-auto min-w-32 rounded-lg bg-[#1e1e1e] border border-[#3c3c3c] shadow-lg"
			triggerClassName={cn("text-ellipsis overflow-hidden min-w-0", triggerClassName)}
			renderItem={({ type, value, label, codicon, description }) => {
				if (type === DropdownOptionType.SHORTCUT) {
					return <div className="py-1 px-2 text-xs text-[#888888] font-mono">{label}</div>
				}
				if (type === DropdownOptionType.SEPARATOR) {
					return <div className="py-1 px-2 text-xs text-[#888888]">{label}</div>
				}
				if (type === DropdownOptionType.ACTION) {
					return (
						<div className="py-1.5 px-2 text-xs text-[#cccccc] hover:bg-[#3c3c3c] rounded-md cursor-pointer transition-all duration-150">
							{label}
						</div>
					)
				}

				const isSelected = value === currentModeSlug

				return (
					<div
						className={cn(
							"flex items-center gap-2 w-full py-1.5 px-2 text-xs cursor-pointer",
							"hover:bg-[#2d2d30] rounded-md transition-all duration-150",
							isSelected && "text-white",
						)}>
						{codicon && <span className={cn("codicon", `codicon-${codicon}`, "text-xs flex-shrink-0")} />}
						<div className="flex-1 min-w-0">
							<div
								className={cn("truncate font-medium text-[#cccccc]", {
									"text-white": isSelected,
								})}>
								{label}
							</div>
							{description && (
								<div
									className={cn("text-xs text-[#888888] truncate", {
										"text-white/70": isSelected,
									})}>
									{description}
								</div>
							)}
						</div>
						{isSelected && (
							<div className="flex items-center justify-center w-3 h-3 rounded-full bg-white/20 flex-shrink-0">
								<Check className="w-2 h-2 text-white" />
							</div>
						)}
					</div>
				)
			}}
		/>
	)
}

export default KiloModeSelector
