@echo off
title GameVault Backend Server (Port 8080)
echo ===================================================
echo  Starting GameVault REST Server with Temurin 17...
echo ===================================================
set "JAVA_EXE=C:\Program Files\Eclipse Adoptium\jdk-17.0.10.7-hotspot\bin\java.exe"
set "CP=%~dp0backend\target\classes;%~dp0backend\lib\*"
"%JAVA_EXE%" -cp "%CP%" com.gamevault.GameVaultServer
pause
