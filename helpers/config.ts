function need(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Variable manquante : ${name}`);
    return v;
}

export const BASE_URL = need('BASE_URL');
export const EMAIL = need('TEST_EMAIL');
export const PASSWORD = need('TEST_PASSWORD');