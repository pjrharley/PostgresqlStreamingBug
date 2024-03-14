Repro for this bug:

https://github.com/porsager/postgres/issues/499

To run you need docker running (to start a postgres container). Then:

```
npm i
node index.js
```

You should see this hang, sometimes after printing `doing 2`, sometimes it gets 
as far as printing `done 2` but the transaction won't 
end (no `finished test`). Occasionally it does work - just run it again.