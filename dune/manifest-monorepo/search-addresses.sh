#!/bin/bash

if [ -z "$1" ]; then
  echo "Pass token symbol as an argument for example: $0 OHM"
  exit 1
fi

symbol="$1"
networks=("polygon" "base" "ethereum" "optimism" "bnb" "celo" "avalanche" "gnosis" "arbitrum" "fantom")

google-chrome --new-window
for network in "${networks[@]}"; do
    search_query="${symbol} ${network} address"
    google-chrome "https://www.google.com/search?q=${search_query}" &
done

wait