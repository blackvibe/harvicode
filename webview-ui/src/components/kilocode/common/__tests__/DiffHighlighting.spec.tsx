import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { vi } from "vitest"
import CodeBlock from "../CodeBlock"

// Mock the highlighter
vi.mock("@src/utils/highlighter", () => ({
	getHighlighter: vi.fn().mockResolvedValue({
		codeToHast: vi.fn().mockResolvedValue({
			type: "element",
			tagName: "pre",
			properties: { style: "padding: 0; margin: 0;" },
			children: [
				{
					type: "element",
					tagName: "code",
					properties: { class: "hljs language-diff" },
					children: [
						{
							type: "element",
							tagName: "span",
							properties: { class: "line" },
							children: [{ type: "text", value: "+added line" }],
						},
						{
							type: "element",
							tagName: "span",
							properties: { class: "line" },
							children: [{ type: "text", value: "-removed line" }],
						},
						{
							type: "element",
							tagName: "span",
							properties: { class: "line" },
							children: [{ type: "text", value: "@@ -1,3 +1,3 @@" }],
						},
					],
				},
			],
		}),
	}),
	isLanguageLoaded: vi.fn().mockReturnValue(true),
	normalizeLanguage: vi.fn().mockImplementation((lang) => lang || "txt"),
}))

// Mock clipboard utilities
vi.mock("@src/utils/clipboard", () => ({
	useCopyToClipboard: () => ({
		showCopyFeedback: false,
		copyWithFeedback: vi.fn(),
	}),
}))

// Mock translation
vi.mock("@src/i18n/TranslationContext", () => ({
	useAppTranslation: () => ({
		t: (key: string) => key,
	}),
}))

describe("DiffHighlighting", () => {
	const sampleDiff = `--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,3 @@
 unchanged line
-removed line
+added line
 another unchanged line`

	it("should render diff content with proper language", async () => {
		render(<CodeBlock source={sampleDiff} language="diff" />)

		await waitFor(() => {
			expect(screen.getByText("+added line")).toBeInTheDocument()
			expect(screen.getByText("-removed line")).toBeInTheDocument()
			expect(screen.getByText("@@ -1,3 +1,3 @@")).toBeInTheDocument()
		})
	})

	it("should handle patch language alias", async () => {
		render(<CodeBlock source={sampleDiff} language="patch" />)

		await waitFor(() => {
			expect(screen.getByText("+added line")).toBeInTheDocument()
		})
	})

	it("should handle git-diff language alias", async () => {
		render(<CodeBlock source={sampleDiff} language="git-diff" />)

		await waitFor(() => {
			expect(screen.getByText("-removed line")).toBeInTheDocument()
		})
	})

	it("should handle unified diff format", async () => {
		const unifiedDiff = `diff --git a/test.js b/test.js
index 1234567..abcdefg 100644
--- a/test.js
+++ b/test.js
@@ -10,7 +10,7 @@ function test() {
   const x = 1;
-  const y = 2;
+  const y = 3;
   return x + y;
 }`

		render(<CodeBlock source={unifiedDiff} language="diff" />)

		await waitFor(() => {
			expect(screen.getByText("diff --git a/test.js b/test.js")).toBeInTheDocument()
		})
	})
})
