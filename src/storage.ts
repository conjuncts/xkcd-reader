import { ComicReadStatus } from "./types";

export class ReadTracker {
    private static readonly STORAGE_KEY = 'xkcd-read-status';
    private static readonly LAST_READ = 'xkcd-last-read';

    static getReadStatus(): Record<number, ComicReadStatus> {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
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
        localStorage.setItem(this.LAST_READ, comicId.toString());
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
        return parseInt(localStorage.getItem(this.LAST_READ) || '');
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