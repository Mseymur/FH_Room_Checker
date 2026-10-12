#!/usr/bin/env python3
"""Scan an explicit public-source allowlist and export a clean, history-free folder and ZIP."""
import argparse
import re
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROOT_FILES = {"README.md", "LICENSE", "SECURITY.md", "THIRD_PARTY_NOTICES.md", ".gitignore", ".gitattributes"}
FRONTEND_FILES = {"package.json", "package-lock.json", "tsconfig.json", "next.config.ts",
                  "postcss.config.mjs", "eslint.config.mjs", "vitest.config.ts", "components.json",
                  "campus.config.json", ".env.example", "README.md", "DESIGN.md", "AGENTS.md",
                  "examples/schedule.example.json", "scripts/verify.mjs"}
DOC_FILES = {"SETUP.md", "ADAPTERS.md", "ADAPT_WITH_AI.md"}
SOURCE_DIRS = {"app", "components", "hooks", "lib"}
EXTENSIONS = {".ts", ".tsx", ".css", ".json", ".mjs", ".svg"}
PATTERNS = {
    "private key": re.compile(r"-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----"),
    "access token": re.compile(r"\b(?:sb_secret_|sbp_|gh[pousr]_|github_pat_|glpat-|sk_(?:live|test)_|sk-(?:proj-|ant-)?"
                               r"|rk_live_|npm_|xox[abposr]-|AKIA|AIza)[A-Za-z0-9_-]{12,}"),
    "JWT": re.compile(r"\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"),
    "credential in URL": re.compile(r"https?://[^\s/'\"]+:[^\s/@'\"]+@"),
    "private machine path": re.compile(r"(?:/Users/|/home/)[A-Za-z0-9_.-]+/|[A-Z]:\\Users\\"),
    "private network address": re.compile(r"\b(?:192\.168|10\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b"),
    "analytics identifier": re.compile(r"\b(?:G-[A-Z0-9]{8,12}|UA-\d{4,10}-\d{1,4}|GTM-[A-Z0-9]{6,8})\b"),
    "deployment identifier": re.compile(r"[a-z]{20}\.supabase\.co|project_ref=[a-z0-9]{12,}|https://(?!fh-room-checker\.vercel\.app)[a-z0-9-]+\.vercel\.app"),  # the public demo URL is intentional
    "contact address": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
}


def public_files():
    candidates = [ROOT / name for name in ROOT_FILES]
    candidates += [ROOT / "docs" / name for name in DOC_FILES]
    candidates += [ROOT / ".github" / "workflows" / "ci.yml", ROOT / ".github" / "dependabot.yml"]
    candidates += [ROOT / "scripts" / "release.py"]
    candidates += [ROOT / "frontend" / name for name in FRONTEND_FILES]
    if any(not path.is_file() for path in candidates):
        raise ValueError("A required public-source file is missing.")
    for directory in SOURCE_DIRS:
        folder = ROOT / "frontend" / directory
        if not folder.is_dir():
            raise ValueError("A required public-source directory is missing.")
        for path in folder.rglob("*"):
            relative = path.relative_to(folder)
            # Hidden files/directories and unexpected extensions never enter the package.
            if any(part.startswith(".") for part in relative.parts):
                continue
            if path.suffix in EXTENSIONS:
                candidates.append(path)
    result = []
    for path in sorted(set(candidates)):
        if path.is_symlink() or any(parent.is_symlink() for parent in path.parents if parent != ROOT.parent):
            raise ValueError("Symlinks are not accepted in release paths.")
        if path.is_file():
            result.append(path)
    return result


def tracked_files():
    """In a Git checkout every tracked file gets published, so scan those too, not just the allowlist."""
    if not (ROOT / ".git").exists():
        return []
    output = subprocess.run(["git", "ls-files", "-z"], cwd=ROOT, check=True, capture_output=True).stdout
    paths = [ROOT / name for name in output.decode("utf-8").split("\0") if name]
    return [path for path in paths if path.is_file() and not path.is_symlink()]


PLACEHOLDER = "replace-with-your-server-only-bearer-token"
ENV_ASSIGNMENT = re.compile(r"^\s*(?:#\s*)?(?:export\s+)?[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_?KEY)[A-Z0-9_]*\s*=\s*[\"']?([^\s\"']+)")
QUOTED_ASSIGNMENT = re.compile(r"(?i)\b[a-z0-9_]*(?:token|secret|password|api_?key)[a-z0-9_]*[\"']?\s*[:=]\s*[\"']([^\"'\s]{8,})[\"']")


def scan(files):
    findings = []
    for path in files:
        relative = path.relative_to(ROOT).as_posix()
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue  # Binary files are covered by the gitleaks step in CI.
        for line_number, line in enumerate(content.splitlines(), 1):
            for label, pattern in PATTERNS.items():
                if pattern.search(line):
                    findings.append(f"{relative}:{line_number}: {label} (value redacted)")
            for assignment in (ENV_ASSIGNMENT.search(line), QUOTED_ASSIGNMENT.search(line)):
                if assignment and assignment.group(1) != PLACEHOLDER:
                    findings.append(f"{relative}:{line_number}: credential assignment (value redacted)")
                    break
    return findings


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="scan the exact files that would be exported")
    parser.add_argument("--export", action="store_true", help="scan and write a clean source folder and ZIP")
    args = parser.parse_args()
    files = public_files()
    scanned = sorted(set(files) | set(tracked_files()))
    findings = scan(scanned)
    if findings:
        print("Release scan failed:\n" + "\n".join(findings))
        raise SystemExit(1)
    print(f"Scanned {len(scanned)} public-source files: no matching secret/private-data patterns.")
    if args.export:
        output = ROOT / ".release" / "campus-room-finder-source.zip"
        folder = output.parent / "campus-room-finder"
        if output.parent.is_symlink() or output.is_symlink() or folder.is_symlink():
            raise ValueError("Release destinations cannot be symlinks.")
        output.parent.mkdir(exist_ok=True)
        if folder.exists():
            # Preserve edits made in a previously exported folder.
            if not output.exists():
                raise ValueError("An export folder already exists without its archive. Rename it before exporting.")
            if any(path.is_symlink() for path in folder.rglob("*")):
                raise ValueError("The exported folder contains symlinks. Preserve/rename it before exporting again.")
            with zipfile.ZipFile(output) as previous:
                original = {name.removeprefix("campus-room-finder/"): previous.read(name)
                            for name in previous.namelist()}
            current = {path.relative_to(folder).as_posix(): path.read_bytes()
                       for path in folder.rglob("*") if path.is_file()}
            if current != original:
                raise ValueError("The exported folder has edits or generated files. Preserve/rename it before exporting again.")
        with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for path in files:
                # Fixed metadata: no original filesystem paths, usernames or file timestamps.
                info = zipfile.ZipInfo("campus-room-finder/" + path.relative_to(ROOT).as_posix(), (2026, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o644 << 16
                archive.writestr(info, path.read_bytes())
        with zipfile.ZipFile(output) as archive:
            assert archive.testzip() is None
            assert len(archive.namelist()) == len(files)
            with tempfile.TemporaryDirectory(prefix="source-stage-", dir=output.parent) as stage:
                archive.extractall(stage) # Entries are the checked, fixed-prefix allowlist above.
                if folder.exists():
                    shutil.rmtree(folder)
                shutil.move(str(Path(stage) / "campus-room-finder"), folder)
        print("Exported .release/campus-room-finder-source.zip")
        print("Created clean folder .release/campus-room-finder")


if __name__ == "__main__":
    main()
