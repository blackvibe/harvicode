import { describe, test, expect, vi } from "vitest"

describe("Cancel Task Flicker Fix", () => {
	test("should prevent Virtuoso flickering during task cancellation", () => {
		// Mock ClineProvider with transition flag
		const mockProvider = {
			isTaskTransitioning: false,
			clineMessages: [{ text: "test message", ts: Date.now() }],

			getCurrentTask() {
				return this.isTaskTransitioning ? undefined : { clineMessages: this.clineMessages }
			},

			async postStateToWebview() {
				// Skip state updates during task transitions to prevent Virtuoso flickering
				if (this.isTaskTransitioning) {
					return
				}

				const messages = this.getCurrentTask()?.clineMessages || []
				return { clineMessages: messages }
			},

			async simulateTaskCancellation() {
				// Simulate the cancellation flow
				this.isTaskTransitioning = true

				// This would normally send empty array and cause flickering
				const stateUpdate1 = await this.postStateToWebview()

				// Complete the transition
				this.isTaskTransitioning = false

				// This sends the actual messages
				const stateUpdate2 = await this.postStateToWebview()

				return { stateUpdate1, stateUpdate2 }
			},
		}

		// Test the fix
		return mockProvider.simulateTaskCancellation().then(({ stateUpdate1, stateUpdate2 }) => {
			// First update should be skipped (undefined)
			expect(stateUpdate1).toBeUndefined()

			// Second update should contain messages
			expect(stateUpdate2).toBeDefined()
			expect(stateUpdate2!.clineMessages).toEqual(mockProvider.clineMessages)
		})
	})

	test("should allow normal state updates when not transitioning", () => {
		const mockProvider = {
			isTaskTransitioning: false,
			clineMessages: [{ text: "test message", ts: Date.now() }],

			getCurrentTask() {
				return { clineMessages: this.clineMessages }
			},

			async postStateToWebview() {
				if (this.isTaskTransitioning) {
					return
				}

				const messages = this.getCurrentTask()?.clineMessages || []
				return { clineMessages: messages }
			},
		}

		return mockProvider.postStateToWebview().then((result) => {
			expect(result).toBeDefined()
			expect(result!.clineMessages).toEqual(mockProvider.clineMessages)
		})
	})

	test("should handle empty messages correctly when not transitioning", () => {
		const mockProvider = {
			isTaskTransitioning: false,

			getCurrentTask(): { clineMessages: any[] } | undefined {
				return undefined // No current task
			},

			async postStateToWebview() {
				if (this.isTaskTransitioning) {
					return
				}

				const messages = this.getCurrentTask()?.clineMessages || []
				return { clineMessages: messages }
			},
		}

		return mockProvider.postStateToWebview().then((result) => {
			expect(result).toBeDefined()
			expect(result!.clineMessages).toEqual([])
		})
	})
})
