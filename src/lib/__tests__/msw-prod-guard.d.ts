declare module "../../../scripts/msw-prod-guard.mjs" {
	export function assertProductionMswDisabled(
		mode: string,
		viteMsw: string | undefined,
	): void;
	export function assertBundleHasNoMsw(dir: string): void;
	export function findMswLeaks(dir: string): string[];
}
