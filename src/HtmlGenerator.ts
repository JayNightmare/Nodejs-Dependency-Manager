import * as vscode from "vscode";

export class HtmlGenerator {
    public static generate(
        webview: vscode.Webview,
        extensionUri: vscode.Uri,
    ): string {
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Node Dependencies</title>
                <style>
                    body { font-family: var(--vscode-font-family); padding: 10px; color: var(--vscode-foreground); background-color: var(--vscode-editor-background); }
                    .tabs { display: flex; border-bottom: 1px solid var(--vscode-panel-border); margin-bottom: 10px; cursor: pointer; }
                    .tab { padding: 5px 10px; margin-right: 5px; opacity: 0.6; border-bottom: 2px solid transparent; }
                    .tab.active { opacity: 1; border-bottom: 2px solid var(--vscode-activityBar-activeBorder); font-weight: bold; }
                    .tab-content { display: none; }
                    .tab-content.active { display: block; }
                    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                    .search-bar { width: 100%; padding: 8px; margin-bottom: 10px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); box-sizing: border-box; }
                    .section-title { font-weight: bold; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase; font-size: 0.8em; opacity: 0.8; }
                    .dependency-item { display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid var(--vscode-panel-border); }
                    .dependency-item:hover { background-color: var(--vscode-list-hoverBackground); }
                    .dep-info { display: flex; align-items: center; gap: 10px; }
                    .dep-details { display: flex; flex-direction: column; }
                    .dep-name { font-weight: bold; font-size: 1em; }
                    .dep-version { font-size: 0.85em; opacity: 0.8; margin-top: 2px; }
                    .dep-version:hover { cursor: pointer; text-decoration: underline; }
                    .dep-desc { font-size: 0.8em; opacity: 0.6; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
                    .controls { display: flex; gap: 5px; align-items: center; }
                    .version-select { background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border); padding: 2px 5px; max-width: 100px; }
                    .update-btn, .install-btn { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 4px 8px; cursor: pointer; border-radius: 2px; font-size: 0.85em; }
                    .update-btn:hover, .install-btn:hover { background: var(--vscode-button-hoverBackground); }
                    .toolbar { display: flex; gap: 5px; margin-bottom: 10px; }
                    .toolbar button { flex: 1; }
                    .hidden { display: none; }
                    input[type="checkbox"] { transform: scale(1.2); cursor: pointer; }
                </style>
            </head>
            <body>
                <div class="tabs">
                    <div class="tab active" data-tab="installed">Installed</div>
                    <div class="tab" data-tab="browse">Browse</div>
                </div>

                <!-- Installed Tab -->
                <div id="installed" class="tab-content active">
                    <div class="search-container">
                        <input type="text" id="filter-input" class="search-bar" placeholder="Filter installed...">
                    </div>
                    <div class="toolbar">
                        <button id="sync-btn" class="update-btn">Sync</button>
                        <button id="bulk-update-btn" class="update-btn hidden">Update All</button>
                    </div>
                    <div id="loading" class="hidden" style="text-align: center; margin-top: 10px; color: var(--vscode-descriptionForeground);">Checking for updates...</div>
                    <div id="dependencies-list"></div>
                </div>

                <!-- Browse Tab -->
                <div id="browse" class="tab-content">
                     <div class="search-container">
                        <input type="text" id="search-input" class="search-bar" placeholder="Search npm registry...">
                    </div>
                    <div id="search-loading" class="hidden" style="text-align: center; margin-top: 10px;">Searching...</div>
                    <div id="search-results"></div>
                </div>

                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    
                    document.querySelectorAll('.tab').forEach(tab => {
                        tab.addEventListener('click', () => {
                            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                            tab.classList.add('active');
                            document.getElementById(tab.dataset.tab).classList.add('active');
                        });
                    });

                    const listContainer = document.getElementById('dependencies-list');
                    const filterInput = document.getElementById('filter-input');
                    const syncBtn = document.getElementById('sync-btn');
                    const bulkUpdateBtn = document.getElementById('bulk-update-btn');
                    const loadingIndicator = document.getElementById('loading');
                    let allDependencies = [];

                    syncBtn.addEventListener('click', () => {
                        vscode.postMessage({ type: 'refresh' });
                    });

                    bulkUpdateBtn.addEventListener('click', () => {
                        const checked = document.querySelectorAll('.dep-checkbox:checked');
                        let updates = [];
                        
                        if (checked.length > 0) {
                            updates = Array.from(checked).map(cb => {
                                const name = cb.getAttribute('data-name');
                                const versionSelect = document.getElementById(\`select-\${name}\`);
                                return { name, version: versionSelect.value };
                            });
                        } else {
                            const outdated = allDependencies.filter(d => isDepOutdated(d));
                            updates = outdated.map(d => ({ name: d.name, version: d.latest || 'latest' }));
                        }
                        
                        if (updates.length > 0) vscode.postMessage({ type: 'bulkUpdate', updates });
                    });

                    filterInput.addEventListener('input', (e) => {
                        renderDependencies(allDependencies, e.target.value);
                    });

                    const searchInput = document.getElementById('search-input');
                    const searchResultsContainer = document.getElementById('search-results');
                    const searchLoading = document.getElementById('search-loading');
                    let searchTimeout;

                    searchInput.addEventListener('input', (e) => {
                        clearTimeout(searchTimeout);
                        const query = e.target.value;
                        if (query.length < 2) return;
                        
                        searchLoading.classList.remove('hidden');
                        searchResultsContainer.innerHTML = '';
                        
                        searchTimeout = setTimeout(() => {
                             vscode.postMessage({ type: 'search', query });
                        }, 500);
                    });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'startLoading':
                                loadingIndicator.classList.remove('hidden');
                                listContainer.innerHTML = '';
                                break;
                            case 'showDependencies':
                                loadingIndicator.classList.add('hidden');
                                allDependencies = message.dependencies;
                                renderDependencies(allDependencies, filterInput.value);
                                updateBulkButton();
                                break;
                            case 'searchResults':
                                searchLoading.classList.add('hidden');
                                renderSearchResults(message.results);
                                break;
                            case 'error':
                                loadingIndicator.classList.add('hidden');
                                searchLoading.classList.add('hidden');
                                vscode.postMessage({ type: 'onError', value: message.value });
                                break;
                        }
                    });

                    function isDepOutdated(dep) {
                        const currentVer = dep.version.replace(/[^0-9.]/g, '');
                        // Check if latest is valid and not Unknown, and check if different
                        if (!dep.latest || dep.latest === 'Unknown') return false;
                        
                        // If current version is same as latest, not outdated
                        if (currentVer === dep.latest) return false;

                        // Further check: ensure we are not "downgrading" or confused by prereleases if possible?
                        // For now, strict inequality is enough if we trust 'latest' logic
                        return true;
                    }

                    function renderDependencies(dependencies, filter = '') {
                        listContainer.innerHTML = '';
                        const filtered = dependencies.filter(d => d.name.toLowerCase().includes(filter.toLowerCase()));
                        
                        const normalDeps = filtered.filter(d => d.type === 'dependency');
                        const devDeps = filtered.filter(d => d.type === 'devDependency');

                        if (normalDeps.length > 0) appendSection('Dependencies', normalDeps);
                        if (devDeps.length > 0) appendSection('Dev Dependencies', devDeps);

                        if (dependencies.length > 0 && filtered.length === 0) {
                             listContainer.innerHTML = '<div style="text-align:center; padding: 20px; opacity: 0.7;">No matching dependencies found</div>';
                        }
                    }

                    function appendSection(title, deps) {
                        const titleEl = document.createElement('div');
                        titleEl.className = 'section-title';
                        titleEl.textContent = title;
                        listContainer.appendChild(titleEl);

                        deps.forEach(dep => {
                            const item = document.createElement('div');
                            item.className = 'dependency-item';
                            
                            const isOutdated = isDepOutdated(dep);
                            
                            const checkboxHtml = isOutdated ? \`<input type="checkbox" class="dep-checkbox" data-name="\${dep.name}">\` : '';
                            
                            const currentVer = dep.version.replace(/[^0-9.]/g, '');
                            const selectClass = isOutdated ? 'version-select' : 'version-select hidden';
                            const updateBtnClass = isOutdated ? 'update-btn' : 'update-btn hidden';
                            const upToDateClass = isOutdated ? 'hidden' : '';

                            let versionSelectHtml = '';
                            if (dep.versions && dep.versions.length > 0) {
                                versionSelectHtml = \`<select id="select-\${dep.name}" class="\${selectClass}" data-current="\${currentVer}">\`;
                                dep.versions.forEach(v => {
                                    versionSelectHtml += \`<option value="\${v}" \${v === dep.latest ? 'selected' : ''}>\${v}\</option>\`;
                                });
                                versionSelectHtml += '</select>';
                            }

                            const updateButtonHtml = \`<button id="btn-\${dep.name}" class="\${updateBtnClass}" data-name="\${dep.name}">Update</button>\`;
                            const upToDateHtml = \`<span id="msg-\${dep.name}" style="font-size: 0.8em; opacity: 0.5;" class="\${upToDateClass}">Up to date</span>\`;

                            item.innerHTML = \`
                                <div class="dep-info">
                                    \${checkboxHtml}
                                    <div class="dep-details">
                                        <span class="dep-name">\${dep.name}</span>
                                        <span class="dep-version" data-name="\${dep.name}">\${dep.version} \${dep.latest && dep.latest !== 'Unknown' ? '→ ' : ''} \${dep.latest || '?'}</span>
                                    </div>
                                </div>
                                <div class="controls">
                                    \${versionSelectHtml}
                                    \${updateButtonHtml}
                                    \${upToDateHtml}
                                </div>
                            \`;
                            listContainer.appendChild(item);
                        });
                    }

                    function renderSearchResults(results) {
                        searchResultsContainer.innerHTML = '';
                        results.forEach(res => {
                            const item = document.createElement('div');
                            item.className = 'dependency-item';
                            
                            const isInstalled = allDependencies.some(d => d.name === res.name);
                            const actionHtml = isInstalled 
                                ? '<span style="font-size: 0.8em; opacity: 0.7; margin-right: 10px;">Installed</span>' 
                                : `<button class="install-btn" data-name="${res.name}">Install</button>`;

                            item.innerHTML = \`
                                <div class="dep-info">
                                    <div class="dep-details">
                                        <span class="dep-name">\${res.name}</span>
                                        <span class="dep-version">\${res.version}</span>
                                        <span class="dep-desc">\${res.description || ''}</span>
                                    </div>
                                </div>
                                \${actionHtml}
                            \`;
                            searchResultsContainer.appendChild(item);
                        });
                        if (results.length === 0) {
                            searchResultsContainer.innerHTML = '<div style="text-align:center; padding: 20px; opacity: 0.7;">No results found</div>';
                        }
                    }

                    function updateDep(name) {
                        const versionSelect = document.getElementById(\`select-\${name}\`);
                        const version = versionSelect ? versionSelect.value : 'latest';
                        vscode.postMessage({ type: 'update', name: name, version: version });
                    }

                    function installDep(name) {
                        vscode.postMessage({ type: 'install', name: name });
                    }

                    document.addEventListener('click', (e) => {
                        if (e.target.classList.contains('update-btn')) {
                            const name = e.target.getAttribute('data-name');
                            if (name) updateDep(name);
                        } else if (e.target.classList.contains('install-btn')) {
                            const name = e.target.getAttribute('data-name');
                            if (name) installDep(name);
                        }
                    });

                    document.addEventListener('change', (e) => {
                        if (e.target.classList.contains('dep-checkbox')) {
                            updateBulkButton();
                        } else if (e.target.classList.contains('version-select')) {
                            const select = e.target;
                            const name = select.id.replace('select-', '');
                            const currentVer = select.getAttribute('data-current');
                            const btn = document.getElementById(\`btn-\${name}\`);
                            const msg = document.getElementById(\`msg-\${name}\`);
                            
                            if (select.value !== currentVer) {
                                if (btn) btn.classList.remove('hidden');
                                if (msg) msg.classList.add('hidden');
                            } else {
                                if (btn) btn.classList.add('hidden');
                                if (msg) msg.classList.remove('hidden');
                            }
                        }
                    });

                    document.addEventListener('dblclick', (e) => {
                        if (e.target.classList.contains('dep-version')) {
                            const name = e.target.getAttribute('data-name');
                            const select = document.getElementById(\`select-\${name}\`);
                            if (select) {
                                select.classList.remove('hidden');
                                // Optionally hide the up-to-date message to avoid clutter, though change handler manages it too.
                                const msg = document.getElementById(\`msg-\${name}\`);
                                if (msg) msg.classList.add('hidden');
                            }
                        }
                    });

                    window.updateBulkButton = () => {
                        const checked = document.querySelectorAll('.dep-checkbox:checked');
                        const bulkBtn = document.getElementById('bulk-update-btn');
                        const outdated = allDependencies.filter(d => isDepOutdated(d));

                        if (outdated.length > 0) {
                            bulkBtn.classList.remove('hidden');
                            if (checked.length > 0) {
                                bulkBtn.textContent = \`Update \${checked.length} Selected\`;
                            } else {
                                bulkBtn.textContent = 'Update All';
                            }
                        } else {
                            bulkBtn.classList.add('hidden');
                        }
                    };
                </script>
            </body>
            </html>`;
    }

    private static getNonce() {
        let text = "";
        const possible =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(
                Math.floor(Math.random() * possible.length),
            );
        }
        return text;
    }
}
