@echo off
rem Wrapper to run setup.ps1 without changing the execution policy.
rem Arguments are passed through (e.g. setup_wrapper.bat -SkipGitConfig).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1" %*
pause