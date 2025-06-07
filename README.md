## minimal xkcd viewer **with read tracking**.

License: MIT

Credits
- [favicon](https://www.explainxkcd.com/wiki/images/0/04/16px-BlackHat_head.png)


## Cold Open 1

I've been reading xkcd for years - for so long, I ran into a problem. I've forgotten which comics I have and haven't read. Reliance on the "random" button meant that a random comic would most likely pull up an already seen comic, but 

Through overreliance on the "random" button, I reached a stage where any random comic I would have probably seen, yet still many unread comics remained (which I couldn't easily access). 

This predicament is described mathematically as the [occupancy problem](https://en.wikipedia.org/wiki/Occupancy_problem) or the [coupon collector's problem](https://en.wikipedia.org/wiki/Coupon_collector%27s_problem). The number of expected "random" trials far exceeds the number of total comics.

Of course, it is much more efficient to track which comics have and haven't been read. But it's also nice to have the freedom to read comics out of order, without worrying about which ones have been read.


(Source: )

I've been reading xkcd for years. But like being

I would probably have seen a random comic despite still not knowing many unread comics.

[Occupancy problem](https://www.math.uci.edu/~rvershyn/teaching/probability-PhD/occupancy.pdf) as the [number of empty bins](https://people.eecs.berkeley.edu/~jfc/cs174/lecs/lec5/lec5.pdf), and the "coupon collectors problem" describes the expected number of trials to see all comics. 

Of course, it is much more efficient to track which comics have and haven't been read. While it is possible to read the comics in order, I also  the freedom


## Cold Open 2

After years of using the "random" button, I've lost track of which comics I have and haven't read. A random comic would most likely pull up an already seen comic, but still many comics remain left to be seen.

This predicament is described mathematically as the [occupancy problem](https://en.wikipedia.org/wiki/Occupancy_problem) or the [coupon collector's problem](https://en.wikipedia.org/wiki/Coupon_collector%27s_problem). To see every comic, I'd have to click the "random" button far more than the actual number of comics.

![stats](experiments/unique_comics_vs_trials.png)

Of course, it is more efficient to track the comics I have and haven't read. Sure, I could plan to read the comics in order. But I also enjoy the freedom to read comics at will, in no particular order.

After experimenting with existing options, I bit the bullet and made my own xkcd viewer.


- Minimal
- No ads, ever
- Open source
- Calendar view
- Easy import/export

## Mobile

The website was designed for desktop, so mobile UI improvements still need to be implemented.

## Notable Features

- Hovering over the comic title reveals the publication date.
- The footer links to the corresponding xkcd and explainxkcd pages.
- A few comics, like [#1047](https://xkcd.com/1047/), have subtle alterations to the "news" section. (See the top: "Lots of emails mention the physicist favorite, 1 year = pi x 107 seconds.") Since's it's easy for this to go unnoticed, the client [lists it](https://readxkcd.com/1047) below the "read" buttons.