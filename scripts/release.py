#!/usr/bin/env python3
"""Build unsigned DBX Store candidates with explicit native targets and pinned bytes."""
import argparse
import copy
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import platform
import re
import struct
import subprocess
import tempfile
import zipfile


ROOT = Path(__file__).resolve().parents[1]
TARGETS = ("darwin-arm64", "darwin-x64", "windows-x64", "linux-x64", "linux-arm64")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")


def binary_identity(data, target):
    require(target in TARGETS, "Unsupported target: " + target)
    require(len(data) >= 32, "Truncated native executable")
    if target.startswith("darwin-"):
        expected = 0x0100000C if target.endswith("arm64") else 0x01000007
        require(data[:4] == bytes.fromhex("cffaedfe"), "Not a Mach-O 64 executable")
        require(struct.unpack_from("<I", data, 4)[0] == expected, "Mach-O CPU architecture mismatch")
        return "Mach-O 64-bit " + target.split("-")[1]
    if target.startswith("linux-"):
        expected = 183 if target.endswith("arm64") else 62
        require(data[:6] == b"\x7fELF\x02\x01", "Not a little-endian ELF 64 executable")
        require(struct.unpack_from("<H", data, 18)[0] == expected, "ELF CPU architecture mismatch")
        return "ELF 64-bit " + target.split("-")[1]
    require(len(data) >= 64 and data[:2] == b"MZ", "Not a Windows PE executable")
    offset = struct.unpack_from("<I", data, 0x3C)[0]
    require(offset + 26 <= len(data) and data[offset:offset + 4] == b"PE\0\0", "Invalid PE executable header")
    require(struct.unpack_from("<H", data, offset + 4)[0] == 0x8664, "PE CPU architecture mismatch")
    require(struct.unpack_from("<H", data, offset + 24)[0] == 0x20B, "Not a PE32+ executable")
    return "PE32+ x64"


def source_files(root):
    files = {}
    for directory in ("assets", "ui"):
        base = root / directory
        require(base.is_dir() and not base.is_symlink(), "Missing or symlink package directory: " + directory)
        for path in sorted(base.rglob("*")):
            require(not path.is_symlink(), "Symlink is not allowed in packages: " + str(path))
            if not path.is_dir():
                require(path.is_file(), "Not a regular package file: " + str(path))
                files[path.relative_to(root).as_posix()] = path.read_bytes()
    require("ui/index.html" in files, "Build the UI before packaging")
    return files


def require_preview_version(version):
    match = re.fullmatch(
        r"(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)"
        r"-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?",
        version,
    )
    require(match is not None, "Preview packages require a SemVer prerelease suffix, for example 0.1.3-rc.1")
    require(all(not part.isdigit() or part == "0" or not part.startswith("0")
                for part in match.group(1).split(".")), "Invalid SemVer prerelease numeric identifier")


def package_manifest(root, target):
    manifest = json.loads((root / "manifest.json").read_text())
    require(manifest["version"] == json.loads((root / "package.json").read_text())["version"], "Version mismatch")
    require_preview_version(manifest["version"])
    binary = PurePosixPath(manifest["entrypoints"]["backend"]["executable"]).name
    if target.startswith("windows-"):
        binary += ".exe"
    manifest["entrypoints"]["backend"]["executable"] = f"bin/{target}/{binary}"
    return manifest


def metadata_for(artifact, target):
    return {"target": target, "url": artifact.name, "sha256": digest(artifact.read_bytes()), "size": artifact.stat().st_size}


def effective_manifest(manifest):
    value = copy.deepcopy(manifest)
    backend = value["entrypoints"]["backend"]
    # The official CLI omits these two Host defaults when serializing a manifest.
    backend.setdefault("protocol_versions", [1])
    backend.setdefault("transport", "stdio-jsonl")
    return value


def write_package(root, target, binary, output):
    data = binary.read_bytes()
    binary_identity(data, target)
    manifest = package_manifest(root, target)
    executable = manifest["entrypoints"]["backend"]["executable"]
    files = source_files(root)
    files[executable] = data
    files["manifest.json"] = (json.dumps(manifest, ensure_ascii=True, indent=2) + "\n").encode()
    checksums = {"algorithm": "sha256", "files": {name: digest(data) for name, data in sorted(files.items())}}
    files["checksums.json"] = (json.dumps(checksums, indent=2) + "\n").encode()
    output.mkdir(parents=True, exist_ok=True)
    artifact = output / f"{manifest['id']}-{manifest['version']}-{target}.dbxp"
    with zipfile.ZipFile(artifact, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, content in sorted(files.items()):
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = (0o100755 if name == executable else 0o100644) << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, content, compresslevel=9)
    write_json(artifact.with_suffix(".artifact.json"), metadata_for(artifact, target))
    return artifact


def verify_package(artifact, root=ROOT, handshake=False):
    with zipfile.ZipFile(artifact) as archive:
        names = archive.namelist()
        require(len(names) == len(set(names)), "Duplicate archive entries")
        for name in names:
            parts = PurePosixPath(name)
            require(not parts.is_absolute() and ".." not in parts.parts and "\\" not in name, "Unsafe archive entry: " + name)
        checksums = json.loads(archive.read("checksums.json"))
        require(checksums["algorithm"] == "sha256", "Invalid checksum algorithm")
        require(set(checksums["files"]) == set(names) - {"checksums.json"}, "Checksum entry set mismatch; unsigned candidates only")
        for name, expected in checksums["files"].items():
            require(digest(archive.read(name)) == expected, "Checksum mismatch: " + name)
        manifest = json.loads(archive.read("manifest.json"))
        executable = manifest["entrypoints"]["backend"]["executable"]
        parts = PurePosixPath(executable).parts
        require(len(parts) == 3 and parts[0] == "bin" and parts[1] in TARGETS, "Unexpected native target path")
        target = parts[1]
        require(effective_manifest(manifest) == effective_manifest(package_manifest(root, target)), "Packaged manifest differs from reviewed source")
        require(artifact.name == f"{manifest['id']}-{manifest['version']}-{target}.dbxp", "Artifact filename target mismatch")
        expected_files = source_files(root)
        require(set(names) == set(expected_files) | {executable, "manifest.json", "checksums.json"}, "Unreviewed files in package")
        for name, data in expected_files.items():
            require(archive.read(name) == data, "Packaged source/UI differs: " + name)
        binary = archive.read(executable)
        binary_kind = binary_identity(binary, target)
        require(archive.getinfo(executable).external_attr >> 16 & 0o111, "Executable permission is missing")
    metadata = metadata_for(artifact, target)
    metadata_path = artifact.with_suffix(".artifact.json")
    if metadata_path.is_file():
        require(json.loads(metadata_path.read_text()) == metadata, "Artifact metadata hash/size mismatch")
    source = hashlib.sha256()
    for path in sorted((root / "src").iterdir()):
        if path.is_file():
            source.update(("src/" + path.name + "\0").encode())
            source.update(path.read_bytes())
    report = {
        **metadata, "archiveEntries": len(names), "verifiedChecksumEntries": len(checksums["files"]),
        "binary": binary_kind, "nativeUISHA256": digest(expected_files["ui/index.html"]),
        "nativeSourceSHA256": source.hexdigest(), "unsigned": True, "initializeHandshake": "not run (cross target)",
    }
    if handshake:
        with tempfile.TemporaryDirectory(prefix="apollo-packaged-handshake-") as directory:
            path = Path(directory) / PurePosixPath(executable).name
            path.write_bytes(binary)
            path.chmod(0o700)
            request = {"jsonrpc": "2.0", "id": 1, "method": "plugin/initialize", "params": {"host": {"protocolVersions": [1]}}}
            run = subprocess.run([str(path)], input=json.dumps(request) + "\n", text=True, capture_output=True, timeout=15, check=True)
            messages = [json.loads(line) for line in run.stdout.splitlines() if line.strip()]
            response = next(message for message in messages if message.get("id") == 1)
            require("error" not in response, "Packaged initialize failed: " + str(response))
            plugin = response["result"]["plugin"]
            require(plugin["id"] == manifest["id"] and plugin["version"] == manifest["version"], "Packaged initialize identity mismatch")
            report["initializeHandshake"] = "pass"
            report["initializePlugin"] = plugin
    return report


def write_release_metadata(root, artifacts, output):
    manifest = json.loads((root / "manifest.json").read_text())
    metadata = []
    for artifact in artifacts:
        stored = json.loads(artifact.with_suffix(".artifact.json").read_text())
        actual = metadata_for(artifact, stored["target"])
        require(actual == stored, "Artifact metadata hash/size mismatch: " + artifact.name)
        verify_package(artifact, root)
        metadata.append(actual)
    require(len({entry["target"] for entry in metadata}) == len(metadata), "Duplicate artifact targets")
    identity = {key: copy.deepcopy(manifest[key]) for key in ("id", "name", "version", "publisher", "description", "permissions")}
    write_json(output / "release-candidates.json", {"plugin": identity, "artifacts": metadata})
    (output / f"SHA256SUMS-v{manifest['version']}.txt").write_text(
        "".join(f"{entry['sha256']}  {entry['url']}\n" for entry in metadata), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", choices=("all",) + TARGETS, default="all")
    args = parser.parse_args()
    manifest = json.loads((ROOT / "manifest.json").read_text())
    require_preview_version(manifest["version"])
    output = ROOT / "dist" / f"release-v{manifest['version']}"
    selected = TARGETS if args.target == "all" else (args.target,)
    if args.target != "all":
        output /= args.target
    artifacts, reports = [], []
    native_os = {"Darwin": "darwin", "Windows": "windows", "Linux": "linux"}.get(platform.system())
    native_arch = {"aarch64": "arm64", "arm64": "arm64", "x86_64": "x64", "AMD64": "x64"}.get(platform.machine())
    native_target = f"{native_os}-{native_arch}"
    with tempfile.TemporaryDirectory(prefix="apollo-cross-build-") as directory:
        for target in selected:
            goos, arch = target.split("-")
            binary = Path(directory) / (target + (".exe" if goos == "windows" else ""))
            env = {**os.environ, "GOOS": goos, "GOARCH": "amd64" if arch == "x64" else arch,
                   "CGO_ENABLED": "0", "GOAMD64": "v1", "GOARM64": "v8.0", "GOFLAGS": "", "GOTOOLCHAIN": "local"}
            subprocess.run(["go", "build", "-trimpath", "-buildvcs=false", "-ldflags=-s -w", "-o", str(binary), "."],
                           cwd=ROOT / "backend", env=env, check=True)
            artifact = write_package(ROOT, target, binary, output)
            reports.append(verify_package(artifact, ROOT, handshake=target == native_target))
            artifacts.append(artifact)
            print(f"Verified {target}: {artifact.name}", flush=True)
    write_release_metadata(ROOT, artifacts, output)
    write_json(output / "package-verification.json", {"goVersion": subprocess.check_output(["go", "version"], text=True).strip(), "packages": reports})
    print(f"Unsigned candidate set: {output}")


if __name__ == "__main__":
    main()
