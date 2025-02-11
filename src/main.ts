import { fetchComic } from './api';
import { ReadTracker } from './storage';
import type { ComicData } from './types';

class XKCDReader {
    private currentComic: ComicData | null = null;
    private latestComicId: number | null = null;
    private isIncognito: boolean = false;

    constructor() {
        this.initializeEventListeners();
        this.loadLastReadComic();
    }

    private async loadLastReadComic(): Promise<void> {
        const lastRead = ReadTracker.getLastRead();
        if (lastRead) {
            this.loadComic(lastRead);
        } else {
            this.loadLatestComic();
        }
    }

    private async loadLatestComic(): Promise<void> {
        const comic = await fetchComic();
        this.latestComicId = comic.num;
        this.displayComic(comic);
    }

    private async loadComic(id: number): Promise<void> {
        if (id < 1 || (this.latestComicId && id > this.latestComicId)) return;

        const comic = await fetchComic(id);
        this.displayComic(comic);
    }

    private displayComic(comic: ComicData): void {
        this.currentComic = comic;
        const readStatus = ReadTracker.getReadStatus()[comic.num];

        const comicDisplay = document.getElementById('comicDisplay')!;
        comicDisplay.className = readStatus ? 'previously-read' : '';

        // Clear existing content
        comicDisplay.textContent = '';

        // Create and append title
        const title = document.createElement('h2');
        title.textContent = `${comic.title} (#${comic.num})`;
        comicDisplay.appendChild(title);

        // Create and append image
        const img = document.createElement('img');
        img.src = comic.img;
        img.alt = comic.alt;
        img.title = comic.alt;
        img.className = 'comic-image';
        comicDisplay.appendChild(img);

        const readStatusElement = document.getElementById('readStatus')!;
        if (readStatus) {
            const lastRead = new Date(readStatus.lastRead).toLocaleDateString();
            readStatusElement.textContent =
                `First read: ${new Date(readStatus.firstRead).toLocaleDateString()} | 
               Last read: ${lastRead}`; // will be updated to current date
        }
        if (!this.isIncognito) {
            if (!readStatus) {
                readStatusElement.textContent = 'Just read';
                comicDisplay.className = 'just-read';
            }
            ReadTracker.markAsRead(comic.num);
        } else {
            if (!readStatus) {
                readStatusElement.textContent = 'Not read yet';
            }
        }
        

        // Update button states
        const prevButton = document.getElementById('prevButton') as HTMLButtonElement;
        const nextButton = document.getElementById('nextButton') as HTMLButtonElement;

        prevButton.disabled = comic.num <= 1;
        nextButton.disabled = this.latestComicId !== null && comic.num >= this.latestComicId;
    }

    private initializeEventListeners(): void {
        document.getElementById('prevButton')?.addEventListener('click', () => {
            if (this.currentComic) this.loadComic(this.currentComic.num - 1);
        });

        document.getElementById('nextButton')?.addEventListener('click', () => {
            if (this.currentComic) this.loadComic(this.currentComic.num + 1);
        });

        let markUnreadListener = () => {
            if (this.currentComic) {
                ReadTracker.markAsUnread(this.currentComic.num);
                // this.displayComic(this.currentComic);

                const readStatusElement = document.getElementById('readStatus')!;
                readStatusElement.textContent = 'Not read yet';
                const comicDisplay = document.getElementById('comicDisplay')!;
                comicDisplay.className = '';
            }
        };
        document.getElementById('unreadButton')?.addEventListener('click', markUnreadListener);

        let incognitoListener = () => {
            this.isIncognito = !this.isIncognito;
            // if (this.currentComic) {
            //     this.displayComic(this.currentComic);
            // }
            const incognitoButton = document.getElementById('incognitoButton') as HTMLButtonElement;
            if (this.isIncognito) {
                incognitoButton.classList.add('active');
            } else {
                incognitoButton.classList.remove('active');
            }
        };
        document.getElementById('incognitoButton')?.addEventListener('click', incognitoListener);

        document.getElementById('exportButton')?.addEventListener('click', () => {
            const tsv = ReadTracker.exportToTsv();
            const blob = new Blob([tsv], { type: 'text/tsv' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'xkcd-read-history.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        // keybinds
        document.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'ArrowLeft':
                    if (this.currentComic) this.loadComic(this.currentComic.num - 1);
                    break;
                case 'ArrowRight':
                    if (this.currentComic) this.loadComic(this.currentComic.num + 1);
                    break;
                case 'm':
                    markUnreadListener();
                    break;
                case 'i':
                    incognitoListener();
                    break;
            }
        });


    }
}

// Initialize the app
new XKCDReader();