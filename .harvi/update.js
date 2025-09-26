#!/usr/bin/env node

const { execSync } = require("child_process")
const path = require("path")

/**
 * Скрипт для автоматизации обновления из ветки main
 *
 * Процесс:
 * 1. Запускает harvi-to-kilo (возвращает всё к kilo)
 * 2. Делает merge из main
 * 3. После успешного merge снова запускает kilo-to-harvi
 */

function executeCommand(command, description) {
	console.log(`\n🔄 ${description}...`)
	console.log(`Выполняем: ${command}`)

	try {
		const output = execSync(command, {
			encoding: "utf8",
			stdio: "inherit",
			cwd: process.cwd(),
		})
		console.log(`✅ ${description} - успешно`)
		return true
	} catch (error) {
		console.error(`❌ ${description} - ошибка:`)
		console.error(error.message)
		return false
	}
}

function checkGitStatus() {
	try {
		const status = execSync("git status --porcelain", { encoding: "utf8" })
		if (status.trim()) {
			console.log("⚠️  Обнаружены незакоммиченные изменения:")
			console.log(status)
			console.log("\nРекомендуется сначала закоммитить или спрятать изменения.")

			const readline = require("readline")
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
			})

			return new Promise((resolve) => {
				rl.question("Продолжить? (y/N): ", (answer) => {
					rl.close()
					resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes")
				})
			})
		}
		return Promise.resolve(true)
	} catch (error) {
		console.error("Ошибка при проверке статуса git:", error.message)
		return Promise.resolve(false)
	}
}

function getCurrentBranch() {
	try {
		const branch = execSync("git branch --show-current", { encoding: "utf8" }).trim()
		return branch
	} catch (error) {
		console.error("Ошибка при получении текущей ветки:", error.message)
		return null
	}
}

async function main() {
	console.log("🚀 Запуск процесса обновления из ветки main")
	console.log("=".repeat(50))

	// Проверяем статус git
	const canContinue = await checkGitStatus()
	if (!canContinue) {
		console.log("Операция отменена пользователем")
		process.exit(1)
	}

	// Получаем текущую ветку
	const currentBranch = getCurrentBranch()
	if (!currentBranch) {
		console.error("Не удалось определить текущую ветку")
		process.exit(1)
	}

	console.log(`📍 Текущая ветка: ${currentBranch}`)

	// Путь к скрипту замен
	const replaceScript = path.join(__dirname, "replace.js")

	// Шаг 1: Запускаем harvi-to-kilo
	console.log("\n" + "=".repeat(50))
	console.log("ШАГ 1: Возвращаем всё к kilo")
	console.log("=".repeat(50))

	if (!executeCommand(`node "${replaceScript}" harvi-to-kilo`, "Замена harvi → kilo")) {
		console.error("❌ Не удалось выполнить замену harvi-to-kilo")
		process.exit(1)
	}

	// Шаг 2: Обновляем из main
	console.log("\n" + "=".repeat(50))
	console.log("ШАГ 2: Обновление из ветки main")
	console.log("=".repeat(50))

	// Сначала fetch для получения последних изменений
	if (!executeCommand("git fetch origin", "Получение последних изменений")) {
		console.error("❌ Не удалось получить изменения из origin")
		process.exit(1)
	}

	// Затем merge
	if (!executeCommand("git merge origin/main", "Слияние с origin/main")) {
		console.error("❌ Не удалось выполнить merge с main")
		console.error("\n🔧 Возможные действия:")
		console.error("1. Разрешите конфликты вручную")
		console.error("2. Выполните 'git add .' и 'git commit'")
		console.error("3. Запустите этот скрипт снова")
		process.exit(1)
	}

	// Шаг 3: Запускаем kilo-to-harvi
	console.log("\n" + "=".repeat(50))
	console.log("ШАГ 3: Возвращаем всё к harvi")
	console.log("=".repeat(50))

	if (!executeCommand(`node "${replaceScript}" kilo-to-harvi`, "Замена kilo → harvi")) {
		console.error("❌ Не удалось выполнить замену kilo-to-harvi")
		console.error("\n🔧 Вы можете выполнить это вручную:")
		console.error(`node "${replaceScript}" kilo-to-harvi`)
		process.exit(1)
	}

	// Финал
	console.log("\n" + "=".repeat(50))
	console.log("🎉 ОБНОВЛЕНИЕ ЗАВЕРШЕНО УСПЕШНО!")
	console.log("=".repeat(50))
	console.log("✅ Все изменения из main успешно применены")
	console.log("✅ Все замены kilo → harvi выполнены")
	console.log("\n💡 Рекомендуется:")
	console.log("1. Проверить изменения: git status")
	console.log("2. Протестировать функциональность")
	console.log("3. Закоммитить изменения если всё работает корректно")
}

// Обработка ошибок
process.on("uncaughtException", (error) => {
	console.error("\n❌ Критическая ошибка:", error.message)
	process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
	console.error("\n❌ Необработанная ошибка:", reason)
	process.exit(1)
})

main().catch((error) => {
	console.error("\n❌ Ошибка выполнения:", error.message)
	process.exit(1)
})
