import { fetchComic } from './api';
import { ReadTracker } from './storage';
import { ComicData, ComicReadStatus } from './types';

class XKCDReader {
    private currentComic: ComicData | null = null;
    private latestComicId: number | null = null;
    private isIncognito: boolean = true;
    private showAltText: boolean = true;

    constructor() {
        this.isIncognito = ReadTracker.getIncognitoStatus();
        this.showAltText = ReadTracker.getShowAltText();
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
        const match = path.match(/^\/(\d+)\/?$/);
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

    private async loadRandomUnreadComic(): Promise<void> {
        if (!this.latestComicId) {
            await this.loadLatestComic();
        }

        const readStatus = ReadTracker.getReadStatus();
        const unreadComics: number[] = [];

        // Find all unread comics
        for (let i = 1; i <= this.latestComicId!; i++) {
            if (!readStatus[i]) {
                unreadComics.push(i);
            }
        }

        if (unreadComics.length === 0) {
            // If all comics are read, just pick a random one
            const randomId = Math.floor(Math.random() * this.latestComicId!) + 1;
            await this.loadComic(randomId);
        } else {
            // Pick a random unread comic
            const randomIndex = Math.floor(Math.random() * unreadComics.length);
            await this.loadComic(unreadComics[randomIndex]);
        }
    }

    private updateNextButton(shouldBeDisabled: boolean): void {
        const nextButton = document.getElementById('nextButton') as HTMLButtonElement;
        nextButton.disabled = shouldBeDisabled;
    }

    private markRead(comicNum: number, previouslyRead?: ComicReadStatus): void { // mark a comic read in non-incognito mode
        // console.log('marking read');
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

    private sanitizeAndDisplayHtml(html: string, targetElement: HTMLElement): void {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Clear existing content
        targetElement.textContent = '';
        
        // Only allow specific tags and attributes
        const allowedTags = ['a', 'br', 'p', 'em', 'strong'];
        const allowedAttributes = ['href', 'target', 'rel'];
        
        // Process each node
        const processNode = (node: Node, parentElement: HTMLElement) => {
            if (node.nodeType === Node.TEXT_NODE) {
                parentElement.appendChild(node.cloneNode());
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (allowedTags.includes(element.tagName.toLowerCase())) {
                    const newElement = document.createElement(element.tagName.toLowerCase());
                    
                    // Copy allowed attributes
                    allowedAttributes.forEach(attr => {
                        const value = element.getAttribute(attr);
                        if (value !== null) {
                            newElement.setAttribute(attr, value);
                        }
                    });
                    
                    // Process child nodes
                    Array.from(element.childNodes).forEach(childNode => processNode(childNode, newElement));
                    
                    parentElement.appendChild(newElement);
                } else {
                    // For non-allowed tags, just process their text content
                    Array.from(element.childNodes).forEach(childNode => processNode(childNode, parentElement));
                }
            }
        };
        
        Array.from(doc.body.childNodes).forEach(node => processNode(node, targetElement));
        
        // Hide if no content was added
        targetElement.style.display = targetElement.hasChildNodes() ? '' : 'none';
    }

    private displayComic(comic: ComicData): void {
        this.currentComic = comic;
        const previouslyRead = ReadTracker.getReadStatus()[comic.num];

        const comicDisplay = document.getElementById('comicDisplay')!;
        comicDisplay.className = previouslyRead ? 'previously-read' : '';

        // Clear existing content
        comicDisplay.textContent = '';

        // Create and append title with publication date as tooltip
        const title = document.getElementById('xkcdTitle')!;
        title.textContent = `${comic.safe_title} (#${comic.num})`;
        
        // Add publication date as tooltip if available
        if (comic.year && comic.month && comic.day) {
            const date = new Date(comic.year, comic.month - 1, comic.day);
            title.title = `Published: ${date.toLocaleDateString()}`;
        } else {
            title.title = '';
        }

        // Update calendar link with current comic number
        const calendarLink = document.getElementById("calendarButton") as HTMLAnchorElement;
        if (calendarLink) {
            calendarLink.href = `/calendar?back=${comic.num}`;
        }

        // Display meta information
        const comicNews = document.getElementById('comicNews')!;
        const altDiv = document.getElementById('comicAltDiv')!;
        const altTextDiv = document.getElementById('comicAltText')!;
        const linkElement = document.getElementById('comicLink') as HTMLLinkElement;

        // Toggle visibility of alt text and link
        altDiv.style.display = this.showAltText ? '' : 'none';

        // Set alt text content
        if (comic.alt) {
            altTextDiv.textContent = comic.alt;
        } else {
            altTextDiv.textContent = '';
        }
        
        // Set link if present
        if (comic.link) {
            linkElement.href = comic.link;
            linkElement.textContent = '🔗 Attached Link';
        } else {
            linkElement.href = '';
            linkElement.textContent = '';
        }

        // Display news if present
        if (comic.news) {
            let news = comic.news;
            this.sanitizeAndDisplayHtml(news, comicNews);
            comicNews.style.display = '';
        } else {
            comicNews.style.display = 'none';
        }

        // Check if comic is interactive
        if (comic.isInteractive) {
            const interactiveMessage = document.createElement('div');
            interactiveMessage.className = 'interactive-message';
            interactiveMessage.innerHTML = `
                <p>This is an interactive comic!</p>
                <p>Please visit <a href="https://xkcd.com/${comic.num}" target="_blank" rel="noopener">xkcd.com/${comic.num}</a> to view it.</p>
            `;
            comicDisplay.appendChild(interactiveMessage);
            return;
        }

        // Create and append image
        const img = document.createElement('img');
        img.src = comic.img;
        img.alt = comic.alt;
        img.title = comic.alt;
        img.className = 'comic-image';

        // Wrap image in a link - use comic.link if present, otherwise link to xkcd page
        if (comic.link) {
            const imgLink = document.createElement('a');
            imgLink.href = comic.link;
            imgLink.target = '_blank';
            imgLink.rel = 'noopener';
            imgLink.appendChild(img);
            comicDisplay.appendChild(imgLink);
        } else {
            comicDisplay.appendChild(img);
        }
        

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
        if (this.isIncognito || this.isIncognito === undefined) {
            if (!previouslyRead) {
                readStatusElement.textContent = 'Not read yet';
            }
        } else {
            this.markRead(comic.num, previouslyRead);
        }
        
        // Update comic links
        const comicLinks = document.getElementById('comicLinks')!;
        const links = comicLinks.getElementsByTagName('a');
        links[0].href = `https://xkcd.com/${comic.num}`;
        links[1].href = `https://www.explainxkcd.com/wiki/index.php/${comic.num}`;

        // Update button states
        const prevButton = document.getElementById('prevButton') as HTMLButtonElement;

        prevButton.disabled = comic.num <= 1;
        this.updateNextButton(this.latestComicId !== null && comic.num >= this.latestComicId);
    }

    /**
     * Re-renders the incognito toggle
     */
    private _rerenderIncognito(): void {
        const incognitoToggle = document.getElementById('incognitoToggle') as HTMLInputElement;
        const incognitoLabel = document.getElementById('incognitoLabel')!;
        incognitoToggle.checked = this.isIncognito;
        incognitoLabel.textContent = this.isIncognito ? 'Incognito Mode (ON)' : 'Incognito Mode (OFF)';

        const altTextToggle = document.getElementById('altTextToggle') as HTMLInputElement;
        altTextToggle.checked = this.showAltText;
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

        document.getElementById('randomButton')?.addEventListener('click', () => {
            this.loadRandomUnreadComic();
        });

        document.getElementById('readButton')?.addEventListener('click', () => {
            if (this.currentComic) this.markRead(this.currentComic.num);
        });

        let markUnreadListener = () => {
            if (this.currentComic) {
                ReadTracker.markAsUnread(this.currentComic.num);
                const readStatusElement = document.getElementById('readStatus')!;
                readStatusElement.textContent = 'Not read yet';
                const comicDisplay = document.getElementById('comicDisplay')!;
                comicDisplay.className = '';
            }
        };
        document.getElementById('unreadButton')?.addEventListener('click', markUnreadListener);

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

        let incognitoListener = () => {
            this.isIncognito = !this.isIncognito;
            this._rerenderIncognito();
            ReadTracker.saveIncognitoStatus(this.isIncognito);
        };
        document.getElementById('incognitoToggle')?.addEventListener('change', incognitoListener);

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
                            // Refresh the current comic display to show updated read status
                            if (this.currentComic) {
                                this.displayComic(this.currentComic);
                            }
                        }
                    };
                    reader.readAsText(file);
                }
            };
            
            input.click();
        });

        // Alt text toggle
        document.getElementById('altTextToggle')?.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            this.showAltText = target.checked;
            ReadTracker.saveShowAltText(this.showAltText);
            if (this.currentComic) {
                this.displayComic(this.currentComic);
            }
        });

        // keybinds
        document.addEventListener('keydown', (event) => {
            // Ignore if Ctrl is pressed
            if (event.ctrlKey) return;

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
                case 'c':
                    // calendar
                    window.location.href = '/calendar';
                    break;
                case 'Escape':
                    modal.classList.remove('active');
                    break;
            }
        });

        // Clear read history
        document.getElementById('clearButton')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your read history? This cannot be undone.')) {
                ReadTracker.clearReadHistory();
                // Refresh the current comic to update its read status
                if (this.currentComic) {
                    this.displayComic(this.currentComic);
                }
            }
        });
    }
}

// Initialize the app
new XKCDReader();