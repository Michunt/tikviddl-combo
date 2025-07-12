import psl from "@imput/psl";
import { strict as assert } from "node:assert";

import { env } from "../config.js";
import { services } from "./service-config-tiktok.js";
import { getRedirectingURL } from "../misc/utils.js";
import { friendlyServiceName } from "./service-alias.js";

function aliasURL(url) {
    assert(url instanceof URL);

    const host = psl.parse(url.hostname);
    const parts = url.pathname.split('/');

    // Only handle TikTok URL aliases
    switch (host.sld) {
        case "tiktok":
            // Handle TikTok short links and other variations
            break;
    }

    return url;
}

function cleanURL(url) {
    assert(url instanceof URL);
    const host = psl.parse(url.hostname).sld;

    let stripQuery = true;

    const limitQuery = (param) => {
        url.search = `?${param}=` + encodeURIComponent(url.searchParams.get(param));
        stripQuery = false;
    }

    switch (host) {
        case "tiktok":
            // Keep TikTok-specific query parameters if needed
            break;
    }

    if (stripQuery) {
        url.search = '';
    }

    url.username = url.password = url.port = url.hash = '';

    if (url.pathname.endsWith('/'))
        url.pathname = url.pathname.slice(0, -1);

    return url;
}

function getHostIfValid(url) {
    const host = psl.parse(url.hostname);
    if (host.error) return;

    const service = services[host.sld];
    if (!service) return;
    if ((service.tld ?? 'com') !== host.tld) return;

    const anySubdomainAllowed = service.subdomains === '*';
    const validSubdomain = [null, 'www', ...(service.subdomains ?? [])].includes(host.subdomain);
    if (!validSubdomain && !anySubdomainAllowed) return;

    return host.sld;
}

export function normalizeURL(url) {
    return cleanURL(
        aliasURL(
            new URL(url.replace(/^https\/\//, 'https://'))
        )
    );
}

export function extract(url) {
    if (!(url instanceof URL)) {
        url = new URL(url);
    }

    const host = getHostIfValid(url);

    if (!host) {
        return { error: "link.invalid" };
    }

    // Only allow TikTok
    if (host !== "tiktok") {
        return { error: "service.disabled" };
    }

    if (!env.enabledServices.has(host)) {
        return { error: "service.disabled" };
    }

    let patternMatch;
    for (const pattern of services[host].patterns) {
        patternMatch = pattern.match(
            url.pathname.substring(1) + url.search
        );

        if (patternMatch) {
            break;
        }
    }

    if (!patternMatch) {
        return {
            error: "link.unsupported",
            context: {
                service: friendlyServiceName(host),
            }
        };
    }

    return { host, patternMatch };
}

export async function resolveRedirectingURL(url, dispatcher, headers) {
    const originalService = getHostIfValid(normalizeURL(url));
    if (!originalService) return;

    const canonicalURL = await getRedirectingURL(url, dispatcher, headers);
    if (!canonicalURL) return;

    const { host, patternMatch } = extract(normalizeURL(canonicalURL));

    if (host === originalService) {
        return patternMatch;
    }
}
