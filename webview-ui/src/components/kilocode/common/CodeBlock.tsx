import { memo, useEffect, useLayoutEffect, useRef, useCallback, useState } from "react"
import styled from "styled-components"
import { useCopyToClipboard } from "@src/utils/clipboard"
import { getHighlighter, isLanguageLoaded, normalizeLanguage, ExtendedLanguage } from "@src/utils/highlighter"
import { bundledLanguages } from "shiki"
import type { ShikiTransformer } from "shiki"
import { toJsxRuntime } from "hast-util-to-jsx-runtime"
import { Fragment, jsx, jsxs } from "react/jsx-runtime"
import { ChevronDown, ChevronUp, WrapText, AlignJustify, Copy, Check } from "lucide-react"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { StandardTooltip } from "@/components/ui"

export const CODE_BLOCK_BG_COLOR = "var(--vscode-editor-background, --vscode-sideBar-background, rgb(30 30 30))"
export const WRAPPER_ALPHA = "cc" // 80% opacity

// Configuration constants
export const WINDOW_SHADE_SETTINGS = {
	transitionDelayS: 0.2,
	collapsedHeight: 500, // Default collapsed height in pixels
}

// Tolerance in pixels for determining when a container is considered "at the bottom"
export const SCROLL_SNAP_TOLERANCE = 20

/*
overflowX: auto + inner div with padding results in an issue where the top/left/bottom padding renders but the right padding inside does not count as overflow as the width of the element is not exceeded. Once the inner div is outside the boundaries of the parent it counts as overflow.
https://stackoverflow.com/questions/60778406/why-is-padding-right-clipped-with-overflowscroll/77292459#77292459
this fixes the issue of right padding clipped off
“ideal” size in a given axis when given infinite available space--allows the syntax highlighter to grow to largest possible width including its padding
minWidth: "max-content",
*/

interface CodeBlockProps {
	source?: string
	rawSource?: string // Add rawSource prop for copying raw text
	language: string
	preStyle?: React.CSSProperties
	initialWordWrap?: boolean
	collapsedHeight?: number
	initialWindowShade?: boolean
	onLanguageChange?: (language: string) => void
}

const CodeBlockButton = styled.button`
	background: transparent;
	border: none;
	color: var(--vscode-foreground);
	cursor: pointer;
	padding: 4px;
	margin: 0 0px;
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0.4;
	border-radius: 3px;
	pointer-events: all;
	margin-left: 4px;
	height: 24px;
	width: 24px;

	&:hover {
		background: var(--vscode-toolbar-hoverBackground);
		opacity: 1;
	}

	/* Style for Lucide icons to ensure consistent sizing and positioning */
	svg {
		display: block;
	}
`

const CodeBlockButtonWrapper = styled.div`
	height: auto;
	z-index: 100;
	background: ${CODE_BLOCK_BG_COLOR}${WRAPPER_ALPHA};
	overflow: visible;
	padding: 4px 6px;
	border-radius: 3px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transition: opacity 0.2s;

	&:hover {
		background: var(--vscode-editor-background);
	}

	${CodeBlockButton} {
		position: relative;
		top: 0;
		right: 0;
	}
`

const CodeBlockContainer = styled.div`
	position: relative;
	overflow: hidden;
	background-color: ${CODE_BLOCK_BG_COLOR};
`

export const StyledPre = styled.div<{
	preStyle?: React.CSSProperties
	wordwrap?: "true" | "false" | undefined
	windowshade?: "true" | "false"
	collapsedHeight?: number
}>`
	background-color: ${CODE_BLOCK_BG_COLOR};
	max-height: ${({ windowshade, collapsedHeight }) =>
		windowshade === "true" ? `${collapsedHeight || WINDOW_SHADE_SETTINGS.collapsedHeight}px` : "none"};
	overflow-y: auto;
	padding: 10px;
	border-radius: 5px;
	${({ preStyle }) => preStyle && { ...preStyle }}

	pre {
		background-color: ${CODE_BLOCK_BG_COLOR};
		border-radius: 5px;
		margin: 0;
		padding: 10px;
		width: 100%;
		box-sizing: border-box;
		line-height: 1.4;
	}

	pre,
	code {
		/* Undefined wordwrap defaults to true (pre-wrap) behavior. */
		white-space: ${({ wordwrap }) => (wordwrap === "false" ? "pre" : "pre-wrap")};
		word-break: ${({ wordwrap }) => (wordwrap === "false" ? "normal" : "normal")};
		overflow-wrap: ${({ wordwrap }) => (wordwrap === "false" ? "normal" : "break-word")};
		font-size: var(--vscode-editor-font-size, var(--vscode-font-size, 12px));
		font-family: var(--vscode-editor-font-family);
		line-height: 1.4;
	}

	/* CSS styles for diff-git custom format - правильные селекторы для Shiki */

	/* Git diff standard format - green for additions */
	.diff-addition {
		background-color: rgba(155, 185, 85, 0.2);
		color: #51cf66;
		display: block;
		margin: 0;
		padding: 0 8px;
		line-height: 1.4;
	}

	/* Git diff standard format - red for deletions */
	.diff-deletion {
		background-color: rgba(255, 107, 107, 0.2);
		color: #ff6b6b;
		display: block;
		margin: 0;
		padding: 0 8px;
		line-height: 1.4;
	}

	/* Hunk headers (@@) */
	.diff-hunk-header {
		background-color: rgba(204, 204, 204, 0.2);
		color: #cccccc;
		font-weight: bold;
		display: block;
		margin: 0;
		padding: 0 8px;
		line-height: 1.4;
	}

	/* File headers (--- +++) */
	.diff-file-header {
		background-color: rgba(204, 204, 204, 0.1);
		color: #cccccc;
		font-weight: bold;
		display: block;
		margin: 0;
		padding: 0 8px;
		line-height: 1.4;
	}

	/* Apply_diff format markers - purple/blue theme */
	.diff-search-marker,
	.diff-replace-marker {
		background-color: rgba(139, 69, 19, 0.2);
		color: #6495ed;
		font-weight: bold;
		border-left: 3px solid #6495ed;
		display: block;
		margin: 0;
		padding: 0 8px;
		line-height: 1.4;
	}

	/* Search block content - red theme like deletions */
	.diff-search-content {
		background-color: rgba(255, 0, 0, 0.2);
		color: #ff6b6b;
		display: block;
		margin: 0;
		padding: 0 8px;
		line-height: 1.4;
	}

	/* Replace block content - green theme like additions */
	.diff-replace-content {
		background-color: rgba(155, 185, 85, 0.2);
		color: #51cf66;
		display: block;
		margin: 0;
		padding: 0 8px;
		line-height: 1.4;
	}

	/* Line markers (:start_line:) */
	.diff-line-marker {
		background-color: rgba(255, 165, 0, 0.2);
		color: #ffa500;
		font-style: italic;
		display: block;
		margin: 0;
		padding: 0 8px;
		line-height: 1.4;
	}

	/* Separators (------- =======) */
	.diff-separator {
		background-color: rgba(204, 204, 204, 0.3);
		color: #cccccc;
		font-weight: bold;
		display: block;
		margin: 0;
		padding: 0 8px;
		line-height: 1.4;
	}

	/* Context lines */
	.diff-context {
		display: block;
		margin: 0;
		padding: 0 8px;
		line-height: 1.4;
	}

	pre > code {
		.hljs-deletion {
			background-color: var(--vscode-diffEditor-removedTextBackground);
			display: inline-block;
			width: 100%;
		}
		.hljs-addition {
			background-color: var(--vscode-diffEditor-insertedTextBackground);
			display: inline-block;
			width: 100%;
		}
	}

	.hljs {
		color: var(--vscode-editor-foreground, #fff);
		background-color: ${CODE_BLOCK_BG_COLOR};
	}
`

const LanguageSelect = styled.select`
	font-size: 12px;
	color: var(--vscode-foreground);
	opacity: 0.4;
	font-family: monospace;
	appearance: none;
	background: transparent;
	border: none;
	cursor: pointer;
	padding: 4px;
	margin: 0;
	vertical-align: middle;
	height: 24px;

	& option {
		background: var(--vscode-editor-background);
		color: var(--vscode-foreground);
		padding: 0;
		margin: 0;
	}

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-thumb {
		background: var(--vscode-scrollbarSlider-background);
	}

	&::-webkit-scrollbar-track {
		background: var(--vscode-editor-background);
	}

	&:hover {
		opacity: 1;
		background: var(--vscode-toolbar-hoverBackground);
		border-radius: 3px;
	}

	&:focus {
		opacity: 1;
		outline: none;
		border-radius: 3px;
	}
`

const CodeBlock = memo(
	({
		source,
		rawSource,
		language,
		preStyle,
		initialWordWrap = true,
		initialWindowShade = true,
		collapsedHeight,
		onLanguageChange,
	}: CodeBlockProps) => {
		const [wordWrap, setWordWrap] = useState(initialWordWrap)
		const [windowShade, setWindowShade] = useState(initialWindowShade)
		const [currentLanguage, setCurrentLanguage] = useState<ExtendedLanguage>(() => normalizeLanguage(language))
		const userChangedLanguageRef = useRef(false)
		const [highlightedCode, setHighlightedCode] = useState<React.ReactNode>(null)
		const [showCollapseButton, setShowCollapseButton] = useState(true)
		const [isHovered, setIsHovered] = useState(false)
		const codeBlockRef = useRef<HTMLDivElement>(null)
		const preRef = useRef<HTMLDivElement>(null)
		const copyButtonWrapperRef = useRef<HTMLDivElement>(null)
		const { showCopyFeedback, copyWithFeedback } = useCopyToClipboard()
		const { t } = useAppTranslation()
		const isMountedRef = useRef(true)
		const buttonPositionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
		const collapseTimeout1Ref = useRef<NodeJS.Timeout | null>(null)
		const collapseTimeout2Ref = useRef<NodeJS.Timeout | null>(null)

		// Update current language when prop changes, but only if user hasn't
		// made a selection.
		useEffect(() => {
			const normalizedLang = normalizeLanguage(language)

			if (normalizedLang !== currentLanguage && !userChangedLanguageRef.current) {
				setCurrentLanguage(normalizedLang)
			}
		}, [language, currentLanguage])

		// Syntax highlighting with cached Shiki instance and mounted state management
		useEffect(() => {
			// Set mounted state at the beginning of this effect
			isMountedRef.current = true

			// Auto-detect diff-git language if source contains apply_diff markers
			let detectedLanguage = currentLanguage
			if (source && source.includes("<<<<<<< SEARCH")) {
				detectedLanguage = "diff-git"
			}

			// Create a safe fallback using React elements instead of HTML string
			const fallback = (
				<pre style={{ padding: 0, margin: 0 }}>
					<code className={`hljs language-${detectedLanguage || "txt"}`}>{source || ""}</code>
				</pre>
			)

			const highlight = async () => {
				// Show plain text if language needs to be loaded.
				if (detectedLanguage && !isLanguageLoaded(detectedLanguage)) {
					if (isMountedRef.current) {
						setHighlightedCode(fallback)
					}
				}

				const highlighter = await getHighlighter(detectedLanguage)
				if (!isMountedRef.current) return

				const hast = await highlighter.codeToHast(source || "", {
					lang: detectedLanguage || "txt",
					theme: document.body.className.toLowerCase().includes("light") ? "github-light" : "github-dark",
					transformers: [
						{
							pre(node) {
								node.properties.style = "padding: 0; margin: 0;"
								return node
							},
							code(node) {
								// Add hljs classes for consistent styling
								node.properties.class = `hljs language-${detectedLanguage}`

								// For diff-git language, we need to track block context across lines
								if (detectedLanguage === "diff-git") {
									let blockContext: "search" | "replace" | "none" = "none"

									// Process all lines to apply contextual styling
									const processLines = (element: any) => {
										if (element.children) {
											element.children.forEach((child: any) => {
												if (
													child.tagName === "span" &&
													child.properties?.class?.includes("line")
												) {
													const getTextContent = (el: any): string => {
														if (typeof el === "string") return el
														if (el.children) {
															return el.children
																.map((c: any) => getTextContent(c))
																.join("")
														}
														if (el.value) return el.value
														return ""
													}

													const lineText = getTextContent(child)

													// Update block context based on markers
													if (lineText.startsWith("<<<<<<< SEARCH")) {
														blockContext = "search"
													} else if (lineText.startsWith("=======")) {
														blockContext = "replace"
													} else if (lineText.startsWith(">>>>>>> REPLACE")) {
														blockContext = "none"
													}

													// Apply styling based on context and content
													// Replace the existing 'line' class to avoid double spacing
													if (lineText.startsWith("<<<<<<< SEARCH")) {
														child.properties.class = "diff-search-marker"
													} else if (lineText.startsWith(">>>>>>> REPLACE")) {
														child.properties.class = "diff-replace-marker"
													} else if (lineText.startsWith(":start_line:")) {
														child.properties.class = "diff-line-marker"
													} else if (lineText.startsWith("-------")) {
														child.properties.class = "diff-separator"
													} else if (lineText.startsWith("=======")) {
														child.properties.class = "diff-separator"
													}
													// Content within SEARCH/REPLACE blocks
													else if (blockContext === "search") {
														child.properties.class = "diff-search-content"
													} else if (blockContext === "replace") {
														child.properties.class = "diff-replace-content"
													}
													// Standard git diff format
													else if (lineText.startsWith("+")) {
														child.properties.class = "diff-addition"
													} else if (lineText.startsWith("-")) {
														child.properties.class = "diff-deletion"
													} else if (lineText.startsWith("@@")) {
														child.properties.class = "diff-hunk-header"
													} else if (
														lineText.startsWith("+++") ||
														lineText.startsWith("---")
													) {
														child.properties.class = "diff-file-header"
													} else {
														// Context lines (unchanged)
														child.properties.class = "diff-context"
													}
												}
												processLines(child)
											})
										}
									}

									processLines(node)
								}

								return node
							},
						},
					] as ShikiTransformer[],
				})
				if (!isMountedRef.current) return

				// Convert HAST to React elements using hast-util-to-jsx-runtime
				// This approach eliminates XSS vulnerabilities by avoiding dangerouslySetInnerHTML
				// while maintaining the exact same visual output and syntax highlighting
				try {
					const reactElement = toJsxRuntime(hast, {
						Fragment,
						jsx,
						jsxs,
						// Don't override components - let them render as-is to maintain exact output
					})

					if (isMountedRef.current) {
						setHighlightedCode(reactElement)
					}
				} catch (error) {
					console.error("[CodeBlock] Error converting HAST to JSX:", error)
					if (isMountedRef.current) {
						setHighlightedCode(fallback)
					}
				}
			}

			highlight().catch((e) => {
				console.error("[CodeBlock] Syntax highlighting error:", e, "\nStack trace:", e.stack)
				if (isMountedRef.current) {
					setHighlightedCode(fallback)
				}
			})

			// Cleanup function - manage mounted state and clear all timeouts
			return () => {
				isMountedRef.current = false
				if (buttonPositionTimeoutRef.current) {
					clearTimeout(buttonPositionTimeoutRef.current)
					buttonPositionTimeoutRef.current = null
				}
				if (collapseTimeout1Ref.current) {
					clearTimeout(collapseTimeout1Ref.current)
					collapseTimeout1Ref.current = null
				}
				if (collapseTimeout2Ref.current) {
					clearTimeout(collapseTimeout2Ref.current)
					collapseTimeout2Ref.current = null
				}
			}
		}, [source, currentLanguage, collapsedHeight])

		// Check if content height exceeds collapsed height whenever content changes
		useEffect(() => {
			const codeBlock = codeBlockRef.current

			if (codeBlock) {
				const actualHeight = codeBlock.scrollHeight
				setShowCollapseButton(actualHeight >= WINDOW_SHADE_SETTINGS.collapsedHeight)
			}
		}, [highlightedCode])

		// Ref to track if user was scrolled up *before* the source update
		// potentially changes scrollHeight
		const wasScrolledUpRef = useRef(false)

		// Ref to track if outer container was near bottom
		const outerContainerNearBottomRef = useRef(false)

		// Effect to listen to scroll events and update the ref
		useEffect(() => {
			const preElement = preRef.current
			if (!preElement) return

			const handleScroll = () => {
				const isAtBottom =
					Math.abs(preElement.scrollHeight - preElement.scrollTop - preElement.clientHeight) <
					SCROLL_SNAP_TOLERANCE
				wasScrolledUpRef.current = !isAtBottom
			}

			preElement.addEventListener("scroll", handleScroll, { passive: true })
			// Initial check in case it starts scrolled up
			handleScroll()

			return () => {
				preElement.removeEventListener("scroll", handleScroll)
			}
		}, []) // Empty dependency array: runs once on mount

		// Effect to track outer container scroll position
		useEffect(() => {
			const scrollContainer = document.querySelector('[data-virtuoso-scroller="true"]')
			if (!scrollContainer) return

			const handleOuterScroll = () => {
				const isAtBottom =
					Math.abs(scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight) <
					SCROLL_SNAP_TOLERANCE
				outerContainerNearBottomRef.current = isAtBottom
			}

			scrollContainer.addEventListener("scroll", handleOuterScroll, { passive: true })

			// Initial check
			handleOuterScroll()

			return () => {
				scrollContainer.removeEventListener("scroll", handleOuterScroll)
			}
		}, [])

		// Store whether we should scroll after highlighting completes
		const shouldScrollAfterHighlightRef = useRef(false)

		// Check if we should scroll when source changes
		useEffect(() => {
			// Only set the flag if we're at the bottom when source changes
			if (preRef.current && source && !wasScrolledUpRef.current) {
				shouldScrollAfterHighlightRef.current = true
			} else {
				shouldScrollAfterHighlightRef.current = false
			}
		}, [source])

		// Force shadow recalculation on initialization
		const updateCodeBlockButtonPosition = useCallback(() => {
			if (codeBlockRef.current) {
				// Force immediate reflow and shadow recalculation
				const element = codeBlockRef.current
				const computedStyle = window.getComputedStyle(element)
				// Reading offsetHeight forces a synchronous layout calculation
				const _ = element.offsetHeight
				// Force repaint by temporarily changing a style property
				element.style.willChange = "transform"
				requestAnimationFrame(() => {
					element.style.willChange = "auto"
				})
			}
		}, [])

		// Force shadow calculation immediately after mount and content changes
		useLayoutEffect(() => {
			updateCodeBlockButtonPosition()
		}, [highlightedCode, updateCodeBlockButtonPosition])

		// Update button position and scroll when highlightedCode changes
		useEffect(() => {
			if (highlightedCode) {
				// Clear any existing timeout before setting a new one
				if (buttonPositionTimeoutRef.current) {
					clearTimeout(buttonPositionTimeoutRef.current)
				}
				// Update button position
				buttonPositionTimeoutRef.current = setTimeout(() => {
					updateCodeBlockButtonPosition()
					buttonPositionTimeoutRef.current = null // Optional: Clear ref after execution
				}, 0)

				// Scroll to bottom if needed (immediately after Shiki updates)
				if (shouldScrollAfterHighlightRef.current) {
					// Scroll inner container
					if (preRef.current) {
						preRef.current.scrollTop = preRef.current.scrollHeight
						wasScrolledUpRef.current = false
					}

					// Also scroll outer container if it was near bottom
					if (outerContainerNearBottomRef.current) {
						const scrollContainer = document.querySelector('[data-virtuoso-scroller="true"]')
						if (scrollContainer) {
							scrollContainer.scrollTop = scrollContainer.scrollHeight
							outerContainerNearBottomRef.current = true
						}
					}

					// Reset the flag
					shouldScrollAfterHighlightRef.current = false
				}
			}
			// Cleanup function for this effect
			return () => {
				if (buttonPositionTimeoutRef.current) {
					clearTimeout(buttonPositionTimeoutRef.current)
				}
			}
		}, [highlightedCode, updateCodeBlockButtonPosition])

		// Advanced inertial scroll chaining
		// This effect handles the transition between scrolling the code block and the outer container.
		// When a user scrolls to the boundary of a code block (top or bottom), this implementation:
		// 1. Detects the boundary condition
		// 2. Applies inertial scrolling to the outer container for a smooth transition
		// 3. Adds physics-based momentum for natural deceleration
		// This creates a seamless experience where scrolling flows naturally between nested scrollable areas
		useEffect(() => {
			if (!preRef.current) return

			// Find the outer scrollable container
			const getScrollContainer = () => {
				return document.querySelector('[data-virtuoso-scroller="true"]') as HTMLElement
			}

			// Inertial scrolling implementation
			let velocity = 0
			let animationFrameId: number | null = null
			const FRICTION = 0.85 // Friction coefficient (lower = more friction)
			const MIN_VELOCITY = 0.5 // Minimum velocity before stopping

			// Animation function for inertial scrolling
			const animate = () => {
				const scrollContainer = getScrollContainer()
				if (!scrollContainer) return

				// Apply current velocity
				if (Math.abs(velocity) > MIN_VELOCITY) {
					scrollContainer.scrollBy(0, velocity)
					velocity *= FRICTION // Apply friction
					animationFrameId = requestAnimationFrame(animate)
				} else {
					velocity = 0
					animationFrameId = null
				}
			}

			// Wheel event handler with inertial scrolling
			const handleWheel = (e: WheelEvent) => {
				// If shift is pressed, let the browser handle default horizontal scrolling
				if (e.shiftKey) {
					return
				}
				if (!preRef.current) return

				// Only handle wheel events if the inner container has a scrollbar,
				// otherwise let the browser handle the default scrolling
				const hasScrollbar = preRef.current.scrollHeight > preRef.current.clientHeight

				// Pass through events if we don't need special handling
				if (!hasScrollbar) {
					return
				}

				const scrollContainer = getScrollContainer()
				if (!scrollContainer) return

				// Check if we're at the top or bottom of the inner container
				const isAtVeryTop = preRef.current.scrollTop === 0
				const isAtVeryBottom =
					Math.abs(preRef.current.scrollHeight - preRef.current.scrollTop - preRef.current.clientHeight) < 1

				// Handle scrolling at container boundaries
				if ((e.deltaY < 0 && isAtVeryTop) || (e.deltaY > 0 && isAtVeryBottom)) {
					// Prevent default to stop inner container from handling
					e.preventDefault()

					const boost = 0.15
					velocity += e.deltaY * boost

					// Start animation if not already running
					if (!animationFrameId) {
						animationFrameId = requestAnimationFrame(animate)
					}
				}
			}

			// Add wheel event listener to inner container
			const preElement = preRef.current
			preElement.addEventListener("wheel", handleWheel, { passive: false })

			// Clean up
			return () => {
				preElement.removeEventListener("wheel", handleWheel)

				// Cancel any ongoing animation
				if (animationFrameId) {
					cancelAnimationFrame(animationFrameId)
				}
			}
		}, [])

		// Track text selection state
		const [isSelecting, setIsSelecting] = useState(false)

		useEffect(() => {
			if (!preRef.current) return

			const handleMouseDown = (e: MouseEvent) => {
				// Only trigger if clicking the pre element directly
				if (e.currentTarget === preRef.current) {
					console.log("[DEBUG] Mouse down on pre element, setting isSelecting=true")
					setIsSelecting(true)
				}
			}

			const handleMouseUp = () => {
				console.log("[DEBUG] Mouse up, setting isSelecting=false")
				setIsSelecting(false)
			}

			const preElement = preRef.current
			preElement.addEventListener("mousedown", handleMouseDown)
			document.addEventListener("mouseup", handleMouseUp)

			return () => {
				preElement.removeEventListener("mousedown", handleMouseDown)
				document.removeEventListener("mouseup", handleMouseUp)
			}
		}, [])

		const handleCopy = useCallback(
			(e: React.MouseEvent) => {
				e.stopPropagation()
				const textToCopy = rawSource !== undefined ? rawSource : source || ""
				if (textToCopy) {
					copyWithFeedback(textToCopy, e)
				}
			},
			[source, rawSource, copyWithFeedback],
		)

		// Handle hover events for menu visibility
		const handleMouseEnter = useCallback(() => {
			setIsHovered(true)
		}, [])

		const handleMouseLeave = useCallback(() => {
			setIsHovered(false)
		}, [])

		if (source?.length === 0) {
			return null
		}

		return (
			<CodeBlockContainer ref={codeBlockRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
				<MemoizedStyledPre
					preRef={preRef}
					preStyle={preStyle}
					wordWrap={wordWrap}
					windowShade={windowShade}
					collapsedHeight={collapsedHeight}
					highlightedCode={highlightedCode}
					updateCodeBlockButtonPosition={updateCodeBlockButtonPosition}
				/>
			</CodeBlockContainer>
		)
	},
)

// Memoized content component to prevent unnecessary re-renders of highlighted code
const MemoizedCodeContent = memo(({ children }: { children: React.ReactNode }) => <>{children}</>)

// Memoized StyledPre component
const MemoizedStyledPre = memo(
	({
		preRef,
		preStyle,
		wordWrap,
		windowShade,
		collapsedHeight,
		highlightedCode,
		updateCodeBlockButtonPosition,
	}: {
		preRef: React.RefObject<HTMLDivElement>
		preStyle?: React.CSSProperties
		wordWrap: boolean
		windowShade: boolean
		collapsedHeight?: number
		highlightedCode: React.ReactNode
		updateCodeBlockButtonPosition: (forceHide?: boolean) => void
	}) => (
		<StyledPre
			ref={preRef}
			preStyle={preStyle}
			wordwrap={wordWrap ? "true" : "false"}
			windowshade={windowShade ? "true" : "false"}
			collapsedHeight={collapsedHeight}
			onMouseDown={() => updateCodeBlockButtonPosition(true)}
			onMouseUp={() => updateCodeBlockButtonPosition(false)}>
			<MemoizedCodeContent>{highlightedCode}</MemoizedCodeContent>
		</StyledPre>
	),
)

export default CodeBlock
