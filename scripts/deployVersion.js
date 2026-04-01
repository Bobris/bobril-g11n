#!/usr/bin/env bun

const fs = require("fs");
const path = require("path");

const releaseType = process.argv[2];
const supportedReleaseTypes = new Set(["patch", "minor", "major"]);

if (!supportedReleaseTypes.has(releaseType)) {
    console.error("Usage: node scripts/deployVersion.js <patch|minor|major>");
    process.exit(1);
}

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, "package.json");
const changelogPath = path.join(rootDir, "CHANGELOG.md");

function readTextFile(filePath) {
    return fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
}

function writeTextFile(filePath, content) {
    fs.writeFileSync(filePath, content.endsWith("\n") ? content : content + "\n");
}

function bumpVersion(version, type) {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
    if (match == null) {
        throw new Error('Unsupported package.json version "' + version + '". Expected semver "x.y.z".');
    }

    let major = Number(match[1]);
    let minor = Number(match[2]);
    let patch = Number(match[3]);

    switch (type) {
        case "patch":
            patch++;
            break;
        case "minor":
            minor++;
            patch = 0;
            break;
        case "major":
            major++;
            minor = 0;
            patch = 0;
            break;
    }

    return major + "." + minor + "." + patch;
}

function updateChangelog(changelog, version) {
    const match = /^# CHANGELOG\n\n## Unreleased\n\n([\s\S]*?)(\n## [\s\S]*)?$/.exec(changelog);
    if (match == null) {
        throw new Error('CHANGELOG.md must start with "# CHANGELOG" followed by "## Unreleased".');
    }

    const unreleasedContent = match[1].trim();
    if (unreleasedContent.length === 0) {
        throw new Error('CHANGELOG.md section "## Unreleased" is empty.');
    }

    const rest = match[2] || "";
    let result = "# CHANGELOG\n\n## Unreleased\n\n## " + version + "\n\n" + unreleasedContent;
    if (rest.length !== 0) result += "\n" + rest;
    return result;
}

const packageJson = JSON.parse(readTextFile(packageJsonPath));
const currentVersion = packageJson.version;
const nextVersion = bumpVersion(currentVersion, releaseType);
const updatedChangelog = updateChangelog(readTextFile(changelogPath), nextVersion);

packageJson.version = nextVersion;
writeTextFile(packageJsonPath, JSON.stringify(packageJson, null, 4));
writeTextFile(changelogPath, updatedChangelog);

console.log("Version bumped from " + currentVersion + " to " + nextVersion + ".");
