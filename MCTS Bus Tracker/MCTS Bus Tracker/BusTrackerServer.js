//Represents express server
class ExpressServer {
    //Function creates express server
    static serve() {

        const express = require('express');
        const mongoose = require('mongoose');
        const connection = mongoose.connect('mongodb://localhost/bustracker', { useNewUrlParser: true, useUnifiedTopology: true });
        const busSchema = new mongoose.Schema(
            {
                'rt': String,
                'vid': String,
                'spd': String,
                'tmstmp': String,
                'lat': String,
                'lon': String
            }
        );

        const busModel = mongoose.model('buses', busSchema);
        
        const favicon = require('express-favicon');

        const app = express(); // init the framework

        let server = app.listen(3000, function () { // start the server
            console.log("Server is running at http://localhost:3000");
        });

        // Use this to allow Ajax requests to be honored from any origin
        app.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            next();
        });

        app.use(express.static(`${__dirname}/public`));

        //Serves html page when default address is requested
        app.get('/', function (request, response) {
            response.sendFile(`${__dirname}/public/BusTracker.html`);
        });

        // Route for the url localhost:3000/BusInfo
        //Handles request from client to get businfo
        app.get('/BusInfo', function( request, response ) {

            let http_request = require('request'); // import the request library (downloaded from NPM) for making ajax requests
            let url = require('url');  // used for parsing request urls (in order to get params)
            let urlObject = url.parse(request.url,true); // see https://nodejs.org/api/url.html

            let route;
            let busData;

            if( urlObject.query["rt"] ) { // check for the existence of a specific parameter
                route = urlObject.query["rt"];

            } else {
                //Return that no route was found
                busData = {status: "No route was given"};
                response.json(busData);
                return;
            }

            let key;

            if( urlObject.query["key"] ) { // check for the existence of a specific parameter
                key = urlObject.query["key"];

            } else {
                //Return that no key was found
                busData = {status: "No key was given"};
                response.json(busData);
                return;
            }

            busData = {status:"Server Error; IOException during request to ridemcts.com:" +
                    " Simulated server error during request to ridemcts.com"}; // the default JSON response

            // Here's the url of the real MCTS server:
            let uri = "http://realtime.ridemcts.com/bustime/api/v2/getvehicles?key="+ key + "&rt=" + route + "&format=json";


            //Checking for specific route values. Send specific response and return from the method
            if( route === '1000') {
                response.json(busData);
                return;
            } else if( route === '1001' ) {
                response.status(404).send("Not found");
                return;
            } else if( route === '1002') {
                busData = {status: "Key or route parameter empty"};
                response.json(busData);
                return;
            } else if( route === '1003' ) {
                busData = {'bustime-response': {error: [{msg: "Invalid API access key supplied"}]}};
                response.json(busData);
                return;

            }

            //Making http request on the
            http_request(uri, function( error, res, jsonText ) {

                if( !error && res.statusCode === 200 ) {
                    response.send(jsonText); //Good response
                } else {
                    response.send({status: error}); //Error response
                }
            });
        });

        //Handles BusSpeed http requests from client
        app.get('/BusSpeed', function(request, response){
            let speed = request.query.speed;

            if(isNaN(speed)){ //Speed param is not a number, then send an error
                response.json({
                    status: "error",
                    message: "Speed entered was not a number.",
                });
                return;
            } else if(speed < 0){
                response.json({ //Speed param is not a correct number, send an error
                    status: "error",
                    message: "Speed must be greater than 0.",
                });
                return;
            }

            busModel.find({ spd : {$gt : speed}}, function(err, records) {
                if (err !== null) {
                    response.json({
                        status: "error",
                        message: `DB Error: ${err}`,
                    });
                } else {
                    // NOTE that records is a Javascript object
                    response.json(records);
                }
            });
        });


    } // end serve() method
} // end ExpressServer class

ExpressServer.serve(); // alternate when using static run() method