import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Page } from '@playwright/test';

export async function dumpPage(page: Page, name: string) {
    const aria = await page.locator('body').ariaSnapshot();

    const elements = await page
        .locator('input, button, a, select, textarea, [role]')
        .evaluateAll(els =>
            els
                .filter(e => e.getClientRects().length > 0)
                .map(e => ({
                    tag: e.tagName.toLowerCase(),
                    host: (e.getRootNode() as ShadowRoot).host?.tagName.toLowerCase(),
                    parent: e.parentElement?.tagName.toLowerCase(),
                    id: e.id || undefined,
                    type: e.getAttribute('type') || undefined,
                    role: e.getAttribute('role') || undefined,
                    ariaLabel: e.getAttribute('aria-label') || undefined,
                    text: (e.textContent || '').trim().slice(0, 40) || undefined,
                }))
        );

    const outputDir = path.join(process.cwd(), 'helpers');

    fs.mkdirSync(outputDir, { recursive: true });

    fs.writeFileSync(path.join(outputDir, `${name}.yml`), aria);
    fs.writeFileSync(
        path.join(outputDir, `${name}.json`),
        JSON.stringify(elements, null, 2)
    );
}