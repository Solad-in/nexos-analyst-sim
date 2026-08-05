# Собирает src/ обратно в один автономный HTML — тот, что раздаётся и работает артефактом.
# Node не нужен: только PowerShell, который есть в системе.
#
#   .\build.ps1              -> dataco-os-v3.html рядом со скриптом
#   .\build.ps1 -Out путь    -> другое имя файла
#
# Порядок скриптов берётся из src/index.html, а не из имён файлов — то есть источник
# истины один, и забыть подключить новый файл в двух местах невозможно.

param([string]$Out = "")

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src  = Join-Path $root 'src'
# Собранный файл называется index.html: это одновременно точка входа GitHub Pages
# (адрес получается без имени файла) и то, что скачивают и открывают двойным кликом.
# Прежнее имя dataco-os-v3.html несло номер версии, которого в репозитории всё равно нет.
if (-not $Out) { $Out = Join-Path $root 'index.html' }

$enc = New-Object System.Text.UTF8Encoding($false)   # без BOM: он не должен попасть внутрь склейки
function Read-Utf8($path) {
    if (-not (Test-Path $path)) { throw "нет файла: $path" }
    $text = [System.IO.File]::ReadAllText($path, $enc)
    return $text.TrimStart([char]0xFEFF)             # на случай, если BOM всё же завёлся
}

# Все файлы делят одну глобальную область. Повторное объявление const/let/function на
# верхнем уровне — не предупреждение, а SyntaxError при инициализации скрипта: браузер
# молча выбрасывает ВЕСЬ файл целиком, вместе со всем, что в нём объявлено, и не пишет
# ничего в консоль после загрузки. Один раз так исчезли все 17 генераторов задач из-за
# второго `shuffle`. Поэтому имена собираются на сборке и сверяются между файлами.
# Хеш-таблицы PowerShell по умолчанию регистронезависимы, а JavaScript — нет: с обычной @{}
# сторож считал `VOCAB` и `vocab` одним именем и падал на ровном месте.
$declared = New-Object System.Collections.Hashtable ([StringComparer]::Ordinal)
$dupes    = @()
function Add-TopLevelNames($rel, $js) {
    # Верхний уровень = объявление с самого начала строки. В этом коде вложенные объявления
    # всегда с отступом, так что различить их построчно достаточно.
    foreach ($m in [regex]::Matches($js, '(?m)^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)')) {
        $name = $m.Groups[1].Value
        if ($declared.ContainsKey($name)) {
            $script:dupes += "$name — уже объявлено в $($declared[$name]), повтор в $rel"
        } else {
            $declared[$name] = $rel
        }
    }
}

$index = Read-Utf8 (Join-Path $src 'index.html')
$sb   = New-Object System.Text.StringBuilder
$inlinedCss = 0
$inlinedJs  = 0

foreach ($line in ($index -split "`r?`n")) {

    # <link rel="stylesheet" href="styles.css">  ->  <style>…</style>
    if ($line -match '<link\s+rel="stylesheet"\s+href="([^"]+)"\s*/?>') {
        $css = Read-Utf8 (Join-Path $src $Matches[1])
        [void]$sb.AppendLine('<style>')
        [void]$sb.AppendLine($css.TrimEnd())
        [void]$sb.AppendLine('</style>')
        $inlinedCss++
        continue
    }

    # <script src="js/xx.js"></script>  ->  <script>…</script>
    if ($line -match '<script\s+src="([^"]+)"\s*>\s*</script>') {
        $rel = $Matches[1]
        $js  = Read-Utf8 (Join-Path $src $rel)
        Add-TopLevelNames $rel $js
        [void]$sb.AppendLine("<script>")
        [void]$sb.AppendLine("/* ---- $rel ---- */")
        [void]$sb.AppendLine($js.TrimEnd())
        [void]$sb.AppendLine('</script>')
        $inlinedJs++
        continue
    }

    [void]$sb.AppendLine($line)
}

if ($inlinedCss -eq 0) { throw 'в src/index.html не найден <link rel="stylesheet">' }
if ($inlinedJs  -eq 0) { throw 'в src/index.html не найдено ни одного <script src>' }
if ($dupes.Count -gt 0) {
    throw "повторные объявления на верхнем уровне (браузер выбросит весь файл целиком):`n  " + ($dupes -join "`n  ")
}

$text = $sb.ToString()

# Защита от того, что чей-то код содержит закрывающий тег и рвёт разметку.
# В строковых литералах его пишут как '<\/script>' — если попался «голый», это ошибка сборки.
$strayEnd = ([regex]::Matches($text, '(?i)</script>')).Count
if ($strayEnd -ne $inlinedJs) {
    throw "в исходниках встречается литеральный </script> — сборка порвёт разметку (ожидалось $inlinedJs, найдено $strayEnd)"
}

[System.IO.File]::WriteAllText($Out, $text, $enc)

$kb = [math]::Round((Get-Item $Out).Length / 1KB)
Write-Host "собрано: $Out"
Write-Host "  css-файлов: $inlinedCss, js-файлов: $inlinedJs, размер: $kb КБ"
