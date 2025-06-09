import { ComicReadStatus } from "./types";

export class ReadTracker {
    private static readonly STORAGE_KEY = 'xkcd-read-status';
    private static readonly AUX_DATA = 'xkcd-session-status';

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

    static getIncognitoStatus(): boolean {
        const aux = this.getAuxData();
        console.log(aux);
        return aux['incognitoLast'] ?? true;
    }

    static saveIncognitoStatus(incognito: boolean): void {
        console.log(incognito);
        const aux = this.getAuxData();
        aux['incognitoLast'] = incognito;
        localStorage.setItem(this.AUX_DATA, JSON.stringify(aux));
    }

    static exportToCsv(): string {
        const status = this.getReadStatus();
        const rows = [['Comic ID', 'First Read', 'Last Read']];
        
        Object.entries(status).forEach(([id, dates]) => {
            rows.push([id, dates.firstRead, dates.lastRead]);
        });
        console.log(rows);

        const out = rows.map(row => row.join(',')).join('\n');
        console.log(out);
        return out;
    }

    static importFromCsv(csvContent: string): void {
        // Try to detect the separator by looking at the first line
        const firstLine = csvContent.split('\n')[0];
        const separator = firstLine.includes(',') ? ',' : '\t';
        
        const rows = csvContent.split('\n').map(row => row.split(separator));
        
        // Skip header row
        const dataRows = rows.slice(1);
        
        const status = this.getReadStatus();
        
        dataRows.forEach(row => {
            if (row.length === 3) {
                const [id, firstRead, lastRead] = row;
                const comicId = parseInt(id);
                if (!isNaN(comicId)) {
                    // If comic already exists, only update if the imported data is newer
                    if (status[comicId]) {
                        const existingLastRead = new Date(status[comicId].lastRead);
                        const importedLastRead = new Date(lastRead);
                        if (importedLastRead > existingLastRead) {
                            status[comicId] = {
                                firstRead: status[comicId].firstRead, // Keep original first read
                                lastRead: lastRead // Update with newer last read
                            };
                        }
                    } else {
                        // If comic doesn't exist, add it
                        status[comicId] = {
                            firstRead,
                            lastRead
                        };
                    }
                }
            }
        });
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(status));
    }

    static clearReadHistory(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}