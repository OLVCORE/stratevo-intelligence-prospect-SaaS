@echo off
echo ==========================================
echo DEPLOY: bulk-upload-companies
echo ==========================================
echo.

supabase functions deploy bulk-upload-companies --project-ref vkdvezuivlovzqxmnohk

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCESSO! Deploy concluido.
    echo.
    echo URL: https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/bulk-upload-companies
    echo.
) else (
    echo.
    echo ERRO no deploy.
    echo.
    echo Se nao estiver logado, rode: supabase login
    echo.
)

pause

