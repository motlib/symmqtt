var mqtt;
var reconnectTimeout = 2000;

var handlers = {
    'loadavg': handleLoadAvg
}

/** Init to connect to MQTT broker. */
function MQTTconnect() {
    mqtt = new Paho.MQTT.Client(
    	config['broker'],
    	config['port'],
    	config['path'],
    	"web_" + parseInt(Math.random() * 100, 10)
    );
    
    var options = {
        timeout: 3,
        useSSL: config['useTLS'],
        cleanSession: config['cleansession'],
        onSuccess: onConnect,
        onFailure: onFailure
    };

    if ('username' in config) {
        options.userName = config['username'];
        options.password = config['password'];
    }

    mqtt.onConnectionLost = onConnectionLost;
    mqtt.onMessageArrived = onMessageArrived;

    /* pseudo-secure, as password is contained in config file. */
    cfg2 = config;
    cfg2['password'] = '***';
    console.log(cfg2);
    
    mqtt.connect(options);
}


function onFailure(message) {
    $('#status').val("Connection failed: " + message.errorMessage + "Retrying");
    setTimeout(MQTTconnect, reconnectTimeout);
}
    

function onConnect() {
    $('#status').val('Connected to ' + mqtt.host + ':' + mqtt.port + mqtt.path);
    $('#status').css('background-color', 'lightgreen');

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
        handlers[key](topic, payload);
    } else {
        console.log('Got unhandled topic ' + topic);
    }
};


function getRgb(val) {
    val = parseFloat(val);
    
    /* Return gray color, if input is not a float. */
    if(val == NaN) {
        return 'gray';
    }
    
    if(val < 0.0) val = 0;
    if(val > 1.0) val = 1.0;
    
    var r = val * 255;
    var g = (1.0 - val) * 255;

    return 'rgb(' + r + ',' + g + ',0)';
}


function handleLoadAvg(topic, payload) {
    $('#loadavg').html(payload);

    var color = getRgb(payload);
    $('#loadavg').css('background-color', color);
}

$(document).ready(function() {
    MQTTconnect();
});
