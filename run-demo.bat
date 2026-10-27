@echo off
title GameVault Backend Demo Tests
echo ===================================================
echo  Running GameVault Backend JDBC Tests...
echo ===================================================
set "JAVA_EXE=C:\Program Files\Eclipse Adoptium\jdk-17.0.10.7-hotspot\bin\java.exe"
set "CP=%~dp0backend\target\classes;%~dp0backend\lib\*"
"%JAVA_EXE%" -cp "%CP%" com.gamevault.Main
pause
