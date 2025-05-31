// Interactive comics: https://www.explainxkcd.com/wiki/index.php/Category:Interactive_comics

const _interactiveComics = [826,
880,
1110,
1350,
1416,
1506,
1525,
1608,
1663,
1975,
2067,
2131,
2198,
2288,
2445,
2601,
2712,
2765,
2916,
3074];

export function isInteractiveComic(comicNum: number): boolean {
    return _interactiveComics.includes(comicNum);
}