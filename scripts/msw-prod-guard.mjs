import fs from "node:fs";
import path from "node:path";

export function assertProductionMswDisabled(mode, viteMsw) {
	if (mode === "production" && viteMsw === "true") {
		throw new Error(
			"VITE_MSW=true is not allowed in a production environment",
		);
	}
}

export function findMswLeaks(dir) {
	const hits = [];
	if (!fs.existsSync(dir)) return hits;

	function walk(current) {
		for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
			const full = path.join(current, entry.name);
			if (entry.isDirectory()) {
				walk(full);
				continue;
			}
			if (/msw|mockserviceworker/i.test(entry.name)) {
				hits.push(full);
				continue;
			}
			const text = fs.readFileSync(full);
			const sample = text.subarray(0, Math.min(text.length, 4_000_000)).toString("utf8");
			if (/msw|mockserviceworker/i.test(sample)) {
				hits.push(full);
			}
		}
	}

	walk(dir);
	return hits;
}

export function assertBundleHasNoMsw(dir) {
	const hits = findMswLeaks(dir);
	if (hits.length > 0) {
		throw new Error(
			`MSW leaked into the production bundle:\n${hits.join("\n")}`,
		);
	}
}
