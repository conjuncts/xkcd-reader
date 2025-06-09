import { fetchComic } from './api';
import { ReadTracker } from './storage';

class XKCDCalendar {
    private latestComicId: number | null = null;
    private comicsPerPage: number = 100;
    private currentPage: number = 1;
    private cameFrom: number | null = null;

    constructor() {
        this.initializeEventListeners();
        this.loadLatestComic();
    }

    private async loadLatestComic(): Promise<void> {
        const comic = await fetchComic();
        
        // Get the 'back' parameter from URL
        const urlParams = new URLSearchParams(window.location.search);
        const backParam = urlParams.get('back');
        this.cameFrom = backParam ? parseInt(backParam) : comic.num;
        
        this.latestComicId = comic.num;

        // Update back button URL
        const backButton = document.getElementById('calendarBack') as HTMLAnchorElement;
        if (backButton && this.cameFrom) {
            backButton.href = `/${this.cameFrom}`;
        }

        // Ensure we have valid numbers before calculating the page
        if (this.cameFrom && this.comicsPerPage) {
            this.currentPage = Math.max(1, Math.ceil(this.cameFrom / this.comicsPerPage));
        } else {
            this.currentPage = 1;
        }
        this.renderCalendar();
    }

    private renderCalendar(): void {
        if (!this.latestComicId) return;

        const grid = document.getElementById('calendarGrid')!;
        grid.innerHTML = '';

        const startId = this.comicsPerPage * (this.currentPage - 1) + 1;
        const endId = Math.min(this.comicsPerPage * (this.currentPage), this.latestComicId);

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
        const paginationStatus = document.getElementById('paginationStatus')!;
        paginationStatus.innerText = `Page ${this.currentPage} of ${totalPages}`;
        
        if (this.currentPage === 1) {
            document.getElementById("prevPage")?.setAttribute("disabled", "true");
        } else {
            document.getElementById("prevPage")?.removeAttribute("disabled");
        }
        if (this.currentPage === totalPages) {
            document.getElementById("nextPage")?.setAttribute("disabled", "true");
        } else {
            document.getElementById("nextPage")?.removeAttribute("disabled");
        }
    }

    private initializeEventListeners(): void {
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

        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey) return;

            if (event.key === 'ArrowLeft' && this.currentPage > 1) {
                this.currentPage--;
                this.renderCalendar();
            } else if (event.key === 'ArrowRight' && this.currentPage < Math.ceil(this.latestComicId! / this.comicsPerPage)) {
                this.currentPage++;
                this.renderCalendar();
            } else if (event.key === 'r') {
                // return to reader
                if (this.cameFrom) {
                    window.location.href = `/${this.cameFrom}`;
                } else {
                    window.location.href = '/';
                }
            }
        });
    }
}

// Initialize the calendar view
new XKCDCalendar(); 