import { ComicData } from "./types";
import { isInteractiveComic } from "./special";

const CHUNK_SIZE = 500;
const CHUNK_CACHE: Record<number, ComicData[]> = {}; // { chunkStartId: ComicData[] }

// function getChunkPath(id: number): string {
//     const chunkStart = Math.floor(id / CHUNK_SIZE) * CHUNK_SIZE;
//     return `/data/chunks/xkcd_${chunkStart.toString()}.tsv`;
// }

async function loadChunk(chunkStart: number): Promise<ComicData[]> {
    if (CHUNK_CACHE[chunkStart]) {
        // console.log(`Cache hit for chunk starting at ${chunkStart}`);
        return CHUNK_CACHE[chunkStart];
    }

    const path = `/data/chunks/xkcd_${chunkStart.toString()}.tsv`;
    const res = await fetch(path);

    if (!res.ok) throw new Error(`Failed to load chunk for ID ${chunkStart}`);

    const text = await res.text();
    const [header, ...lines] = text.trim().split('\n');
    const keys = header.split('\t');

    const parsed = lines.map(line => {
        const values = line.split('\t');
        const comic: any = {};
        keys.forEach((k, i) => {
            comic[k] = values[i];
        });

        // make some corrections
        comic.img = 'https://imgs.xkcd.com/comics/' + comic.img;
        comic.num = parseInt(comic.num);
        comic.trusted = true;  // Mark as trusted since it's from our cache
        return comic as ComicData;
    });

    CHUNK_CACHE[chunkStart] = parsed;
    return parsed;
}

async function fetchFromCache(id: number): Promise<ComicData | null> {
    const chunkStart = Math.floor(id / CHUNK_SIZE) * CHUNK_SIZE;
    const comics = await loadChunk(chunkStart);
    return comics.find(c => c.num === id) ?? null;
}

export async function fetchComic(id?: number): Promise<ComicData> {
    if (id == 404) {
        // Special case for 404 comic
        return {
            num: 404,
            safe_title: "Not Found",
            isInteractive: true,
            img: '',
            alt: '',
            trusted: true  // Mark as trusted since it's a special case
        };
    }
    // 1. Latest comic fallback always via proxy
    if (id === undefined) {
        return fetchViaProxy();
    }

    // 2. Try cache
    try {
        const cached = await fetchFromCache(id);
        if (cached) {
            cached.isInteractive = isInteractiveComic(id);
            return cached;
        }
    } catch (error) {
        console.warn(`Cache fetch failed for ID ${id}:`, error);
    }

    // 3. Fallback to proxy
    return fetchViaProxy(id);
}

async function fetchViaProxy(id?: number): Promise<ComicData> {
    // const proxyUrl = 'https://corsproxy.io/?url=';
    const proxyUrl = 'https://api.readxkcd.com/';
    const url = id
        // ? `https://xkcd.com/${id}/info.0.json`
        // : `https://xkcd.com/info.0.json`;
        ? `${id}`
        : "latest";

    const response = await fetch(proxyUrl + url);
    const comic = await response.json();

    // Check if this is an interactive comic
    if (id) {
        comic.isInteractive = isInteractiveComic(id);
    }

    comic.trusted = false;  // Mark as untrusted since it's from the API
    return comic;
}
