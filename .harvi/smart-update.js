#!/usr/bin/env node

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

/**
 * Умный скрипт для обновления из ветки main
 *
 * Использует Git merge стратегии для автоматического разрешения конфликтов
 * связанных с заменами kilo/harvi, оставляя реальные конфликты для ручного разрешения
 */

function executeCommand(command, description, options = {}) {
	console.log(`\n🔄 ${description}...`)
	console.log(`Выполняем: ${command}`)

	try {
		const output = execSync(command, {
			encoding: "utf8",
			stdio: options.silent ? "pipe" : "inherit",
			cwd: process.cwd(),
			...options,
		})
		console.log(`✅ ${description} - успешно`)
		return { success: true, output }
	} catch (error) {
		if (!options.allowFailure) {
			console.error(`❌ ${description} - ошибка:`)
			console.error(error.message)
		}
		return { success: false, error: error.message, output: error.stdout }
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

async function performSmartMerge() {
	console.log("\n" + "=".repeat(50))
	console.log("🧠 УМНОЕ СЛИЯНИЕ С MAIN")
	console.log("=".repeat(50))

	// Получаем последние изменения
	if (!executeCommand("git fetch origin", "Получение последних изменений").success) {
		return false
	}

	// Пробуем обычный merge
	console.log("\n📋 Попытка автоматического слияния...")
	const mergeResult = executeCommand("git merge origin/main --no-commit --no-ff", "Слияние с origin/main", {
		allowFailure: true,
	})

	if (mergeResult.success) {
		console.log("✅ Слияние прошло без конфликтов!")
		executeCommand("git commit -m 'Merge from main'", "Коммит слияния")
		return true
	}

	// Проверяем, есть ли конфликты
	const statusResult = executeCommand("git status --porcelain", "Проверка статуса", { silent: true })
	if (!statusResult.success) {
		return false
	}

	const conflictedFiles = statusResult.output
		.split("\n")
		.filter((line) => line.startsWith("UU ") || line.startsWith("AA "))
		.map((line) => line.substring(3))

	if (conflictedFiles.length === 0) {
		console.log("✅ Конфликтов не обнаружено, завершаем слияние")
		executeCommand("git commit -m 'Merge from main'", "Коммит слияния")
		return true
	}

	console.log(`\n⚠️  Обнаружено ${conflictedFiles.length} файлов с конфликтами:`)
	conflictedFiles.forEach((file) => console.log(`   - ${file}`))

	// Анализируем конфликты и пытаемся разрешить автоматически
	let autoResolvedCount = 0
	const manualResolveFiles = []

	for (const file of conflictedFiles) {
		if (await tryAutoResolveConflict(file)) {
			autoResolvedCount++
			executeCommand(`git add "${file}"`, `Добавление разрешенного файла ${file}`, { silent: true })
		} else {
			manualResolveFiles.push(file)
		}
	}

	console.log(`\n📊 Результаты разрешения конфликтов:`)
	console.log(`   ✅ Автоматически разрешено: ${autoResolvedCount}`)
	console.log(`   ⚠️  Требует ручного разрешения: ${manualResolveFiles.length}`)

	if (manualResolveFiles.length > 0) {
		console.log(`\n🔧 Файлы для ручного разрешения:`)
		manualResolveFiles.forEach((file) => console.log(`   - ${file}`))
		console.log(`\n💡 После разрешения конфликтов выполните:`)
		console.log(`   git add .`)
		console.log(`   git commit -m "Merge from main"`)
		return false
	}

	// Все конфликты разрешены автоматически
	executeCommand("git commit -m 'Merge from main with auto-resolved conflicts'", "Коммит слияния")
	return true
}

async function tryAutoResolveConflict(filePath) {
	try {
		const content = fs.readFileSync(filePath, "utf8")

		// Проверяем, содержит ли файл только конфликты связанные с kilo/harvi
		const conflictMarkers = content.match(/<<<<<<< HEAD[\s\S]*?=======[\s\S]*?>>>>>>> origin\/main/g)

		if (!conflictMarkers) {
			return false
		}

		let resolvedContent = content
		let allKiloHarviConflicts = true

		for (const conflict of conflictMarkers) {
			const lines = conflict.split("\n")
			const headStart = lines.findIndex((line) => line.startsWith("<<<<<<< HEAD"))
			const separator = lines.findIndex((line) => line.startsWith("======="))
			const mainEnd = lines.findIndex((line) => line.startsWith(">>>>>>> origin/main"))

			if (headStart === -1 || separator === -1 || mainEnd === -1) {
				allKiloHarviConflicts = false
				break
			}

			const ourVersion = lines.slice(headStart + 1, separator).join("\n")
			const theirVersion = lines.slice(separator + 1, mainEnd).join("\n")

			// Проверяем, является ли это конфликтом kilo/harvi
			const isKiloHarviConflict = isOnlyKiloHarviDifference(ourVersion, theirVersion)

			if (isKiloHarviConflict) {
				// Используем нашу версию (с harvi)
				resolvedContent = resolvedContent.replace(conflict, ourVersion)
			} else {
				allKiloHarviConflicts = false
				break
			}
		}

		if (allKiloHarviConflicts) {
			fs.writeFileSync(filePath, resolvedContent, "utf8")
			console.log(`   ✅ Автоматически разрешен: ${filePath}`)
			return true
		}

		return false
	} catch (error) {
		console.error(`   ❌ Ошибка при разрешении ${filePath}:`, error.message)
		return false
	}
}

function isOnlyKiloHarviDifference(version1, version2) {
	// Простая эвристика: заменяем все вхождения kilo/harvi и сравниваем
	const normalize = (text) => {
		return text
			.replace(/kilo/gi, "PLACEHOLDER")
			.replace(/harvi/gi, "PLACEHOLDER")
			.replace(/Kilo/g, "PLACEHOLDER")
			.replace(/Harvi/g, "PLACEHOLDER")
			.replace(/KILO/g, "PLACEHOLDER")
			.replace(/HARVI/g, "PLACEHOLDER")
	}

	const normalized1 = normalize(version1)
	const normalized2 = normalize(version2)

	return normalized1.trim() === normalized2.trim()
}

async function main() {
	console.log("🚀 Запуск умного процесса обновления из ветки main")
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

	// Выполняем умное слияние
	const mergeSuccess = await performSmartMerge()

	if (mergeSuccess) {
		console.log("\n" + "=".repeat(50))
		console.log("🎉 ОБНОВЛЕНИЕ ЗАВЕРШЕНО УСПЕШНО!")
		console.log("=".repeat(50))
		console.log("✅ Все изменения из main успешно применены")
		console.log("✅ Конфликты kilo/harvi разрешены автоматически")
		console.log("\n💡 Рекомендуется:")
		console.log("1. Проверить изменения: git log --oneline -5")
		console.log("2. Протестировать функциональность")
	} else {
		console.log("\n" + "=".repeat(50))
		console.log("⚠️  ТРЕБУЕТСЯ РУЧНОЕ ВМЕШАТЕЛЬСТВО")
		console.log("=".repeat(50))
		console.log("Некоторые конфликты не удалось разрешить автоматически")
		console.log("Разрешите их вручную и завершите слияние")
	}
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
