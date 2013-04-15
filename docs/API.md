### Overview

Use `postile.ajax(api_dir, data, callback)` to interact with backend api.

- `api_dir` = `['post', 'get_post']` to get comments of a post.
  * `data` = `{post_id: XXX}`
  * The argument to callback will always be in the format of:
    `{ status: 'ok' | 'error', message: (the actual message) }`
  * `callback` is called with `message` = `PostWE`,
    which will be explained below.

- `api_dir` = `['board', 'get_recent_post']` to get some posts in a board.
  * `data` = `{board_id: XXX, number: XXX}`
    + set `number` = 0 to get all posts for a board.
  * `callback` is called with `message` = `{ posts: [PostWE] }`.

### Data types

- [`PostWE`](PostWithExtra.json):
  (WE stands for with extra.) Generally speaking, it's something
  like `{ post: XXX, likes: XXX, inline_comments: XXX }`.

