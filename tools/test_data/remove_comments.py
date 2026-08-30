
import sys
from pathlib import Path

import libcst as cst


class RemoveCommentsTransformer(cst.CSTTransformer):
    def leave_Comment(self, original_node: cst.Comment, updated_node: cst.Comment):
        return cst.RemovalSentinel.REMOVE


def main() -> int:
    if len(sys.argv) < 2:
        print('Usage: remove_comments.py <file_path>', file=sys.stderr)
        return 1

    file_path = Path(sys.argv[1])

    try:
        source = file_path.read_text(encoding='utf-8')
        module = cst.parse_module(source)
        cleaned = module.visit(RemoveCommentsTransformer())
        file_path.write_text(cleaned.code, encoding='utf-8')
    except Exception as exc:  
        print(f'Failed to remove comments: {exc}', file=sys.stderr)
        return 2

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
