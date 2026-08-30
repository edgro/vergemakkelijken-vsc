import re

import libcst as cst


class RemoveCommentsTransformer(cst.CSTTransformer):
    def __init__(self, keep_patterns: list[str]):
        super().__init__()
        self.keep_patterns = [re.compile(pattern) for pattern in keep_patterns]

    def leave_Comment(self, original_node: cst.Comment, updated_node: cst.Comment):
        comment_value = original_node.value.strip()
        if any(pattern.search(comment_value) for pattern in self.keep_patterns):
            return updated_node
        return cst.RemovalSentinel.REMOVE
