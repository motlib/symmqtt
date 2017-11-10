#!/usr/bin/python

import paho.mqtt.client as mqtt
import json
from time import sleep

def on_connect(mqttc, obj, flags, rc):
    print("rc: " + str(rc))


def on_message(mqttc, obj, msg):
    print(msg.topic + " " + str(msg.qos) + " " + str(msg.payload))


def on_publish(mqttc, obj, mid):
    print("mid: " + str(mid))
    pass


def on_subscribe(mqttc, obj, mid, granted_qos):
    print("Subscribed: " + str(mid) + " " + str(granted_qos))


def on_log(mqttc, obj, level, string):
    print(string)


def get_loadavg():
    '''Publish loadavg.'''

    with open('/proc/loadavg') as f:
        lavg = f.readline()

    data = lavg.split(' ')[0:3]

    return {'loadavg': json.dumps(data)}
    
    
topic_prefix = '/sysstat/cn120036/'
fcts = [get_loadavg]


def publish_all(mqttc, fcts):
    for fct in fcts:
        print('Handling', fct.__name__)
        data = fct()

        for topic,payload in data.items():
            t = topic_prefix + topic
            res = mqttc.publish(topic=t, payload=payload)
            res.wait_for_publish()
        

def main():
    mqttc = mqtt.Client()
    #mqttc.on_message = on_message
    #mqttc.on_connect = on_connect
    #mqttc.on_publish = on_publish
    #mqttc.on_subscribe = on_subscribe
    
    # Uncomment to enable debug messages
    # mqttc.on_log = on_log
    mqttc.connect("cn120036.cn.kostal.int", 1883, 60)
    mqttc.loop_start()

    while True:
        publish_all(mqttc, fcts)
        sleep(1)
        
if __name__ == '__main__':
    main()
