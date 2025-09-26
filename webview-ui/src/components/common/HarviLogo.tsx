import React from "react"
import { cn } from "@/lib/utils"

interface HarviLogoProps {
	className?: string
	size?: "sm" | "md" | "lg"
}

export const HarviLogo: React.FC<HarviLogoProps> = ({ className, size = "md" }) => {
	const sizeClasses = {
		sm: "text-2xl",
		md: "text-4xl",
		lg: "text-6xl",
	}

	return (
		<div
			className={cn(
				"inline-flex items-center justify-center font-bold text-white select-none",
				sizeClasses[size],
				className,
			)}
			style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
			/h
		</div>
	)
}

export default HarviLogo
