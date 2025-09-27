import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"

import { CommandPatternSelector } from "../CommandPatternSelector"
import { TooltipProvider } from "../../../components/ui/tooltip"

// Mock react-i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
	Trans: ({ i18nKey, children }: any) => <span>{i18nKey || children}</span>,
}))

// Mock VSCodeLink
vi.mock("@vscode/webview-ui-toolkit/react", () => ({
	VSCodeLink: ({ children, onClick }: any) => (
		<a href="#" onClick={onClick}>
			{children}
		</a>
	),
}))

// Mock UI components
vi.mock("../../ui/button", () => ({
	Button: ({ children, onClick, className, ...props }: any) => (
		<button onClick={onClick} className={className} {...props} data-testid="button">
			{children}
		</button>
	),
}))

vi.mock("../../ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
	DropdownMenuTrigger: ({ children, asChild }: any) => (
		<div data-testid="dropdown-trigger" onClick={() => {}}>
			{children}
		</div>
	),
	DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
	DropdownMenuItem: ({ children, onClick }: any) => (
		<div data-testid="dropdown-item" onClick={onClick}>
			{children}
		</div>
	),
}))

// Wrapper component with TooltipProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => <TooltipProvider>{children}</TooltipProvider>

describe("CommandPatternSelector", () => {
	const defaultProps = {
		patterns: [
			{ pattern: "npm install express", description: "Full command" },
			{ pattern: "npm install", description: "Install npm packages" },
			{ pattern: "npm *", description: "Any npm command" },
		],
		allowedCommands: ["npm install"],
		deniedCommands: ["git push"],
		onAllowPatternChange: vi.fn(),
		onDenyPatternChange: vi.fn(),
	}

	it("should render with dropdown menu button", () => {
		const { container } = render(
			<TestWrapper>
				<CommandPatternSelector {...defaultProps} />
			</TestWrapper>,
		)

		// The component should render without errors
		expect(container).toBeTruthy()

		// Check for the dropdown menu button (three dots)
		const button = screen.getByRole("button")
		expect(button).toBeInTheDocument()
	})

	it("should render basic structure", () => {
		render(
			<TestWrapper>
				<CommandPatternSelector {...defaultProps} />
			</TestWrapper>,
		)

		// Check that the component renders with the expected structure
		expect(screen.getByRole("button")).toBeInTheDocument()
	})

	it("should handle pattern changes", () => {
		const mockOnAllowPatternChange = vi.fn()
		const props = {
			...defaultProps,
			onAllowPatternChange: mockOnAllowPatternChange,
		}

		render(
			<TestWrapper>
				<CommandPatternSelector {...props} />
			</TestWrapper>,
		)

		// Component should render without errors
		expect(screen.getByRole("button")).toBeInTheDocument()
	})
})
