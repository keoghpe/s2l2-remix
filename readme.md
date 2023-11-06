- Start dev server:

  ```sh
  npm run dev
  ```

[Fly.io link](https://fly.io/apps/s2l2/secrets)

Deploy with `flyctl deploy`

## Editing models

Update `prisma/prisma.schema` then run `npx prisma db push`

## Cache problem?

Open a terminal from Docker

```
redis-cli
127.0.0.1:6379> FLUSHALL
```
