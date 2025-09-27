#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

// Конфигурация
const OUTPUT_FILE = "extension-combined.txt"

// Включаем только папки, относящиеся к ЧАТУ расширения
const INCLUDE_DIRS = [
	"webview-ui/src/components/chat",
	"webview-ui/src/components/ui",
	"webview-ui/src/components/common",
	"webview-ui/src/components/kilocode",
	"webview-ui/src/utils",
	"webview-ui/src/context",
	"webview-ui/src/hooks",
	"webview-ui/src/lib",
]

const EXCLUDE_DIRS = [
	"node_modules",
	".git",
	"dist",
	"out",
	"build",
	".vscode",
	".husky",
	".changeset",
	".devcontainer",
	".github",
	".trunk",
	"coverage",
	"benchmark",
	"releases",
	"launch",
	"__tests__",
	"apps",
	"packages",
	"jetbrains",
	"scripts",
	".harvi",
	".kilocode",
]

const EXCLUDE_FILES = [
	".gitignore",
	".eslintrc.js",
	".eslintrc.json",
	".prettierrc.json",
	".prettierignore",
	"package-lock.json",
	"yarn.lock",
	"pnpm-lock.yaml",
	"turbo.json",
	"knip.json",
	"renovate.json",
	".DS_Store",
	"Thumbs.db",
	"*.log",
	"*.tmp",
	"*.temp",
	OUTPUT_FILE,
	"esbuild.mjs",
	"vite.config.ts",
	"vitest.config.ts",
	"tailwind.config.js",
	"postcss.config.js",
	"codicon.css",
	"codicon-custom.css",
	"icon-map.json",
	"components.json",
	"eslint.config.mjs",
	"index.html",
]

const EXCLUDE_DIRS_PATTERNS = [
	"locales", // исключаем папки переводов
	"i18n", // исключаем интернационализацию
	"default-themes", // исключаем темы
	"__mocks__", // исключаем моки
]

const INCLUDE_EXTENSIONS = [
	".ts",
	".tsx",
	".js",
	".jsx",
	".json",
	".yml",
	".yaml",
	".css",
	".scss",
	".less",
	".html",
	".xml",
	".txt",
	".config.js",
	".config.ts",
	".mjs",
	".cjs",
]

// Функция для проверки, нужно ли исключить директорию
function shouldExcludeDir(dirName) {
	// Проверяем точные совпадения
	if (EXCLUDE_DIRS.includes(dirName) || dirName.startsWith(".")) {
		return true
	}

	// Проверяем паттерны
	for (const pattern of EXCLUDE_DIRS_PATTERNS) {
		if (dirName.includes(pattern)) {
			return true
		}
	}

	return false
}

// Функция для проверки, нужно ли исключить файл
function shouldExcludeFile(fileName) {
	// Проверяем точные совпадения
	if (EXCLUDE_FILES.includes(fileName)) {
		return true
	}

	// Проверяем паттерны
	for (const pattern of EXCLUDE_FILES) {
		if (pattern.includes("*")) {
			const regex = new RegExp(pattern.replace(/\*/g, ".*"))
			if (regex.test(fileName)) {
				return true
			}
		}
	}

	return false
}

// Функция для проверки, нужно ли включить файл по расширению
function shouldIncludeFile(fileName, filePath = "") {
	// Для файлов чата - включаем все .ts и .tsx файлы
	if (filePath.includes("components/chat")) {
		const ext = path.extname(fileName).toLowerCase()
		return ext === ".ts" || ext === ".tsx"
	}

	if (shouldExcludeFile(fileName)) {
		return false
	}

	// Исключаем файлы переводов по имени файла и пути
	if (
		fileName.includes(".nls.") ||
		fileName.includes("locales") ||
		fileName.includes("i18n") ||
		filePath.includes("/locales/") ||
		filePath.includes("/i18n/") ||
		filePath.includes("\\locales\\") ||
		filePath.includes("\\i18n\\")
	) {
		return false
	}

	const ext = path.extname(fileName).toLowerCase()
	return INCLUDE_EXTENSIONS.includes(ext) || fileName === "package.json" || fileName === "tsconfig.json"
}

// Функция для рекурсивного обхода директорий
function walkDirectory(dir, basePath = "") {
	const files = []

	try {
		const items = fs.readdirSync(dir)

		for (const item of items) {
			const fullPath = path.join(dir, item)
			const relativePath = path.join(basePath, item)
			const stat = fs.statSync(fullPath)

			if (stat.isDirectory()) {
				if (!shouldExcludeDir(item)) {
					files.push(...walkDirectory(fullPath, relativePath))
				}
			} else if (stat.isFile()) {
				if (shouldIncludeFile(item, relativePath)) {
					files.push({
						path: relativePath,
						fullPath: fullPath,
					})
				}
			}
		}
	} catch (error) {
		console.error(`Ошибка при чтении директории ${dir}:`, error.message)
	}

	return files
}

// Функция для проверки, является ли директория разрешенной
function isIncludedDir(dirPath) {
	const topLevelDir = dirPath.split(path.sep)[0]
	return INCLUDE_DIRS.includes(topLevelDir)
}

// Функция для чтения содержимого файла
function readFileContent(filePath) {
	try {
		return fs.readFileSync(filePath, "utf8")
	} catch (error) {
		return `[ОШИБКА ЧТЕНИЯ ФАЙЛА: ${error.message}]`
	}
}

// Функция для определения типа файла для подсветки синтаксиса
function getFileType(fileName) {
	const ext = path.extname(fileName).toLowerCase()
	const typeMap = {
		".ts": "typescript",
		".tsx": "typescript",
		".js": "javascript",
		".jsx": "javascript",
		".json": "json",
		".md": "markdown",
		".yml": "yaml",
		".yaml": "yaml",
		".css": "css",
		".scss": "scss",
		".less": "less",
		".html": "html",
		".xml": "xml",
		".svg": "xml",
		".txt": "text",
		".mjs": "javascript",
		".cjs": "javascript",
	}

	return typeMap[ext] || "text"
}

// Основная функция
function main() {
	console.log("🚀 Начинаем сбор файлов VSCode расширения...")

	const startTime = Date.now()
	const rootDir = process.cwd()

	console.log(`📁 Сканируем директорию: ${rootDir}`)
	console.log(`📂 Включаем только папки: ${INCLUDE_DIRS.join(", ")}`)

	// Получаем файлы только из разрешенных директорий
	let files = []

	for (const includeDir of INCLUDE_DIRS) {
		const dirPath = path.join(rootDir, includeDir)
		if (fs.existsSync(dirPath)) {
			console.log(`📁 Сканируем ${includeDir}/...`)
			files.push(...walkDirectory(dirPath, includeDir))
		} else {
			console.log(`⚠️  Директория ${includeDir} не найдена`)
		}
	}

	// Добавляем корневые файлы расширения
	const rootFiles = ["package.json", "tsconfig.json", "README.md", "CHANGELOG.md", "LICENSE"]
	for (const rootFile of rootFiles) {
		const filePath = path.join(rootDir, rootFile)
		if (fs.existsSync(filePath) && shouldIncludeFile(rootFile)) {
			files.push({
				path: rootFile,
				fullPath: filePath,
			})
		}
	}

	console.log(`📄 Найдено файлов: ${files.length}`)

	// Сортируем файлы по пути
	files.sort((a, b) => a.path.localeCompare(b.path))

	// Создаем содержимое выходного файла
	let output = ""
	output += `# Объединенные файлы VSCode расширения\n`
	output += `# Сгенерировано: ${new Date().toISOString()}\n`
	output += `# Всего файлов: ${files.length}\n\n`

	// Добавляем содержимое каждого файла
	for (let i = 0; i < files.length; i++) {
		const file = files[i]
		const fileType = getFileType(file.path)
		const content = readFileContent(file.fullPath)

		output += `## ${file.path}\n\n`
		output += `\`\`\`${fileType}\n`
		output += content
		output += `\n\`\`\`\n\n`

		if (i < files.length - 1) {
			output += `---\n\n`
		}

		// Показываем прогресс
		if ((i + 1) % 50 === 0 || i === files.length - 1) {
			console.log(`📝 Обработано файлов: ${i + 1}/${files.length}`)
		}
	}

	// Записываем результат
	try {
		fs.writeFileSync(OUTPUT_FILE, output, "utf8")
		const endTime = Date.now()
		const duration = ((endTime - startTime) / 1000).toFixed(2)

		console.log(`✅ Готово! Файл сохранен: ${OUTPUT_FILE}`)
		console.log(`⏱️  Время выполнения: ${duration}s`)
		console.log(`📊 Размер файла: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`)

		// Показываем статистику по типам файлов
		const stats = {}
		for (const file of files) {
			const ext = path.extname(file.path).toLowerCase() || "no-extension"
			stats[ext] = (stats[ext] || 0) + 1
		}

		console.log("\n📈 Статистика по типам файлов:")
		Object.entries(stats)
			.sort(([, a], [, b]) => b - a)
			.forEach(([ext, count]) => {
				console.log(`   ${ext}: ${count} файлов`)
			})
	} catch (error) {
		console.error("❌ Ошибка при записи файла:", error.message)
		process.exit(1)
	}
}

// Запускаем скрипт
if (require.main === module) {
	main()
}

module.exports = { main }
