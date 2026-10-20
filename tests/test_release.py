import importlib.util
import hashlib
import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest import mock
import zipfile


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("apollo_release", ROOT / "scripts/release.py")


def load_release():
    if not Path(SPEC.origin).is_file():
        raise AssertionError("Cross-target release packaging is not implemented")
    module = importlib.util.module_from_spec(SPEC)
    SPEC.loader.exec_module(module)
    return module


def executable(target):
    if target.startswith("darwin-"):
        cpu = 0x0100000C if target.endswith("arm64") else 0x01000007
        return bytes.fromhex("cffaedfe") + struct.pack("<I", cpu) + bytes(24)
    if target.startswith("linux-"):
        machine = 183 if target.endswith("arm64") else 62
        data = bytearray(64)
        data[:7] = b"\x7fELF\x02\x01\x01"
        struct.pack_into("<H", data, 18, machine)
        return bytes(data)
    data = bytearray(128)
    data[:2] = b"MZ"
    struct.pack_into("<I", data, 0x3C, 64)
    data[64:68] = b"PE\0\0"
    struct.pack_into("<H", data, 68, 0x8664)
    struct.pack_into("<H", data, 88, 0x20B)
    return bytes(data)


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.release = load_release()
        self.temp = tempfile.TemporaryDirectory(prefix="apollo-release-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for directory in ("assets", "ui", "src"):
            (self.root / directory).mkdir()
        self.manifest = json.loads((ROOT / "manifest.json").read_text())
        (self.root / "manifest.json").write_text(json.dumps(self.manifest))
        (self.root / "package.json").write_text(json.dumps({"version": "0.1.3-rc.1"}))
        (self.root / "assets/icon.png").write_bytes(b"controlled-test-icon")
        (self.root / "ui/index.html").write_bytes(b"<!doctype html><p>controlled UI</p>")
        (self.root / "src/app.js").write_bytes(b"// controlled test source\n")
        self.output = self.root / "dist/release-v0.1.3-rc.1"

    def package(self, target="darwin-arm64", data=None):
        binary = self.root / "compiled-sidecar"
        binary.write_bytes(executable(target) if data is None else data)
        return self.release.write_package(self.root, target, binary, self.output)

    def test_package_pins_all_bytes_and_native_target_without_mutating_source(self):
        before = (self.root / "manifest.json").read_bytes()
        artifact = self.package()
        report = self.release.verify_package(artifact, self.root)
        self.assertEqual(report["target"], "darwin-arm64")
        self.assertTrue(report["unsigned"])
        self.assertEqual(report["verifiedChecksumEntries"], 4)
        with zipfile.ZipFile(artifact) as archive:
            manifest = json.loads(archive.read("manifest.json"))
            binary = "bin/darwin-arm64/dbx-plugin-apollo"
            self.assertEqual(manifest["entrypoints"]["backend"]["executable"], binary)
            self.assertEqual(archive.getinfo(binary).external_attr >> 16 & 0o777, 0o755)
        self.assertEqual((self.root / "manifest.json").read_bytes(), before)

    def test_five_platform_packages_have_matching_actual_cpu_headers(self):
        for target in ("darwin-arm64", "darwin-x64", "windows-x64", "linux-x64", "linux-arm64"):
            with self.subTest(target=target):
                artifact = self.package(target)
                report = self.release.verify_package(artifact, self.root)
                self.assertEqual(report["target"], target)
                if target == "windows-x64":
                    with zipfile.ZipFile(artifact) as archive:
                        self.assertIn("bin/windows-x64/dbx-plugin-apollo.exe", archive.namelist())

    def test_mislabeled_architecture_is_rejected_before_packaging(self):
        for target, wrong in (("darwin-arm64", "darwin-x64"), ("linux-arm64", "linux-x64"), ("windows-x64", "darwin-x64")):
            with self.subTest(target=target):
                with self.assertRaisesRegex(ValueError, "architecture|executable|CPU"):
                    self.package(target, executable(wrong))

    def test_packaging_is_byte_reproducible(self):
        first = self.package().read_bytes()
        second = self.package().read_bytes()
        self.assertEqual(first, second)

    def test_symlinks_cannot_smuggle_unreviewed_files_into_packages(self):
        (self.root / "assets/leak").symlink_to(self.root / "package.json")
        with self.assertRaisesRegex(ValueError, "[Ss]ymlink"):
            self.package()

    def test_checksum_tampering_is_rejected(self):
        artifact = self.package()
        with zipfile.ZipFile(artifact) as archive:
            files = {name: archive.read(name) for name in archive.namelist()}
        files["assets/icon.png"] = b"modified bytes"
        with zipfile.ZipFile(artifact, "w") as archive:
            for name, data in files.items():
                archive.writestr(name, data)
        with self.assertRaisesRegex(ValueError, "[Cc]hecksum"):
            self.release.verify_package(artifact, self.root)

    def test_unsigned_candidates_reject_extra_archive_members(self):
        artifact = self.package()
        with zipfile.ZipFile(artifact, "a") as archive:
            archive.writestr("../private", b"unreviewed")
        with self.assertRaisesRegex(ValueError, "[Uu]nsafe|[Cc]hecksum"):
            self.release.verify_package(artifact, self.root)

    def test_release_metadata_uses_store_sync_plugin_and_artifacts_contract(self):
        paths = [self.package(target) for target in ("darwin-arm64", "windows-x64")]
        self.release.write_release_metadata(self.root, paths, self.output)
        release = json.loads((self.output / "release-candidates.json").read_text())
        self.assertEqual(release["plugin"]["id"], "io.github.caichangqing1120.apollo")
        self.assertEqual(release["plugin"]["version"], "0.1.3-rc.1")
        self.assertEqual(release["plugin"]["permissions"], ["host.storage"])
        self.assertEqual([a["target"] for a in release["artifacts"]], ["darwin-arm64", "windows-x64"])
        self.assertEqual(len((self.output / "SHA256SUMS-v0.1.3-rc.1.txt").read_text().splitlines()), 2)
        for artifact, path in zip(release["artifacts"], paths):
            self.assertEqual(artifact["url"], path.name)
            self.assertEqual(artifact["size"], path.stat().st_size)
            metadata = json.loads(path.with_suffix(".artifact.json").read_text())
            self.assertEqual(artifact, metadata)

    def test_release_metadata_rejects_changed_artifact_bytes(self):
        artifact = self.package()
        artifact.write_bytes(artifact.read_bytes() + b"unreviewed trailing payload")
        with self.assertRaisesRegex(ValueError, "metadata|[Hh]ash|size"):
            self.release.write_release_metadata(self.root, [artifact], self.output)

    def rewrite_backend(self, artifact, change):
        with zipfile.ZipFile(artifact) as archive:
            entries = [(info, archive.read(info.filename)) for info in archive.infolist()]
        manifest = json.loads(dict((info.filename, data) for info, data in entries)["manifest.json"])
        change(manifest["entrypoints"]["backend"])
        replacement = json.dumps(manifest).encode()
        with zipfile.ZipFile(artifact, "w") as archive:
            for info, data in entries:
                if info.filename == "manifest.json":
                    data = replacement
                elif info.filename == "checksums.json":
                    checksums = json.loads(data)
                    checksums["files"]["manifest.json"] = hashlib.sha256(replacement).hexdigest()
                    data = json.dumps(checksums).encode()
                archive.writestr(info, data)
        metadata = json.loads(artifact.with_suffix(".artifact.json").read_text())
        metadata["sha256"] = hashlib.sha256(artifact.read_bytes()).hexdigest()
        metadata["size"] = artifact.stat().st_size
        artifact.with_suffix(".artifact.json").write_text(json.dumps(metadata))

    def test_official_cli_can_omit_the_hosts_default_backend_protocol_fields(self):
        artifact = self.package()
        def omit_defaults(backend):
            backend.pop("protocol_versions")
            backend.pop("transport")
        self.rewrite_backend(artifact, omit_defaults)
        self.assertEqual(self.release.verify_package(artifact, self.root)["target"], "darwin-arm64")

    def test_nondefault_protocol_mismatch_still_rejects_reviewed_package(self):
        artifact = self.package()
        self.rewrite_backend(artifact, lambda backend: backend.update(transport="stdio-framed"))
        with self.assertRaisesRegex(ValueError, "manifest"):
            self.release.verify_package(artifact, self.root)

    def test_single_target_command_preserves_the_complete_release_index(self):
        paths = [self.package(target) for target in ("darwin-arm64", "windows-x64")]
        self.release.write_release_metadata(self.root, paths, self.output)
        before = (self.output / "release-candidates.json").read_bytes()
        def compile_native(command, **options):
            environment = options["env"]
            arch = "x64" if environment["GOARCH"] == "amd64" else environment["GOARCH"]
            Path(command[command.index("-o") + 1]).write_bytes(executable(environment["GOOS"] + "-" + arch))
        with mock.patch.object(self.release, "ROOT", self.root), \
             mock.patch("sys.argv", ["release.py", "--target", "darwin-arm64"]), \
             mock.patch.object(self.release.platform, "system", return_value="Linux"), \
             mock.patch.object(self.release.platform, "machine", return_value="x86_64"), \
             mock.patch.object(self.release.subprocess, "run", side_effect=compile_native), \
             mock.patch.object(self.release.subprocess, "check_output", return_value="go version controlled-compiler\n"):
            self.release.main()
        self.assertEqual((self.output / "release-candidates.json").read_bytes(), before)
        isolated = self.output / "darwin-arm64" / "io.github.caichangqing1120.apollo-0.1.3-rc.1-darwin-arm64.dbxp"
        self.assertTrue(isolated.is_file())
        self.assertEqual(self.release.verify_package(isolated, self.root)["target"], "darwin-arm64")

    def test_preview_packaging_rejects_versions_the_catalog_would_treat_as_stable(self):
        for version in ("0.1.3", "0.1.3+preview", "0.1.3-rc.01", "0.1.3-", "01.1.3-rc.1"):
            with self.subTest(version=version):
                self.manifest["version"] = version
                (self.root / "manifest.json").write_text(json.dumps(self.manifest))
                (self.root / "package.json").write_text(json.dumps({"version": version}))
                with self.assertRaisesRegex(ValueError, "prerelease|SemVer"):
                    self.package()

    def test_rc_suffix_survives_packaging_and_store_release_metadata(self):
        self.manifest["version"] = "0.1.3-rc.1"
        self.manifest["name"] = "Apollo Portal Console"
        (self.root / "manifest.json").write_text(json.dumps(self.manifest))
        (self.root / "package.json").write_text(json.dumps({"version": "0.1.3-rc.1"}))
        artifact = self.package()
        self.assertEqual(artifact.name, "io.github.caichangqing1120.apollo-0.1.3-rc.1-darwin-arm64.dbxp")
        self.release.write_release_metadata(self.root, [artifact], self.output)
        release = json.loads((self.output / "release-candidates.json").read_text())
        self.assertEqual(release["plugin"]["version"], "0.1.3-rc.1")
        self.assertEqual(release["plugin"]["name"], "Apollo Portal Console")
        self.assertEqual(self.release.verify_package(artifact, self.root)["target"], "darwin-arm64")


if __name__ == "__main__":
    unittest.main()
