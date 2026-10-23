#!/usr/bin/env python3
"""Publish complete unsigned candidates on the channel implied by their SemVer."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
from urllib.parse import quote

from release import ROOT, TARGETS, metadata_for, release_is_prerelease, require, verify_package


def gh(*args, check=True):
    return subprocess.run(["gh", *map(str, args)], text=True, capture_output=True,
                          timeout=120, check=check)


def lookup(repository, tag):
    result = gh("api", f"repos/{repository}/releases/tags/{quote(tag, safe='')}", check=False)
    if result.returncode:
        if re.search(r"\(HTTP 404\)\s*$", result.stderr):
            return None
        raise RuntimeError("Release lookup failed: " + result.stderr)
    return json.loads(result.stdout)


def validate_remote(remote, tag, prerelease):
    require(remote is not None and remote.get("tag_name") == tag, "Release tag mismatch")
    require(remote.get("prerelease") is prerelease, "Release prerelease channel mismatch")
    require(remote.get("draft") is False, "Existing draft requires explicit recovery before publication")


def publish(root, tag, repository="caichangqing1120/dbx-plugin-apollo"):
    require(re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repository), "Invalid repository")
    manifest = json.loads((root / "manifest.json").read_text())
    version = manifest["version"]
    prerelease = release_is_prerelease(version)
    require(tag == "v" + version, "Release tag must match manifest version")
    directory = root / "dist" / ("release-" + tag)
    notes = root / "docs" / ("release-notes-" + tag + ".md")
    require(notes.is_file(), "Missing reviewed release notes")
    packages = sorted(directory.glob("*.dbxp"))
    reports = [verify_package(path, root) for path in packages]
    require(sorted(row["target"] for row in reports) == sorted(TARGETS), "Incomplete release package target set")
    metadata = [path.with_suffix(".artifact.json") for path in packages]
    index = directory / "release-candidates.json"
    sums = directory / ("SHA256SUMS-" + tag + ".txt")
    proof = directory / "package-verification.json"
    assets = [*packages, *metadata, index, sums, proof]
    require(all(path.is_file() and not path.is_symlink() for path in assets), "Missing or symlink release asset")
    aggregate = json.loads(index.read_text())
    expected_identity = {key: manifest[key] for key in ("id", "name", "version", "publisher", "description", "permissions")}
    require(aggregate.get("plugin") == expected_identity, "Release aggregate identity mismatch")
    expected_artifacts = sorted((metadata_for(path, row["target"]) for path, row in zip(packages, reports)), key=lambda row: row["target"])
    require(sorted(aggregate.get("artifacts", []), key=lambda row: row["target"]) == expected_artifacts,
            "Release aggregate bytes mismatch")
    expected_sums = {row["url"]: row["sha256"] for row in expected_artifacts}
    require(dict((name, sha) for sha, name in (line.split() for line in sums.read_text().splitlines())) == expected_sums,
            "Release checksum list mismatch")
    published_proof = json.loads(proof.read_text()).get("packages", [])
    keys = ("target", "url", "sha256", "size", "nativeUISHA256", "nativeSourceSHA256")
    require(sorted([{key: row[key] for key in keys} for row in published_proof], key=lambda row: row["target"]) ==
            sorted([{key: row[key] for key in keys} for row in reports], key=lambda row: row["target"]),
            "Release verification proof mismatch")

    remote = lookup(repository, tag)
    existing = remote is not None
    if existing:
        validate_remote(remote, tag, prerelease)
    names = {asset["name"] for asset in (remote or {}).get("assets", [])}
    require(not existing or {path.name for path in assets}.issubset(names),
            "Incomplete published release requires explicit recovery; refusing implicit uploads")
    # Preflight every existing asset before adding any bytes to an existing release.
    with tempfile.TemporaryDirectory(prefix="apollo-publish-verify-") as temporary:
        for path in assets:
            if path.name in names:
                gh("release", "download", tag, "--repo", repository, "--pattern", path.name, "--dir", temporary)
                require(path.read_bytes() == (Path(temporary) / path.name).read_bytes(),
                        "Refusing to replace immutable published bytes: " + path.name)
    if not existing:
        args = ["release", "create", tag, "--repo", repository, "--verify-tag", "--draft",
                "--title", "Apollo Portal Console " + version + (" Preview" if prerelease else ""), "--notes-file", notes]
        if prerelease:
            args.append("--prerelease")
        gh(*args)
        for path in assets:
            gh("release", "upload", tag, path, "--repo", repository)
        # Stable discovery must never see a half-uploaded candidate set.
        gh("release", "edit", tag, "--repo", repository, "--draft=false",
           "--prerelease=" + str(prerelease).lower(), "--latest=" + str(not prerelease).lower())
    validate_remote(lookup(repository, tag), tag, prerelease)
    print(f"Published {tag}: prerelease={prerelease}; {len(assets)} immutable unsigned assets verified")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tag", required=True)
    parser.add_argument("--repository", default=os.environ.get("GITHUB_REPOSITORY", "caichangqing1120/dbx-plugin-apollo"))
    args = parser.parse_args()
    publish(ROOT, args.tag, args.repository)
