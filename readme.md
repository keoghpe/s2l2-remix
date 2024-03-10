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

## Local domain for development

Add this to `/etc/hosts`

```
127.0.0.1 s2l2.dev
```

Flush DNS cache:

```
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

```
mkcert "s2l2.dev" "*.s2l2.dev"
```

https://medium.com/@TomVance/local-domains-with-https-469036775818