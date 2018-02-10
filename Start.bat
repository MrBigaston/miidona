@echo off
echo demarrage du bot
:boot
node indexDev.js
timeout -t 2
echo ça a crash ? rip :/
goto:boot