#!/usr/bin/env python3
"""Validate staged repair paths and file types against a trusted commit."""

import re
import subprocess
import sys

APPLICATION_FILES = {
    b"index.html",
    b"quiz.html",
    b"server.js",
    b"public/js/app.js",
    b"public/css/styles.css",
}
TEST_PATH = re.compile(rb"tests/[a-zA-Z0-9_-]+\.test\.js")

base = sys.argv[1]
entries = subprocess.check_output(
    ["git", "diff", "--cached", "--raw", "--no-renames", "-z", base, "--"]
).split(b"\0")
for metadata, path in zip(entries[0::2], entries[1::2]):
    old_mode, new_mode, _, _, status = metadata[1:].split()
    is_test = TEST_PATH.fullmatch(path)
    permitted_change = (old_mode, new_mode, status) == (b"100644", b"100644", b"M")
    permitted_new_test = is_test and (old_mode, new_mode, status) == (b"000000", b"100644", b"A")
    if not ((path in APPLICATION_FILES or is_test) and (permitted_change or permitted_new_test)):
        sys.exit(f"Repair contains a forbidden path or file change: {path!r}")

subprocess.run(["git", "diff", "--cached", "--check", base, "--"], check=True)
