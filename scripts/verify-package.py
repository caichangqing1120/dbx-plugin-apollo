#!/usr/bin/env python3
"""Inspect a local unsigned candidate and execute its packaged initialize handshake."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import zipfile

root = Path(__file__).resolve().parents[1]
artifact = Path(sys.argv[1]).resolve()
digest = lambda value: hashlib.sha256(value).hexdigest()
with zipfile.ZipFile(artifact) as archive:
    names = archive.namelist()
    assert len(names) == len(set(names)), "Duplicate archive entries"
    assert all(not Path(name).is_absolute() and ".." not in Path(name).parts for name in names)
    checksums = json.loads(archive.read("checksums.json"))
    assert checksums["algorithm"] == "sha256"
    assert set(checksums["files"]) == set(names) - {"checksums.json"}
    for name, expected in checksums["files"].items():
        assert digest(archive.read(name)) == expected, "Checksum mismatch: " + name
    manifest = json.loads(archive.read("manifest.json"))
    assert manifest["version"] == json.loads((root / "package.json").read_text())["version"]
    executable = manifest["entrypoints"]["backend"]["executable"]
    assert executable.startswith("bin/darwin-arm64/")
    ui = archive.read(manifest["entrypoints"]["ui"]["entry"])
    assert ui == (root / "ui/index.html").read_bytes(), "Packaged UI differs from verified build"
    assert not any(name.startswith(("tests/", "docs/", "output/", "node_modules/")) for name in names)
    with tempfile.TemporaryDirectory(prefix="apollo-package-inspection-") as directory:
        binary = Path(directory) / "apollo"
        executable_bytes = archive.read(executable)
        assert executable_bytes[:4] == bytes.fromhex("cffaedfe"), "Not a little-endian Mach-O 64 executable"
        assert int.from_bytes(executable_bytes[4:8], "little") == 0x0100000C, "Package target is arm64 but the Mach-O CPU type differs"
        binary.write_bytes(executable_bytes)
        binary.chmod(0o700)
        binary_kind = subprocess.check_output(["file", str(binary)], text=True).strip().split(": ", 1)[-1]
        assert "arm64" in binary_kind.lower()
        request = {"jsonrpc": "2.0", "id": 1, "method": "plugin/initialize", "params": {"host": {"protocolVersions": [1]}}}
        run = subprocess.run([str(binary)], input=json.dumps(request) + "\n", text=True, capture_output=True, timeout=15, check=True)
        messages = [json.loads(line) for line in run.stdout.splitlines() if line.strip()]
        response = next(message for message in messages if message.get("id") == 1)
        assert "error" not in response, response
        plugin = response["result"]["plugin"]
        assert plugin["id"] == manifest["id"] and plugin["version"] == manifest["version"]
source = hashlib.sha256()
for path in sorted((root / "src").iterdir()):
    if path.is_file():
        source.update(("src/" + path.name + "\0").encode())
        source.update(path.read_bytes())
report = {
    "artifact": str(artifact.relative_to(root)), "sha256": digest(artifact.read_bytes()),
    "size": artifact.stat().st_size, "archiveEntries": len(names),
    "verifiedChecksumEntries": len(checksums["files"]), "initializePlugin": plugin,
    "platform": "darwin-arm64", "binary": binary_kind,
    "nativeUISHA256": digest(ui), "nativeSourceSHA256": source.hexdigest(), "unsigned": True,
}
(root / "docs/package-verification.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
