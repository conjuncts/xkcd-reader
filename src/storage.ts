import { ComicReadStatus } from "./types";

export class ReadTracker {
    private static readonly STORAGE_KEY = 'xkcd-read-status';
    private static readonly AUX_DATA = 'xkcd-session-data';

    static getReadStatus(): Record<number, ComicReadStatus> {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    }

    static getAuxData(): Record<string, any> {
        const stored = localStorage.getItem(this.AUX_DATA);
        try {
            const aux = stored ? JSON.parse(stored) : {};
            // is dict?
            if (typeof aux !== 'object') {
                return {};
            }
            return aux;
        } catch (e) {
            return {};
        }
    }

    static markAsRead(comicId: number): void {
        const status = this.getReadStatus();
        const now = new Date().toISOString();
        
        if (!status[comicId]) {
            status[comicId] = {
                firstRead: now,
                lastRead: now
            };
        } else {
            status[comicId].lastRead = now;
        }
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(status));

        var aux = this.getAuxData();
        aux['readLast'] = comicId.toString();

        localStorage.setItem(this.AUX_DATA, JSON.stringify(aux));
    }

    static markAsUnread(comicId: number): void {
        const status = this.getReadStatus();
        if (status[comicId] !== undefined) {
            // if (status[comicId].firstRead === status[comicId].lastRead) { // Reset both if only read once
            delete status[comicId];
            // } else {
            //     status[comicId].lastRead = status[comicId].firstRead; // Reset last read
            // }
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(status));
    }

    static getLastRead(): number | null {
        // return parseInt(localStorage.getItem(this.LAST_READ) || '');
        const aux = this.getAuxData();
        return parseInt(aux.get('readLast') || '');
    }

    static getIncognitoStatus(): boolean {
        const aux = this.getAuxData();
        console.log(aux);
        return aux['incognitoLast'] ?? false;
    }

    static saveIncognitoStatus(incognito: boolean): void {
        console.log(incognito);
        const aux = this.getAuxData();
        aux['incognitoLast'] = incognito;
        localStorage.setItem(this.AUX_DATA, JSON.stringify(aux));
    }

    static exportToTsv(): string {
        const status = this.getReadStatus();
        const rows = [['Comic ID', 'First Read', 'Last Read']];
        
        Object.entries(status).forEach(([id, dates]) => {
            rows.push([id, dates.firstRead, dates.lastRead]);
        });
        console.log(rows);

        const out = rows.map(row => row.join('\t')).join('\n');
        console.log(out);
        return out;
    }
}