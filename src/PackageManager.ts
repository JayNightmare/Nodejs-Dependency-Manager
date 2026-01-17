import * as cp from "child_process";
import * as fs from "fs";
import * as path from "path";
import { Dependency } from "./types";

export class PackageManager {
    public async getDependencies(rootPath: string): Promise<Dependency[]> {
        const packageJsonPath = path.join(rootPath, "package.json");
        if (!fs.existsSync(packageJsonPath)) {
            throw new Error("package.json not found");
        }

        try {
            const packageJson = JSON.parse(
                fs.readFileSync(packageJsonPath, "utf-8"),
            );
            const dependencies: Dependency[] = [];

            if (packageJson.dependencies) {
                for (const [name, version] of Object.entries(
                    packageJson.dependencies,
                )) {
                    dependencies.push({
                        name,
                        version: version as string,
                        type: "dependency",
                    });
                }
            }
            if (packageJson.devDependencies) {
                for (const [name, version] of Object.entries(
                    packageJson.devDependencies,
                )) {
                    dependencies.push({
                        name,
                        version: version as string,
                        type: "devDependency",
                    });
                }
            }

            // Fetch info in parallel
            await Promise.all(
                dependencies.map(async (dep) => {
                    const info = await this.getPackageInfo(dep.name);
                    dep.latest = info.latest;
                    dep.versions = info.versions;
                }),
            );

            return dependencies;
        } catch (error) {
            throw new Error("Failed to parse package.json");
        }
    }

    private getPackageInfo(
        packageName: string,
    ): Promise<{ latest: string; versions: string[] }> {
        return new Promise((resolve) => {
            cp.exec(
                `npm view ${packageName} versions dist-tags --json`,
                { encoding: "utf8" },
                (err, stdout) => {
                    if (err) {
                        resolve({ latest: "Unknown", versions: [] });
                    } else {
                        try {
                            const data = JSON.parse(stdout);
                            let versions = [];
                            let latest = "Unknown";

                            if (Array.isArray(data)) {
                                versions = data;
                            } else {
                                versions = data.versions || [];
                                if (
                                    data["dist-tags"] &&
                                    data["dist-tags"].latest
                                ) {
                                    latest = data["dist-tags"].latest;
                                }
                            }

                            if (latest === "Unknown" && versions.length > 0) {
                                const stableVersions = versions.filter(
                                    (v: string) => !v.includes("-"),
                                );
                                latest =
                                    stableVersions.length > 0
                                        ? stableVersions[
                                              stableVersions.length - 1
                                          ]
                                        : versions[versions.length - 1];
                            }

                            const recentVersions = versions
                                .slice(-100)
                                .reverse();
                            resolve({ latest, versions: recentVersions });
                        } catch (e) {
                            resolve({ latest: "Unknown", versions: [] });
                        }
                    }
                },
            );
        });
    }

    public search(query: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            cp.exec(
                `npm search ${query} --json`,
                { encoding: "utf8" },
                (err, stdout) => {
                    if (err) {
                        reject(new Error("Search failed"));
                    } else {
                        try {
                            const results = JSON.parse(stdout);
                            resolve(
                                results.map((r: any) => ({
                                    name: r.name,
                                    version: r.version,
                                    description: r.description,
                                })),
                            );
                        } catch (e) {
                            reject(new Error("Failed to parse search results"));
                        }
                    }
                },
            );
        });
    }
}
