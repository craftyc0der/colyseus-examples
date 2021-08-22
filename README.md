# Colyseus on Agones

The purpose of this repository is to share how to make a basic Colyseus game that can interact with the required Agones APIs.
## How to run

```
git clone https://github.com/craftyc0der/colyseus-examples.git
cd colyseus-examples
npm install
npm start
```

Open [http://localhost:2567](http://localhost:2567) in your browser.

## Agones SDK Requirements 

In order or register a game server as `Ready` on Agones, you are required to provide a Healthy() signal every 60 seconds (configurable), and call the `ready()` function. **You are also obliged to shutdown the GameServer you are done with it.** When you want to teardown a GameServer is debatable. The answer is basically, whenever you want to remove the ability for someone to be able to reach it. It is free to teardown and free to launch another in its place. The basic rule might be, if you want to invite new people to the GameServer, tear this one down. If you just want to reconfigure the server for a different game, do that from within the context of the GameServer.

This is an example of telling Agones the GameServer is healthy.

```typescript
    beforeListen: async () => {
        /**
         * Before before gameServer.listen() is called.
         */
         console.log(`game server about to listen`);
         if (process.env.AGONES === 'true') {
            // Connect to agones
            console.log(`game server AGONES found`);
            let agonesSDK = new AgonesSDK();
            await agonesSDK.connect();
            console.log(`game server AGONES connected`);
            await agonesSDK.health();
            agonesSDK.watchGameServer(async (result) => {
                // console.log('watch', result);
                // the result variable contains the game-id which is required
                // to bootstrap the server with the features defined on 
                // GoSynth/Portal
                await agonesSDK.health();
            });
            let ready = await agonesSDK.ready();
        }
    }
```

I handled shutdown by making a reference to the server object and calling it's `gracefullyShutdown(true)` function. I connected it to a path, `/shutdown` but you will probably want to do this in response some complicated event.

```typescript
server.gracefullyShutdown(true);
```

## Docker Details

```bash
docker build -t localhost:5000/colyseus-example:latest .
docker run -p 8080:8080 localhost:5000/colyseus-example:latest
docker tag localhost:5000/colyseus-example:latest 858624437249.dkr.ecr.us-east-2.amazonaws.com/dev-images:colyseus-example-latest
docker push 858624437249.dkr.ecr.us-east-2.amazonaws.com/dev-images:colyseus-example-latest
```

You can also use `make` for this.

```bash
make docker
echo OR
make release
```


## License

MIT
