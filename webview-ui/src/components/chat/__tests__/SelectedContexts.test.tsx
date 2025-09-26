import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { vi } from "vitest"

import { ContextMenuOptionType } from "@src/utils/context-mentions"
import { SelectedContexts, SelectedContext } from "../SelectedContexts"

// Mock the translation context
vi.mock("@/i18n/TranslationContext", () => ({
	useAppTranslation: () => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				"chat:removeContext": "Remove context",
			}
			return translations[key] || key
		},
	}),
}))

describe("SelectedContexts", () => {
	const mockOnRemove = vi.fn()
	const materialIconsBaseUri = "https://example.com/icons"

	const mockContexts: SelectedContext[] = [
		{
			id: "file-1",
			type: ContextMenuOptionType.File,
			value: "/src/components/App.tsx",
			displayName: "App.tsx",
		},
		{
			id: "folder-1",
			type: ContextMenuOptionType.Folder,
			value: "/src/components",
			displayName: "components",
		},
		{
			id: "problems-1",
			type: ContextMenuOptionType.Problems,
			value: "problems",
			displayName: "Problems",
		},
	]

	beforeEach(() => {
		mockOnRemove.mockClear()
	})

	it("should render nothing when no contexts are provided", () => {
		const { container } = render(
			<SelectedContexts contexts={[]} onRemove={mockOnRemove} materialIconsBaseUri={materialIconsBaseUri} />,
		)
		expect(container.firstChild).toBeNull()
	})

	it("should render all provided contexts", () => {
		render(
			<SelectedContexts
				contexts={mockContexts}
				onRemove={mockOnRemove}
				materialIconsBaseUri={materialIconsBaseUri}
			/>,
		)

		expect(screen.getByText("App.tsx")).toBeInTheDocument()
		expect(screen.getByText("components")).toBeInTheDocument()
		expect(screen.getByText("Problems")).toBeInTheDocument()
	})

	it("should call onRemove when remove button is clicked", () => {
		render(
			<SelectedContexts
				contexts={mockContexts}
				onRemove={mockOnRemove}
				materialIconsBaseUri={materialIconsBaseUri}
			/>,
		)

		const removeButtons = screen.getAllByLabelText("Remove context")
		fireEvent.click(removeButtons[0])

		expect(mockOnRemove).toHaveBeenCalledWith("file-1")
	})

	it("should format display names correctly for files and folders", () => {
		const contextsWithPaths: SelectedContext[] = [
			{
				id: "file-1",
				type: ContextMenuOptionType.File,
				value: "/very/long/path/to/file.tsx",
				displayName: "/very/long/path/to/file.tsx",
			},
			{
				id: "folder-1",
				type: ContextMenuOptionType.Folder,
				value: "/very/long/path/to/folder/",
				displayName: "/very/long/path/to/folder/",
			},
		]

		render(
			<SelectedContexts
				contexts={contextsWithPaths}
				onRemove={mockOnRemove}
				materialIconsBaseUri={materialIconsBaseUri}
			/>,
		)

		// Should show only the filename/foldername, not the full path
		expect(screen.getByText("file.tsx")).toBeInTheDocument()
		expect(screen.getByText("folder")).toBeInTheDocument()
	})

	it("should render correct icons for different context types", () => {
		render(
			<SelectedContexts
				contexts={mockContexts}
				onRemove={mockOnRemove}
				materialIconsBaseUri={materialIconsBaseUri}
			/>,
		)

		// Check for codicon classes for non-file contexts
		const problemsIcon = document.querySelector(".codicon-warning")
		expect(problemsIcon).toBeInTheDocument()
	})

	it("should handle contexts without material icons base URI", () => {
		render(<SelectedContexts contexts={mockContexts} onRemove={mockOnRemove} />)

		// Should still render contexts even without material icons
		expect(screen.getByText("App.tsx")).toBeInTheDocument()
		expect(screen.getByText("components")).toBeInTheDocument()
		expect(screen.getByText("Problems")).toBeInTheDocument()
	})
})
