import { fetchComic } from './api';
import { ReadTracker } from './storage';
import { ComicData } from './types';

class XKCDCalendar {
    private latestComicId: number | null = null;
    private isIncognito: boolean = true;
    private comicsPerPage: number = 50;
    private currentPage: number = 1;

    constructor() {
        this.isIncognito = ReadTracker.getIncognitoStatus();
        this._rerenderIncognito();
        this.initializeEventListeners();
        this.loadLatestComic();
    }

    private async loadLatestComic(): Promise<void> {
        const comic = await fetchComic();
        this.latestComicId = comic.num;
        this.renderCalendar();
    }

    private renderCalendar(): void {
        if (!this.latestComicId) return;

        const grid = document.getElementById('calendarGrid')!;
        grid.innerHTML = '';

        const startId = Math.max(1, this.latestComicId - (this.currentPage * this.comicsPerPage) + 1);
        const endId = Math.max(1, this.latestComicId - ((this.currentPage - 1) * this.comicsPerPage));

        for (let id = startId; id <= endId; id++) {
            const comicElement = document.createElement('div');
            comicElement.className = 'calendar-comic';
            comicElement.innerHTML = `
                <div class="comic-number">${id}</div>
                <div class="comic-status"></div>
            `;

            const readStatus = ReadTracker.getReadStatus()[id];
            if (readStatus) {
                comicElement.classList.add('read');
                const lastRead = new Date(readStatus.lastRead).toLocaleDateString();
                comicElement.querySelector('.comic-status')!.textContent = lastRead;
            } else {
                comicElement.classList.add('unread');
            }

            comicElement.addEventListener('click', () => {
                window.location.href = `/${id}`;
            });

            grid.appendChild(comicElement);
        }

        // Add pagination controls
        const totalPages = Math.ceil(this.latestComicId / this.comicsPerPage);
        const pagination = document.createElement('div');
        pagination.className = 'pagination';
        pagination.innerHTML = `
            <button class="button" ${this.currentPage === 1 ? 'disabled' : ''} id="prevPage">←</button>
            <span>Page ${this.currentPage} of ${totalPages}</span>
            <button class="button" ${this.currentPage === totalPages ? 'disabled' : ''} id="nextPage">→</button>
        `;
        grid.parentElement!.appendChild(pagination);
    }

    private _rerenderIncognito(): void {
        const incognitoToggle = document.getElementById('incognitoToggle') as HTMLInputElement;
        if (incognitoToggle) {
            incognitoToggle.checked = this.isIncognito;
        }
        const incognitoLabel = document.getElementById('incognitoLabel') as HTMLSpanElement;
        if (incognitoLabel) {
            incognitoLabel.textContent = this.isIncognito ? 'Incognito Mode (ON)' : 'Incognito Mode (OFF)';
        }
    }

    private initializeEventListeners(): void {
        // Settings modal handling
        const modal = document.getElementById('settingsModal')!;
        const settingsButton = document.getElementById('settingsButton')!;
        const closeButton = document.querySelector('.close')!;

        settingsButton.addEventListener('click', () => {
            modal.classList.add('active');
        });

        closeButton.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });

        // Incognito toggle
        document.getElementById('incognitoToggle')?.addEventListener('change', () => {
            this.isIncognito = !this.isIncognito;
            this._rerenderIncognito();
            ReadTracker.saveIncognitoStatus(this.isIncognito);
            this.renderCalendar();
        });

        // Pagination
        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (target.id === 'prevPage' && this.currentPage > 1) {
                this.currentPage--;
                this.renderCalendar();
            } else if (target.id === 'nextPage' && this.currentPage < Math.ceil(this.latestComicId! / this.comicsPerPage)) {
                this.currentPage++;
                this.renderCalendar();
            }
        });

        // Import/Export
        document.getElementById('exportButton')?.addEventListener('click', () => {
            const tsv = ReadTracker.exportToCsv();
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

        document.getElementById('importButton')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv,.tsv';
            
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const content = event.target?.result as string;
                        if (content) {
                            ReadTracker.importFromCsv(content);
                            this.renderCalendar();
                        }
                    };
                    reader.readAsText(file);
                }
            };
            
            input.click();
        });
    }
}

// Initialize the calendar view
new XKCDCalendar(); 