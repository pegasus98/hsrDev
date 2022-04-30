#! /bin/bash

cd "$(dirname $(readlink -f $0))"
set -e
source config.sh

TIME_DUR=$4
SERVER_IP=$2
SERVER=root@$SERVER_IP


if [[ `id -u` -ne 0 ]] ; then
  echo This script can only be executed by root.
  exit 1
fi

if [[ "$#" -lt "1" ]] ; then
  echo Usage: $0 CMD
  exit 1
fi

if [[ "$1" == "dummy" ]] ; then
  exit
fi

if [[ "$1" == "getip" ]] ; then
  curl https://ipapi.co/json/
  curl https://icanhazip.com/
  exit
fi

NETIF=`ip route show | grep -oh -m 1 "rmnet_data[0-9]"`
if [[ -z "$NETIF" ]] ; then
  echo Missing rmnet_data, fallback to wlan...
  NETIF=`ip route show | grep -oh -m 1 "wlan[0-9]"`
  if [[ -z "$NETIF" ]] ; then
    echo Missing wlan, exiting...
    exit 1
  fi
fi
echo NETIF: $NETIF

run_bbr() {
  $IPERF3 -R -t $TIME_DUR -c $SERVER_IP -p $BBR_PORT -T speedmsg &
  sleep $((TIME_DUR+5))
  kill $! || true
  wait $! || true
}

prepare_bbr() {
  echo $DATE | timeout 5 nc -N $SERVER_IP $BBR_CTRL_PORT
}

run_udp() {
  $IPERF3 -R -t $TIME_DUR -c $SERVER_IP -p $UDP_PORT -u -b `cat UDP-BITRATE` &
  sleep $((TIME_DUR+5))
  kill $! || true
  wait $! || true
}

prepare_udp() {
  true
}

run_quic() {
  $QUIC_CLIENT -s $SERVER_IP:$QUIC_PORT -p 10000000000:0 -g -j &
  sleep $((TIME_DUR+5))
  kill $! || true
  wait $! || true
}

prepare_quic() {
  echo $DATE | timeout 5 nc -N $SERVER_IP $QUIC_CTRL_PORT
}

run_lat() {
  latency/send_packets $SERVER_IP $((TIME_DUR*20)) &
  sleep $((TIME_DUR+3))
  kill $! || true
  wait $! || true
}

prepare_lat() {
  true
}

run_http() {
  sudo -u android python3 android-http.py > $LOG_DIR/http
}

prepare_http() {
  true
}

DATE=$3
LOG_DIR=logs/$DATE
mkdir -p $LOG_DIR
mkdir -p $LOG_DIR/pcap

signal_handler() {
  pkill tcpdump || true 
  pkill diag || true
  exit
}

trap signal_handler INT

pkill tcpdump || true
pkill diag || true
prepare_$1

tcpdump -i $NETIF -s 96 -G 1 -w $LOG_DIR/pcap/%Y_%m%d_%H%M_%S.pcap &
diag_logcat/diag_logcat diag_logcat/Diag-5G.cfg $LOG_DIR/l2 $LOG_DIR/l2 &

sleep 2
run_$1 | tee $LOG_DIR/$1
sleep 2

pkill tcpdump || true
pkill diag || true
