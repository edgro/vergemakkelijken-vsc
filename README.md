# vergemakkelijken

A VS Code extension for cleaning Python code. 

## Features

- Removes comments from Python files via a LibCST-based helper
- Keeps comment lines that match configured regex patterns such as shebangs or `# noqa`
- Runs from the Explorer context menu

## Requirements

- Python 3 available on PATH
- Python dependencies from `tools/requirements.txt`

## Usage

1. Open the Explorer and select a file or folder.
2. Run the command `Cleanup comments` from the `vergemakkelijken` menu.
3. The extension will process the Python files and remove comments except the configured exceptions.

## Configuration

The file `tools/vergemakkelijken.yml` contains the keep patterns.

Example:

```yaml
keep_comment_patterns:
  - "^# noqa"
  - "^# type: ignore"
  - "^# pragma: no cover"
  - "^# no-remove"
  - "^#!"
```

## Notes

This extension is intended for Python-focused cleanup workflows and uses a Python helper rather than a pure TypeScript implementation for safer source transformation.
