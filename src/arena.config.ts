import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";
import path from 'path';
import serveIndex from 'serve-index';
import express from 'express';

// import { uWebSocketsTransport} from "@colyseus/uwebsockets-transport";

// Import demo room handlers
import { LobbyRoom, RelayRoom, Server } from 'colyseus';
import { ChatRoom } from "./rooms/01-chat-room";
import { StateHandlerRoom } from "./rooms/02-state-handler";
import { AuthRoom } from "./rooms/03-auth";
import { ReconnectionRoom } from './rooms/04-reconnection';
import { CustomLobbyRoom } from './rooms/07-custom-lobby-room';

const AgonesSDK = require('@google-cloud/agones-sdk');
var server:Server = null;
export default Arena({
    getId: () => "Your Colyseus App",

    // initializeTransport: (options) => new uWebSocketsTransport(options),

    initializeGameServer: (gameServer) => {
        server = gameServer;
        // Define "lobby" room
        gameServer.define("lobby", LobbyRoom);

        // Define "relay" room
        gameServer.define("relay", RelayRoom, { maxClients: 4 })
            .enableRealtimeListing();

        // Define "chat" room
        gameServer.define("chat", ChatRoom)
            .enableRealtimeListing();

        // Register ChatRoom with initial options, as "chat_with_options"
        // onInit(options) will receive client join options + options registered here.
        gameServer.define("chat_with_options", ChatRoom, {
            custom_options: "you can use me on Room#onCreate"
        });

        // Define "state_handler" room
        gameServer.define("state_handler", StateHandlerRoom)
            .enableRealtimeListing();

        // Define "auth" room
        gameServer.define("auth", AuthRoom)
            .enableRealtimeListing();

        // Define "reconnection" room
        gameServer.define("reconnection", ReconnectionRoom)
            .enableRealtimeListing();

        // Define "custom_lobby" room
        gameServer.define("custom_lobby", CustomLobbyRoom);

        gameServer.onShutdown(function(){
            console.log(`game server is going down.`);
            if (process.env.AGONES === 'true') {
                let agonesSDK = new AgonesSDK();
                agonesSDK.watchGameServer(async (result) => {
                    console.log('watch', result);
                    await agonesSDK.shutdown();
                });
            }
        });

    },

    initializeExpress: (app) => {
        console.log(`game server initializing.`);
        var router = express.Router()
        console.log(__dirname)
        console.log(path.join(__dirname, "static"))
        router.use('/', serveIndex(path.join(__dirname, "static"), {'icons': true}))
        router.use('/', express.static(path.join(__dirname, "static")));
        router.get(['/shutdown','shutdown','//shutdown'], (req, res) => {
            server.gracefullyShutdown(true);
            res.status(200).send('Ok');
        });
        app.use('/', router)
        // app.use('/game/def456', router)
        app.use(/\/[a-zA-Z]{1,16}\/[a-z]{3}[0-9]{3}/, router)
        app.get('/health', (req, res) => {
            res.status(200).send('Ok');
        });
        // (optional) attach web monitoring panel
        app.use('/colyseus', monitor());
    },


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
                //console.log('watch', result);
                // the result variable contains the game-id which is required
                // to bootstrap the server with the features defined on 
                // GoSynth/Portal
                await agonesSDK.health();
            });
            let ready = await agonesSDK.ready();
        }
    }
});
