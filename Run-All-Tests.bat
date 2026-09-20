@echo off
cd /d "%~dp0"
node scripts\run-all-tests.mjs
if errorlevel 1 (echo. & echo TESTS FAILED) else (echo. & echo ALL TESTS PASSED)
pause
