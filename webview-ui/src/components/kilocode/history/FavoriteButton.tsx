import { vscode } from "@/utils/vscode"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export const FavoriteButton = ({ id, isFavorited }: { id: string; isFavorited: boolean }) => {
	const { t } = useAppTranslation()

	return (
		<button
			title={isFavorited ? t("history:unfavoriteTask") : t("history:favoriteTask")}
			data-testid="favorite-task-button"
			onClick={(e: React.MouseEvent) => {
				e.stopPropagation()
				vscode.postMessage({ type: "toggleTaskFavorite", text: id })
			}}
			className={cn(
				"relative inline-flex items-center justify-center",
				"bg-[#2d2d30] hover:bg-[#3c3c3c] border border-[#3c3c3c]",
				"rounded-full w-6 h-6 text-[#cccccc] hover:text-white opacity-90 hover:opacity-100",
				"transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#4a4a4a]",
				"active:scale-95 cursor-pointer",
			)}>
			<Star className={cn("w-3 h-3 opacity-80", isFavorited ? "fill-yellow-400 text-yellow-400" : "")} />
		</button>
	)
}
