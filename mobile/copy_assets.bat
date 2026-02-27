@echo off
echo Copying assets... > copy_log.txt
xcopy "c:\Users\ASUS\Downloads\HMS-DEV-main\HMS-DEV-main\assets\karurlogo.png" "c:\Users\ASUS\Downloads\HMS-DEV-main\HMS-DEV-main\HMSMobile\assets\icon.png*" /Y /F >> copy_log.txt 2>&1
xcopy "c:\Users\ASUS\Downloads\HMS-DEV-main\HMS-DEV-main\assets\karurlogo.png" "c:\Users\ASUS\Downloads\HMS-DEV-main\HMS-DEV-main\HMSMobile\assets\adaptive-icon.png*" /Y /F >> copy_log.txt 2>&1
xcopy "c:\Users\ASUS\Downloads\HMS-DEV-main\HMS-DEV-main\assets\karurlogo.png" "c:\Users\ASUS\Downloads\HMS-DEV-main\HMS-DEV-main\HMSMobile\assets\favicon.png*" /Y /F >> copy_log.txt 2>&1
xcopy "c:\Users\ASUS\Downloads\HMS-DEV-main\HMS-DEV-main\assets\karurlogo.png" "c:\Users\ASUS\Downloads\HMS-DEV-main\HMS-DEV-main\HMSMobile\assets\splash-icon.png*" /Y /F >> copy_log.txt 2>&1
echo Done. >> copy_log.txt
