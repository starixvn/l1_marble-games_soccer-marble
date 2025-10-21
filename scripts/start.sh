#!/bin/sh
CONFIG_FILE="game-config.json"
GAME=$(grep '"gameId":' "$CONFIG_FILE" | cut -d ':' -f 2 | tr -d '", \t\n\r')
echo "Game ID is: $GAME"
cp -rf $CONFIG_FILE apps/$GAME/dist
cd apps/$GAME
node --experimental-loader=extensionless dist/app.js
