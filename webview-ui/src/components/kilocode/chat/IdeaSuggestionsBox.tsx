import { telemetryClient } from "@/utils/TelemetryClient"
import { vscode } from "@/utils/vscode"
import { TelemetryEventName } from "@roo-code/types"
import { useTranslation } from "react-i18next"

export const IdeaSuggestionsBox = () => {
	const { t } = useTranslation("kilocode")
	const ideas = Object.values(t("ideaSuggestionsBox.ideas", { returnObjects: true }))

	const handleClick = (idea: string) => {
		vscode.postMessage({
			type: "insertTextToChatArea",
			text: idea,
		})

		telemetryClient.capture(TelemetryEventName.SUGGESTION_BUTTON_CLICKED, {
			idea,
		})
	}

	return (
		<div className="mt-4">
			<p className="text-md text-vscode-descriptionForeground mb-2">{t("ideaSuggestionsBox.newHere")}</p>
			<div className="border border-[#3c3c3c] rounded-xl bg-[#1e1e1e] p-2">
				<div className="space-y-1">
					{ideas.map((idea, index) => (
						<button
							key={index}
							onClick={() => handleClick(idea)}
							className="
								w-full text-left px-3 py-2.5 text-sm text-[#cccccc] rounded-lg
								hover:bg-[#2d2d30] transition-colors duration-150
								focus:outline-none focus-visible:ring-1 focus-visible:ring-[#4a4a4a]
								active:scale-95
							">
							{idea}
						</button>
					))}
				</div>
			</div>
		</div>
	)
}
