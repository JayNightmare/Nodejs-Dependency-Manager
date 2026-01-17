# Node.js Dependency Manager

Manage your Node.js dependencies directly from VS Code. This extension provides a convenient sidebar view to explore, update, and install npm packages.

## Features

### Manage Installed Dependencies

- View all `dependencies` and `devDependencies` in your current project.
- Visual indicators for outdated packages.
- **Update**: One-click update for outdated packages.
- **Bulk Update**: Select multiple outdated packages and update them all at once.
- **Version Selection**: Choose a specific version to update to from a dropdown menu.
- **Force Update**: Double-click the version number of an "Up to date" module to unlock version selection and force an install of a different version.

### Browse & Install

- **Search npm**: Search for new packages from the npm registry directly within the extension.
- **Install**: Click "Install" to add a package to your project.

## Usage

1.  Open the **Node Dependencies** view in the sidebar.
2.  **Installed Tab**:
    - Review your current dependencies.
    - Use the checkboxes to select multiple packages for a bulk update.
    - Click "Update" on individual items.
    - Double-click a version number to change the version of any package.
3.  **Browse Tab**:
    - Type a query in the search bar.
    - Browse results and click "Install" to add a package.

## Requirements

- A project with a `package.json` file.
- `npm` installed and available in your terminal path.
