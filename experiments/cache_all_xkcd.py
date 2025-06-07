import asyncio
import os
import httpx
import polars as pl
from tqdm.asyncio import tqdm


# Total comics to fetch (as of your info)
LATEST_ID = 3098

# Base URL template
BASE_URL = "https://xkcd.com/{}/info.0.json"

limits = httpx.Limits(max_connections=3, max_keepalive_connections=3)

# Async function to fetch a single comic
async def fetch_comic(client: httpx.AsyncClient, comic_id: int):
    try:
        url = BASE_URL.format(comic_id)
        resp = await client.get(url, timeout=10)
        if resp.status_code == 200:
            # return resp.json()
            return {
                # 'comic_id': comic_id,
                # comic_id is "num"
                **resp.json()
            }
        else:
            return None
    except Exception:
        return None

# Fetch all comics concurrently
async def fetch_all_comics():
    async with httpx.AsyncClient(limits=limits) as client:
        tasks = [fetch_comic(client, cid) for cid in range(1, LATEST_ID + 1)]
        comics = []
        for coro in tqdm(asyncio.as_completed(tasks), total=LATEST_ID, desc="Fetching XKCDs"):
            result = await coro
            if result:
                comics.append(result)
        return comics

# Normalize with Polars
def comics_to_polars_df(comics: list[dict]) -> pl.DataFrame:
    # return pl.json_normalize(comics)
    return pl.DataFrame(comics)

# Entry point
def main():
    comics = asyncio.run(fetch_all_comics())
    df = comics_to_polars_df(comics)
    print(df.head())
    df.write_parquet("experiments/xkcd_comics.parquet")
    print("Saved to xkcd_comics.parquet")

def special_corrections(df: pl.DataFrame) -> pl.DataFrame:
    """
    Special corrections for known issues
    """
    df = df.update(pl.DataFrame({
        'num': [259, 3015, 3028],
        'safe_title': ['Clichéd Exchanges', 'D&D Combinatorics', 'D&D Roll']
    }), on='num')
    return df

def compress():
    df = pl.read_parquet("experiments/xkcd_comics.parquet")
    df = special_corrections(df)
    df = df.select(
        # vitals
        'num',
        # 'title',
        'safe_title',
        pl.col('img').str.strip_prefix('https://imgs.xkcd.com/comics/'),

        'alt', # supplemental text
        pl.col('link').replace('', None),
        pl.col('news').replace('', None), # replace empty strings with None

        'year', 'month', 'day' # publication date
    ).sort('num')
    # df.write_csv("experiments/xkcd_comics_concise.tsv", separator='\t')
    # print("Compressed xkcd_comics.parquet to xkcd_comics_concise.tsv")
    return df

# def uncompress():
#     df = pl.read_csv("experiments/xkcd_comics_concise.tsv", separator='\t')
#     # write to json
#     df.write_json("experiments/xkcd_comics_concise.json")

def compress_and_chunk(chunk_size=500):
    df = compress()
    os.makedirs('public/data/chunks/', exist_ok=True)
    for i, subset in enumerate(df.iter_slices(chunk_size)):
        subset.write_csv(f"public/data/chunks/xkcd_{i * chunk_size}.tsv", separator='\t', quote_style='never')
    print("Done compressing and chunking xkcd comics.")

if __name__ == "__main__":
    # main()
    # compress()
    compress_and_chunk()
