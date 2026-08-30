import unittest

import libcst as cst

from tools.comment_transformers import RemoveCommentsTransformer


class RemoveCommentsTransformerTests(unittest.TestCase):
    def test_removes_inline_and_line_comments(self):
        source = '# first line\nprint("hello")  # inline\n'

        module = cst.parse_module(source)
        cleaned = module.visit(RemoveCommentsTransformer([])).code

        self.assertEqual(cleaned, '\nprint("hello")  \n')

    def test_keeps_matching_comments(self):
        source = '# noqa\nprint("hello")  # inline\n'

        module = cst.parse_module(source)
        cleaned = module.visit(RemoveCommentsTransformer(['^# noqa'])).code

        self.assertEqual(cleaned, '# noqa\nprint("hello")  \n')


if __name__ == '__main__':
    unittest.main()
