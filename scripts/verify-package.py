#!/usr/bin/env python3
"""Verify candidate checksums, source/UI equality, CPU architecture and optional handshake."""
import argparse
import json
from pathlib import Path

from release import verify_package


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("artifact", type=Path)
parser.add_argument("--handshake", action="store_true", help="Execute this package's native sidecar")
parser.add_argument("--report", type=Path)
args = parser.parse_args()
report = verify_package(args.artifact.resolve(), handshake=args.handshake)
text = json.dumps(report, indent=2) + "\n"
if args.report:
    args.report.write_text(text)
print(text, end="")
