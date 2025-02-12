import { fetchComic } from './api';
import { ReadTracker } from './storage';
import { ComicData, ComicReadStatus } from './types';

class XKCDReader {
    private currentComic: ComicData | null = null;
    private latestComicId: number | null = null;
    private isIncognito: boolean = true;

    constructor() {
        this.isIncognito = ReadTracker.getIncognitoStatus();
        this._rerenderIncognito();
        console.log('Incognito:', this.isIncognito);
        
        this.initializeEventListeners();
        this.initializeFromUrl();
        window.addEventListener('popstate', () => this.handleUrlChange());
    }

    
    private async initializeFromUrl(): Promise<void> {
        const comicId = this.getComicIdFromUrl();
        if (comicId) {
            await this.loadComic(comicId);
        } else {
            await this.loadLatestComic();
        }
    }

    private getComicIdFromUrl(): number | null {
        const path = window.location.pathname;
        const match = path.match(/^\/(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
    }

    private async handleUrlChange(): Promise<void> {
        const comicId = this.getComicIdFromUrl();
        if (comicId) {
            await this.loadComic(comicId);
        } else {
            await this.loadLatestComic();
        }
    }

    private updateUrl(comicId: number): void {
        const newUrl = `/${comicId}`;
        window.history.pushState({}, '', newUrl);
    }

    // private async loadLastReadComic(): Promise<void> {
    //     const lastRead = ReadTracker.getLastRead();
    //     if (lastRead) {
    //         this.loadComic(lastRead);
    //     } else {
    //         this.loadLatestComic();
    //     }
    // }

    private async loadLatestComic(): Promise<void> {
        const comic = await fetchComic();
        this.latestComicId = comic.num;
        this.displayComic(comic);
        this.updateUrl(comic.num);
    }

    private async loadComic(id: number): Promise<void> {
        if (id < 1 || (this.latestComicId && id > this.latestComicId)) return;
        try {
            const comic = await fetchComic(id);
            this.displayComic(comic);
            this.updateUrl(id);
        } catch (error) {
            // could be the latest comic
            console.log(error);
            if (id != 404) { // 404 is a special comic
                this.latestComicId = this.latestComicId ?? id - 1;
                this.updateNextButton(true);
            }

        }
    }



    private updateNextButton(shouldBeDisabled: boolean): void {
        const nextButton = document.getElementById('nextButton') as HTMLButtonElement;
        nextButton.disabled = shouldBeDisabled;
    }

    private markRead(comicNum: number, previouslyRead?: ComicReadStatus): void { // mark a comic read in non-incognito mode
        if (previouslyRead === undefined) {
            previouslyRead = ReadTracker.getReadStatus()[comicNum];
        }

        if (!previouslyRead) {
            const readStatusElement = document.getElementById('readStatus')!;
            const comicDisplay = document.getElementById('comicDisplay')!;

            readStatusElement.textContent = 'Just read';
            comicDisplay.className = 'just-read';
        }
        ReadTracker.markAsRead(comicNum);
    }

    private displayComic(comic: ComicData): void {
        this.currentComic = comic;
        const previouslyRead = ReadTracker.getReadStatus()[comic.num];

        const comicDisplay = document.getElementById('comicDisplay')!;
        comicDisplay.className = previouslyRead ? 'previously-read' : '';

        // Clear existing content
        comicDisplay.textContent = '';

        // Create and append title
        // const title = document.createElement('h2');
        const title = document.getElementById('xkcdTitle')!;
        title.textContent = `${comic.title} (#${comic.num})`;
        // comicDisplay.appendChild(title);

        // Create and append image
        const img = document.createElement('img');
        img.src = comic.img;
        img.alt = comic.alt;
        img.title = comic.alt;
        img.className = 'comic-image';
        comicDisplay.appendChild(img);

        const readStatusElement = document.getElementById('readStatus')!;
        if (previouslyRead) {
            const lastRead = new Date(previouslyRead.lastRead).toLocaleDateString();
            readStatusElement.textContent =
                `First read: ${new Date(previouslyRead.firstRead).toLocaleDateString()} | 
               Last read: ${lastRead}`; // will be updated to current date
        }
        // incognito, nothing --> not read yet
        // incognito, something --> show it
        // browse, nothing --> just read
        // browse, something --> show it, mark read
        if (this.isIncognito) {
            if (!previouslyRead) {
                readStatusElement.textContent = 'Not read yet';
            }
        } else {
            this.markRead(comic.num, previouslyRead);
        }
        

        // Update button states
        const prevButton = document.getElementById('prevButton') as HTMLButtonElement;

        prevButton.disabled = comic.num <= 1;
        this.updateNextButton(this.latestComicId !== null && comic.num >= this.latestComicId);
    }

    private _rerenderIncognito(): void {
        const incognitoButton = document.getElementById('incognitoButton') as HTMLButtonElement;
        if (this.isIncognito) {
            incognitoButton.classList.add('active');
        } else {
            incognitoButton.classList.remove('active');
        }
    }

    private initializeEventListeners(): void {
        document.getElementById('prevButton')?.addEventListener('click', () => {
            if (this.currentComic) this.loadComic(this.currentComic.num - 1);
        });

        document.getElementById('nextButton')?.addEventListener('click', () => {
            if (this.currentComic) this.loadComic(this.currentComic.num + 1);
        });

        
        document.getElementById('latestButton')?.addEventListener('click', () => {
            if (this.currentComic) this.loadLatestComic();
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
            this._rerenderIncognito();
            ReadTracker.saveIncognitoStatus(this.isIncognito);
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
                case 'r':
                    if (this.currentComic) this.markRead(this.currentComic.num);
                    break;
                case 'm':
                case 'u':
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