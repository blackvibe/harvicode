// kilocode_change - new file
import { SelectDropdown, DropdownOptionType, Button, StandardTooltip } from "@/components/ui"
import { vscode } from "@/utils/vscode"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { cn } from "@/lib/utils"
import { Check, Pin } from "lucide-react"

interface ApiConfigMeta {
	id: string
	name: string
}

interface KiloProfileSelectorProps {
	currentConfigId: string
	currentApiConfigName?: string
	displayName: string
	listApiConfigMeta?: ApiConfigMeta[]
	pinnedApiConfigs?: Record<string, boolean>
	togglePinnedApiConfig: (configId: string) => void
	selectApiConfigDisabled?: boolean
	initiallyOpen?: boolean
	triggerClassName?: string
}

export const KiloProfileSelector = ({
	currentConfigId,
	currentApiConfigName,
	displayName,
	listApiConfigMeta,
	pinnedApiConfigs,
	togglePinnedApiConfig,
	selectApiConfigDisabled = false,
	initiallyOpen = false,
	triggerClassName,
}: KiloProfileSelectorProps) => {
	const { t } = useAppTranslation()

	// Hide if there is only one profile
	if ((listApiConfigMeta?.length ?? 0) < 2) {
		return null
	}

	return (
		<SelectDropdown
			value={currentConfigId}
			disabled={selectApiConfigDisabled}
			title={t("chat:selectApiConfig")}
			disableSearch={false}
			placeholder={displayName}
			initiallyOpen={initiallyOpen}
			options={[
				// Pinned items first.
				...(listApiConfigMeta || [])
					.filter((config) => pinnedApiConfigs && pinnedApiConfigs[config.id])
					.map((config) => ({
						value: config.id,
						label: config.name,
						name: config.name, // Keep name for comparison with currentApiConfigName.
						type: DropdownOptionType.ITEM,
						pinned: true,
					}))
					.sort((a, b) => a.label.localeCompare(b.label)),
				// If we have pinned items and unpinned items, add a separator.
				...(pinnedApiConfigs &&
				Object.keys(pinnedApiConfigs).length > 0 &&
				(listApiConfigMeta || []).some((config) => !pinnedApiConfigs[config.id])
					? [
							{
								value: "sep-pinned",
								label: t("chat:separator"),
								type: DropdownOptionType.SEPARATOR,
							},
						]
					: []),
				// Unpinned items sorted alphabetically.
				...(listApiConfigMeta || [])
					.filter((config) => !pinnedApiConfigs || !pinnedApiConfigs[config.id])
					.map((config) => ({
						value: config.id,
						label: config.name,
						name: config.name, // Keep name for comparison with currentApiConfigName.
						type: DropdownOptionType.ITEM,
						pinned: false,
					}))
					.sort((a, b) => a.label.localeCompare(b.label)),
				{
					value: "sep-2",
					label: t("chat:separator"),
					type: DropdownOptionType.SEPARATOR,
				},
				{
					value: "settingsButtonClicked",
					label: t("chat:edit"),
					type: DropdownOptionType.ACTION,
				},
			]}
			onChange={(value) => {
				if (value === "settingsButtonClicked") {
					vscode.postMessage({
						type: "loadApiConfiguration",
						text: value,
						values: { section: "providers" },
					})
				} else {
					vscode.postMessage({ type: "loadApiConfigurationById", text: value })
				}
			}}
			contentClassName="max-h-[200px] overflow-y-auto min-w-32 rounded-lg border border-[#3c3c3c] bg-[#2d2d30] shadow-lg"
			// kilocode_change start - VSC Theme
			triggerClassName={cn("text-ellipsis overflow-hidden min-w-0", triggerClassName)}
			// kilocode_change end
			itemClassName="group"
			renderItem={({ type, value, label, pinned }) => {
				if (type !== DropdownOptionType.ITEM) {
					return <div className="py-1 px-2 text-xs text-[#888888]">{label}</div>
				}

				const config = listApiConfigMeta?.find((c) => c.id === value)
				const isCurrentConfig = config?.name === currentApiConfigName

				return (
					<div
						className={cn(
							"flex justify-between items-center gap-2 w-full py-1.5 px-2 text-xs cursor-pointer group",
							"hover:bg-[#3c3c3c] rounded-md transition-all duration-150",
							isCurrentConfig && "bg-[#0e639c] text-white",
						)}>
						<div
							className={cn("truncate min-w-0 overflow-hidden text-[#cccccc]", {
								"font-medium text-white": isCurrentConfig,
							})}>
							{label}
						</div>
						<div className="flex items-center gap-1 flex-shrink-0">
							{isCurrentConfig && (
								<div className="flex items-center justify-center w-3 h-3 rounded-full bg-white/20">
									<Check className="w-2 h-2 text-white" />
								</div>
							)}
							<StandardTooltip content={pinned ? t("chat:unpin") : t("chat:pin")}>
								<Button
									variant="ghost"
									size="icon"
									onClick={(e) => {
										e.stopPropagation()
										togglePinnedApiConfig(value)
										vscode.postMessage({
											type: "toggleApiConfigPin",
											text: value,
										})
									}}
									className={cn("w-3 h-3 p-0 hover:bg-white/10", {
										"opacity-0 group-hover:opacity-100": !pinned,
										"opacity-60": pinned,
									})}>
									<Pin className="w-2 h-2" />
								</Button>
							</StandardTooltip>
						</div>
					</div>
				)
			}}
		/>
	)
}
