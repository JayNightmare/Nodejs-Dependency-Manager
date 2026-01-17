export interface Dependency {
    name: string;
    version: string;
    latest?: string;
    versions?: string[];
    type: "dependency" | "devDependency";
}
