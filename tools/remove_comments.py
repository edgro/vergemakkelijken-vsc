#!/usr/bin/env python3
import re
import sys
from pathlib import Path

import yaml
import libcst as cst


def load_keep_patterns(config_path: Path) -> list[str]:
    if not config_path.exists():
        return []

    try:
        content = yaml.safe_load(config_path.read_text(encoding='utf-8')) or {}
        patterns = content.get('keep_comment_patterns', [])
        return [str(item) for item in patterns]
    except Exception:
        return []


class RemoveCommentsTransformer(cst.CSTTransformer):
    def __init__(self, keep_patterns: list[str]):
        super().__init__()
        self.keep_patterns = [re.compile(pattern) for pattern in keep_patterns]

    def leave_Comment(self, original_node: cst.Comment, updated_node: cst.Comment):
        comment_value = original_node.value.strip()
        if any(pattern.search(comment_value) for pattern in self.keep_patterns):
            return updated_node
        return cst.RemovalSentinel.REMOVE


def main() -> int:
    if len(sys.argv) < 2:
        print('Usage: remove_comments.py <file_path> [config_path]', file=sys.stderr)
        return 1

    file_path = Path(sys.argv[1])
    config_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).with_name('vergemakkelijken.yml')

    try:
        source = file_path.read_text(encoding='utf-8')
        module = cst.parse_module(source)
        keep_patterns = load_keep_patterns(config_path)
        cleaned_module = module.visit(RemoveCommentsTransformer(keep_patterns))
        file_path.write_text(cleaned_module.code, encoding='utf-8')
    except Exception as exc:  # pragma: no cover - CLI error path
        print(f'Failed to remove comments: {exc}', file=sys.stderr)
        return 2

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
