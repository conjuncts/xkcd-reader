export interface ComicReadStatus {
    firstRead: string;
    lastRead: string;
}

export interface AuxiliaryData {
    readLast: number;
    incognitoLast: boolean;
}

export interface ComicData {
    num: number;
    // title: string;
    safe_title: string; // Safe title for display
    img: string;
    alt: string;
    isInteractive?: boolean;
    link?: string;  // Link if present
    news?: string;  // News if present
    year?: number;
    month?: number;
    day?: number;
    trusted?: boolean;  // Whether this data came from our trusted cache
}
