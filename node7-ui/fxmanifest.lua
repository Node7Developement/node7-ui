fx_version 'cerulean'
game 'rdr3'

rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'

author 'NODE7 Development Studios'
description 'Full-screen animated ESO and Red Dead inspired scene-based NUI shell for NODE7 RedM resources.'
version '1.3.0'

lua54 'yes'

ui_page 'html/index.html'

shared_script 'config.lua'

client_scripts {
    'client/main.lua',
    'client/demos.lua'
}

server_script 'server/main.lua'

files {
    'html/index.html',
    'html/css/app.css',
    'html/js/app.js',
    'html/images/*',
    'html/sounds/*.wav'
}
