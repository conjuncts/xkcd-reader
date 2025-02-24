import { ComicData } from "./types";

export async function fetchComic(id?: number): Promise<ComicData> {
    // do not use proxy
    const proxyUrl = 'https://corsproxy.io/?url='; // Example proxy

    const url = id 
        ? `https://xkcd.com/${id}/info.0.json`
        : 'https://xkcd.com/info.0.json';
    
    const response = await fetch(proxyUrl + url);
    return response.json();
}