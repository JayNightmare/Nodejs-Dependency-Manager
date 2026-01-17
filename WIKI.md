# Node Dependency Manager Wiki

Welcome to the Node Dependency Manager Wiki! This extension helps you manage your `npm` dependencies without leaving VS Code.

## Table of Contents

- [Node Dependency Manager Wiki](#node-dependency-manager-wiki)
    - [Table of Contents](#table-of-contents)
    - [1. Installation](#1-installation)
    - [2. Getting Started](#2-getting-started)
    - [3. Features](#3-features)
        - [Dependencies View](#dependencies-view)
        - [Browser \& Install](#browser--install)
        - [Advanced Version Management](#advanced-version-management)
            - [Updating Packages](#updating-packages)
            - [Selecting Specific Versions](#selecting-specific-versions)
    - [4. Troubleshooting](#4-troubleshooting)

---

## 1. Installation

This extension requires **Node.js** and **npm** to be installed on your system and available in your terminal's PATH.

## 2. Getting Started

Once installed:

1.  Open a folder in VS Code that contains a `package.json` file.
2.  Click on the **Node Dependencies** icon in the sidebar (or find it in the Explorer view depending on configuration).
3.  The extension will parse your `package.json` and fetch the latest version information from npm.

## 3. Features

### Dependencies View

The **Installed** tab lists all packages found in `dependencies` and `devDependencies`.

- **Status Indicators**:
    - **Up to date**: The installed version matches the latest stable version.
    - **Update Available**: The installed version is older than the latest stable version.

### Browser & Install

Switch to the **Browse** tab to search the npm registry.

- Enter a keyword (e.g., "express").
- Click **Install** next to a result to run `npm install <package>`.

### Advanced Version Management

#### Updating Packages

- **Single Update**: Click the **Update** button next to an outdated package.
- **Bulk Update**: Check the boxes next to multiple outdated packages and click **Update Selected** at the top.

#### Selecting Specific Versions

- If a package is outdated, a dropdown menu is visible. Select the desired version from the list.
- **For Up-to-Date Packages**:
    - **Double-click** the version number text (e.g., "1.2.3").
    - This reveals the version dropdown.
    - Select a new version.
    - Click the **Update** button (which appears after selection) to install that specific version.

## 4. Troubleshooting

**"No workspace folder open"**

- Ensure you have opened a folder (File > Open Folder) in VS Code.

**"package.json not found"**

- Ensure your project has a `package.json` file in the root of the workspace.

**"Search failed"**

- Check your internet connection.
- Ensure `npm` is accessible from the command line.
