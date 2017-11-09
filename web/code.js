var mqtt;
var reconnectTimeout = 2000;

var handlers = {
    'loadavg': handleLoadAvg
}

/** Init to connect to MQTT broker. */
function MQTTconnect() {
    if (typeof path == "undefined") {
    	path = '/mqtt';
    }
    mqtt = new Paho.MQTT.Client(
    		host,
    		port,
    		path,
    		"web_" + parseInt(Math.random() * 100, 10)
    );
    var options = {
        timeout: 3,
        useSSL: useTLS,
        cleanSession: cleansession,
        onSuccess: onConnect,
        onFailure: function (message) {
            $('#status').val("Connection failed: " + message.errorMessage + "Retrying");
            setTimeout(MQTTconnect, reconnectTimeout);
        }
    };

    mqtt.onConnectionLost = onConnectionLost;
    mqtt.onMessageArrived = onMessageArrived;

    if (username != null) {
        options.userName = username;
        options.password = password;
    }
    console.log(
        "Host=" + host
            + ", port=" + port
            + ", path=" + path
            + " TLS = " + useTLS
            + " username=" + username
            + " password=" + password);
    
    mqtt.connect(options);
}

function onConnect() {
    $('#status').val('Connected to ' + host + ':' + port + path);
    $('#status').css('background-color', 'green');

    // Connection succeeded; subscribe to our topic

    var host = window.location.hash.substr(1);
    
    topic = '/sysstat/' + host + '/#';

    mqtt.subscribe(topic, {qos: 0});
    
    $('#topic').val(topic);
}

/*
 * Called when the MQTT connection is lost. 
 *
 * Sets a timer to re-establish the connection.
 */
function onConnectionLost(response) {
    setTimeout(MQTTconnect, reconnectTimeout);
    $('#status').val("connection lost: " + response.errorMessage + ". Reconnecting...");
    $('#status').css('background-color', 'red');
};

function onMessageArrived(message) {

    var topic = message.destinationName;
    var payload = message.payloadString;

    var tparts = topic.split('/');


    var key = tparts[3];
    if(key in handlers) {
        handlers[tparts[3]](payload);
    } else {
        console.log('Got unhandled topic ' + topic);
    }
};

function handleLoadAvg(payload) {
    $('#loadavg').text(payload);
    
}

$(document).ready(function() {
    MQTTconnect();
});
