#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

// Конфигурация замен
const REPLACEMENTS = {
	"kilo-to-harvi": {
		from: "Kilo Code",
		to: "Kilo Code",
		description: "Замена Kilo Code на Kilo Code",
	},
	"harvi-to-kilo": {
		from: "Kilo Code",
		to: "Kilo Code",
		description: "Замена Kilo Code на Kilo Code",
	},
}

// Кэш для списка всех текстовых файлов
let allTextFiles = null

function getAllTextFiles() {
	if (allTextFiles !== null) {
		return allTextFiles
	}

	try {
		// Используем ripgrep для быстрого поиска всех текстовых файлов
		let command
		try {
			execSync("which rg", { stdio: "ignore" })
			command = `rg --files --type-not binary`
		} catch {
			try {
				execSync("which find", { stdio: "ignore" })
				command = `find . -type f -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -name "*.log" -not -name "*.lock" -not -name "*.png" -not -name "*.jpg" -not -name "*.jpeg" -not -name "*.gif" -not -name "*.ico" -not -name "*.woff*" -not -name "*.ttf" -not -name "*.eot" -not -name "*.svg" -not -name "*.pdf"`
			} catch {
				console.error("Ни ripgrep, ни find не найдены.")
				process.exit(1)
			}
		}

		const output = execSync(command, { encoding: "utf8", cwd: process.cwd() })
		allTextFiles = output
			.split("\n")
			.filter((line) => line.trim())
			.filter((file) => {
				// Исключаем бинарные файлы и ненужные директории
				return (
					!file.includes("node_modules/") &&
					!file.includes(".git/") &&
					!file.includes("dist/") &&
					!file.endsWith(".log") &&
					!file.endsWith(".lock") &&
					!file.endsWith(".png") &&
					!file.endsWith(".jpg") &&
					!file.endsWith(".jpeg") &&
					!file.endsWith(".gif") &&
					!file.endsWith(".ico") &&
					!file.endsWith(".woff") &&
					!file.endsWith(".woff2") &&
					!file.endsWith(".ttf") &&
					!file.endsWith(".eot") &&
					!file.endsWith(".svg") &&
					!file.endsWith(".pdf")
				)
			})

		console.log(`Найдено ${allTextFiles.length} текстовых файлов для обработки`)
		return allTextFiles
	} catch (error) {
		console.error("Ошибка при поиске файлов:", error.message)
		return []
	}
}

function findFilesWithText(searchText) {
	const files = getAllTextFiles()
	const matchingFiles = []

	files.forEach((file) => {
		try {
			const content = fs.readFileSync(file, "utf8")
			if (content.includes(searchText)) {
				matchingFiles.push(file)
			}
		} catch (error) {
			// Игнорируем файлы которые не можем прочитать
		}
	})

	return matchingFiles
}

function replaceInFile(filePath, fromText, toText) {
	try {
		const content = fs.readFileSync(filePath, "utf8")

		if (!content.includes(fromText)) {
			return false
		}

		const newContent = content.replace(new RegExp(fromText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), toText)

		if (newContent !== content) {
			fs.writeFileSync(filePath, newContent, "utf8")
			return true
		}

		return false
	} catch (error) {
		console.error(`Ошибка при обработке файла ${filePath}:`, error.message)
		return false
	}
}

function main() {
	const args = process.argv.slice(2)

	if (args.length === 0) {
		console.log("Использование:")
		console.log("  node .harvi/replace.js <режим>")
		console.log("")
		console.log("Доступные режимы:")
		Object.entries(REPLACEMENTS).forEach(([key, config]) => {
			console.log(`  ${key} - ${config.description}`)
		})
		process.exit(1)
	}

	const mode = args[0]
	const replacement = REPLACEMENTS[mode]

	if (!replacement) {
		console.error(`Неизвестный режим: ${mode}`)
		console.log("Доступные режимы:", Object.keys(REPLACEMENTS).join(", "))
		process.exit(1)
	}

	console.log(`Запуск в режиме: ${replacement.description}`)
	console.log(`Замена: "${replacement.from}" → "${replacement.to}"`)
	console.log("")

	// Находим все файлы с искомым текстом
	console.log(`Поиск файлов содержащих "${replacement.from}"...`)
	const files = findFilesWithText(replacement.from)

	if (files.length === 0) {
		console.log("Файлы не найдены!")
		process.exit(0)
	}

	console.log(`Найдено файлов: ${files.length}`)
	console.log("")

	let totalChanges = 0

	// Обрабатываем каждый файл
	files.forEach((file) => {
		console.log(`Обрабатываем: ${file}`)
		const hasChanges = replaceInFile(file, replacement.from, replacement.to)
		if (hasChanges) {
			totalChanges++
			console.log(`  ✓ Заменено`)
		} else {
			console.log(`  - Изменений не требуется`)
		}
	})

	console.log("")
	console.log(`Завершено! Обновлено файлов: ${totalChanges} из ${files.length}`)
}

main()
