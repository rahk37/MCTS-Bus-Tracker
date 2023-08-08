class BusTracker {
    // Note: We could also have used a static Factory Method (as in previous code examples) to call the constructor.
    constructor() {
        $(document).ready(function() {      // when document loads, do some initialization
            onLoad();
        });

        // Note: Any "private" variables you create via "let x=..." will be visible to the "onload" function below and its
        // nested inner functions. (You probably don't need to declare any extra variables however).

        // The onLoad "private" member function is called when the document loads and is used to perform initialization.
        let onLoad = function() {
            // Note: local vars will be visible/accessible within inner functions below!
            let label = $("#update");
            const FT_IN_MILE = 5280;
            let timer = null;       // an interval timer
            let updates = 0;
            let route;
            let speed;
            let startPoint = [43.044240, -87.906446];// GPS lat/long location of MSOE athletic field
            let map = createMap(startPoint); // map this starting location (see code below) using MapQuest
            let reportText = $("#speed-report");
            reportText.hide();

            let layerGroup = L.layerGroup().addTo(map);

            let loc = "MSOE Athletic Field" + startPoint[0].toFixed(3) + ", " + startPoint[1].toFixed(3);
            addMarker(map, startPoint, loc, "The place to be!");  // add a push-pin to the map

            // initialize button event handlers (note this shows an alternative to $("#id).click(handleClick)
            $("#start").on( "click", start);
            $("#stop").on( "click", stop);
            $("#report").on("click", generateReport);

            /**
             * Called when user clicks 'start'
             * Performs actions when user clicks start
             * Gets route from user and calls method to make ajax request
             */
            function start(){
                reportText.hide();
                route = $("#route").val();
                layerGroup.clearLayers();
                doAjaxRequest();
            }

            /**
             * Called when user clicks 'stop'
             * Clears markers on map
             * Clears table
             * Recreates MSOE marker and stops timer so ajax call doesn't occur again
             */
            function stop() {
                reportText.hide();

                label.html("");
                layerGroup.clearLayers();
                $("#table1").html("");
                updates = 0;
                stopTimer();
            }

            //Called when user presses report button; will call ajax method
            function generateReport(){
                stop();
                speed = $("#route").val();
                doAjaxRequestReport();
            }

            //NOTE: Remaining helper functions are all inner functions of onLoad; thus, they have
            // access to all vars declared within onLoad.

            // Create a MapQuest map centered on the specified position. If the map already exists, update the center point of the map per the specified position
            // param position - a GPS array of [lat,long] containing the coordinates to center the map around.
            // Note: You must set a finite size for the #map element using CSS; otherwise it won't appear!
            function createMap(position) {
                L.mapquest.key = '6hTycgf66fuAEYQAbQkejsT3LiX1h9X1'; // your MapQuest key here!
                // 'map' refers to a <div> element with the ID map
                let map = L.mapquest.map('map', {
                    center: position,
                    layers: L.mapquest.tileLayer('map'),
                    zoom: 14
                });
                //map.addControl(L.mapquest.control()); // use alternate map control
                return map;
            } // end inner function displayMap

            // This function adds a "push-pin" marker to the existing map
            // param layerGroup - layer that pins sit on which is on the map
            // param position - the [lat, long] position of the marker on the map
            // param description - text that appears next to the marker
            // param popup - the text that appears when a user hovers over the marker
            function addMarker(layerGroup, position, description, popup) {
                let marker = L.mapquest.textMarker(position, {
                    text: description,
                    title: popup,
                    position: 'right',
                    type: 'marker',
                    icon: {
                        primaryColor: '#1E90FF',
                        secondaryColor: '#ffffff',
                        size: 'sm'
                    }
                });

                marker.addTo(layerGroup);

            } // end inner function addMarker

            //Performs ajax request for bus speeds
            function doAjaxRequestReport(){
                let params = "speed=" + speed;
                $.ajax({
                    type : "GET",
                    url : "http://localhost:3000/BusSpeed", // the url of the servlet returning the Ajax response
                    data : params, // key and route, for example "key=ABCDEF123456789&rt=31"
                    crossDomain : true,// cross-origin request? Then set to true
                    async : true, // the default; false for synchronous
                    dataType : "json", // we want a JSON response
                    success : speedSuccess, // the function to call on success
                    error : handleError // the function to call if an error occurs
                });
            }

            // This function executes an Ajax request to the server
            function doAjaxRequest() {
                let params = "key=" + key + "&rt=" + route;
                $.ajax({
                    type : "GET",
                    url : "http://localhost:3000/BusInfo", // the url of the servlet returning the Ajax response
                    data : params, // key and route, for example "key=ABCDEF123456789&rt=31"
                    crossDomain : true,// cross-origin request? Then set to true
                    async : true, // the default; false for synchronous
                    dataType : "json", // we want a JSON response
                    success : handleSuccess, // the function to call on success
                    error : handleError // the function to call if an error occurs
                });

                // When started, it should cause doAjaxRequest to be called every 5 seconds
                timer = setTimeout(doAjaxRequest, 5000);

            }// end inner function doAjaxRequest

            // This function stops the timer and nulls the reference
            function stopTimer() {
                clearTimeout(timer);
            }// end inner function stopTimer

            /**
             * Updates/ creates table for looking up routes
             * Adds nodes to map
             *
             * @param response response from ajax call
             */
            function updateUI(response){

                let innerhtml = "<thead class='thead-dark'><tr><th>Bus</th><th>Route " + route + "</th><th>latitude</th>" +
                    "<th>longitude</th><th>speed(MPH)</th><th>dist(mi)</th></tr></thead><tbody>";

                label.css("color", "black");
                label.html('Update: ' + updates);

                let data = response["bustime-response"].vehicle;
                for(let i = 0; i < data.length; i++){

                    let vehicle = data[i];

                    //Creating marker for one vehicle
                    let pos = [vehicle.lat, vehicle.lon];
                    addMarker(layerGroup, pos, vehicle.vid, vehicle.des);

                    //Creating row in table
                    let rowHtml = "<tr>";
                    rowHtml += "<td>" + vehicle.vid + "</td>";
                    rowHtml += "<td>" + vehicle.des + "</td>";
                    rowHtml += "<td>" + vehicle.lat + "</td>";
                    rowHtml += "<td>" + vehicle.lon + "</td>";
                    rowHtml += "<td>" + vehicle.spd + "</td>";
                    rowHtml += "<td>" + vehicle.pdist/FT_IN_MILE + "</td>";
                    //Adds row to overall table
                    innerhtml+=rowHtml;

                }

                innerhtml+="</tbody>";

                $("#table1").html(innerhtml);
            }

            //Updates UI for when the speed report is successful
            function updateUIReport(reports){

                let innerhtml = "<thead class='thead-dark'><tr><th>Bus</th><th>Destination</th><th>Latitude</th><th>Longitude</th>" +
                    "<th>Speed (mph)</th><th>Distance (mi)</th></tr></thead><tbody>";

                let spd = speed;
                reportText.html("Route " + 'RED' + " speeding buses > " + spd + " mph: " + reports.length);
                reportText.show();

                if(reports.length !== 0) {
                    for (let i = 0; i < reports.length; i++) {

                        let bus = reports[i];

                        let pos = [bus.lat, bus.lon];
                        addMarker(layerGroup, pos, bus.vid + ":" + bus.spd, bus.tmstmp);

                        //Creating row in table
                        let rowHtml = "<tr>";
                        rowHtml += "<td>" + bus.vid + "</td>";
                        rowHtml += "<td>Not Available</td>";
                        rowHtml += "<td>" + bus.lat + "</td>";
                        rowHtml += "<td>" + bus.lon + "</td>";
                        rowHtml += "<td>" + bus.spd + "</td>";
                        rowHtml += "<td>Not Available</td>";
                        //Adds row to overall table
                        innerhtml += rowHtml;

                    }

                    innerhtml += "</tbody>";

                    $("#table1").html(innerhtml);
                }
            }

            //Handles success for BusSpeed ajax call
            function speedSuccess(response, textStatus, jqXHR){
                $("#table1").html("");

                if(!response.status) {
                    updateUIReport(response);
                } else{
                    label.css("color", "red");
                    label.html(response.message);
                }
            }

            // This function is called if the Ajax request succeeds.
            // The response from the server is a JavaScript object!
            // Note that the Ajax request can succeed, but the response may indicate an error (e.g. if a bad route was specified)
            function handleSuccess( response, textStatus, jqXHR ) {

                //If there is a status for the response an error occurred yet the request succeeded
                //Stops timer and prints error
                if(response.status){
                    stopTimer();
                    updates = 0;
                    $("#table1").html("");
                    label.css("color", "red");
                    label.html(response.status);
                    return;
                }

                let errorResponse = response["bustime-response"].error;
                if(!errorResponse){
                    updateUI(response);
                    updates+=1;

                } else {
                    stopTimer();
                    updates = 0;
                    $("#table1").html("");
                    label.css("color", "red");
                    label.html(errorResponse[0].msg);
                }

            }// end inner function handleSuccess

            // This function is called if the Ajax request fails (e.g. network error, bad url, server timeout, etc)
            function handleError(jqXHR, textStatus, errorThrown) {
                reportText.hide();
                stopTimer();
                updates = 0;
                $("#table1").html("");
                label.css("color", "red");
                label.html("Error processing Ajax request!");
            } // end inner function handerError

        }; // end onLoad "private" method

    }// end "public" constructor

} // end class BusTracker
