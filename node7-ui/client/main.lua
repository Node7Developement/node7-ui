local RESOURCE = GetCurrentResourceName()
local isOpen = false
local nuiReady = false
local currentPayload = nil
local queuedMessages = {}

local function debugPrint(message)
    if Config.Debug then
        print(('[%s] %s'):format(RESOURCE, message))
    end
end

local function cleanPath(value)
    local path = tostring(value or ''):gsub('\\', '/'):gsub('^/+', ''):gsub('/+$', '')
    return path
end

local function imageBase(resourceName, imagePath)
    local resource = tostring(resourceName or Config.InventoryImageResource or 'node7-inventory')
    local path = cleanPath(imagePath or Config.InventoryImagePath or 'html/images')
    return ('https://cfx-nui-%s/%s'):format(resource, path)
end

local function imageUrl(itemName, resourceName, imagePath)
    local name = cleanPath(itemName)
    if name == '' then return '' end
    if not name:match('%.%w+$') then name = name .. '.png' end
    return ('%s/%s'):format(imageBase(resourceName, imagePath), name)
end

local function sendMessage(action, payload)
    local message = {
        namespace = 'node7-ui',
        action = action,
        payload = payload or {}
    }

    if not nuiReady and action ~= 'bootstrap' then
        queuedMessages[#queuedMessages + 1] = message
        return
    end

    SendNUIMessage(message)
end

local function flushQueue()
    if not nuiReady or #queuedMessages == 0 then
        return
    end

    for index = 1, #queuedMessages do
        SendNUIMessage(queuedMessages[index])
    end

    queuedMessages = {}
end

local function copyTable(source)
    if type(source) ~= 'table' then
        return {}
    end

    local copy = {}
    for key, value in pairs(source) do
        if type(value) == 'table' then
            copy[key] = copyTable(value)
        else
            copy[key] = value
        end
    end
    return copy
end

local function normalizePayload(payload)
    local normalized = copyTable(payload)

    normalized.id = normalized.id or ('node7-ui-%s'):format(GetGameTimer())
    normalized.title = normalized.title or 'NODE7 Dominion'
    normalized.subtitle = normalized.subtitle or 'Universal modular interface'
    normalized.cursor = normalized.cursor == nil and Config.DefaultCursor or normalized.cursor == true
    normalized.imageResource = normalized.imageResource or normalized.inventoryImageResource or Config.InventoryImageResource
    normalized.imagePath = normalized.imagePath or normalized.inventoryImagePath or Config.InventoryImagePath
    normalized.imageBase = normalized.imageBase or normalized.inventoryImageBase or imageBase(normalized.imageResource, normalized.imagePath)
    normalized.imageExtensions = normalized.imageExtensions or Config.InventoryImageExtensions
    normalized.maxItems = Config.MaxItemsPerScreen
    normalized.soundEnabled = normalized.soundEnabled == nil and Config.SoundEnabled or normalized.soundEnabled == true
    normalized.soundVolume = tonumber(normalized.soundVolume) or Config.SoundVolume
    normalized.soundCooldown = tonumber(normalized.soundCooldown) or Config.SoundCooldown

    return normalized
end

local function setFocus(enabled, cursor)
    SetNuiFocus(enabled, enabled and cursor == true)

    if SetNuiFocusKeepInput then
        SetNuiFocusKeepInput(enabled and Config.KeepInput == true)
    end
end

local function Open(payload)
    if Config.RespectExistingNuiFocus and not isOpen and IsNuiFocused and IsNuiFocused() then
        debugPrint('Open request ignored because another NUI currently owns focus.')
        return false, 'nui_focused'
    end

    currentPayload = normalizePayload(payload)
    isOpen = true

    setFocus(true, currentPayload.cursor)
    sendMessage('open', currentPayload)
    debugPrint(('Opened UI payload %s'):format(currentPayload.id))

    return currentPayload.id
end

local function Close(reason)
    if not isOpen then
        return false
    end

    isOpen = false
    currentPayload = nil
    setFocus(false, false)
    sendMessage('close', { reason = reason or 'resource' })
    debugPrint(('Closed UI: %s'):format(reason or 'resource'))

    return true
end

local function Update(payload)
    if not isOpen then
        return false
    end

    sendMessage('update', payload or {})
    return true
end

local function ShowToast(data)
    sendMessage('toast', data or {})
end

local function ShowModal(data)
    sendMessage('modal', data or {})
end

local function PlaySound(name, options)
    local payload = copyTable(options)
    payload.name = type(name) == 'string' and name or 'select'
    sendMessage('sound', payload)
    return true
end

local function IsOpen()
    return isOpen
end

local function OpenCheckout(payload)
    local source = copyTable(payload)

    if type(source.modules) == 'table' then
        return Open(source)
    end

    local checkout = type(source.checkout) == 'table' and source.checkout or source
    local screenTitle = checkout.title or source.title or 'Commerce Checkout'

    return Open({
        id = source.id,
        title = source.shellTitle or source.title or 'NODE7 Commerce',
        subtitle = source.subtitle or 'Secure transaction checkout',
        cursor = source.cursor,
        statusLeft = source.statusLeft,
        statusRight = source.statusRight,
        imageResource = source.imageResource,
        imagePath = source.imagePath,
        startModule = 'commerce',
        startScreen = 'checkout',
        modules = {
            {
                id = 'commerce',
                label = source.moduleLabel or 'Commerce',
                screens = {
                    {
                        id = 'checkout',
                        label = source.screenLabel or 'Checkout',
                        title = screenTitle,
                        description = checkout.description or source.description or 'Select quantity, payment, and confirm the transaction.',
                        view = 'checkout',
                        categories = { { id = 'checkout', label = 'Checkout' } },
                        checkout = checkout
                    }
                }
            }
        }
    })
end

local function UpdateCheckout(payload)
    if not isOpen then
        return false
    end

    return Update({
        startModule = 'commerce',
        startScreen = 'checkout',
        modules = {
            {
                id = 'commerce',
                label = payload.moduleLabel or 'Commerce',
                screens = {
                    {
                        id = 'checkout',
                        label = payload.screenLabel or 'Checkout',
                        title = payload.title or 'Commerce Checkout',
                        description = payload.description or 'Select quantity, payment, and confirm the transaction.',
                        view = 'checkout',
                        categories = { { id = 'checkout', label = 'Checkout' } },
                        checkout = type(payload.checkout) == 'table' and payload.checkout or payload
                    }
                }
            }
        }
    })
end

exports('Open', Open)
exports('Close', Close)
exports('Update', Update)
exports('ShowToast', ShowToast)
exports('ShowModal', ShowModal)
exports('PlaySound', PlaySound)
exports('IsOpen', IsOpen)
exports('OpenCheckout', OpenCheckout)
exports('UpdateCheckout', UpdateCheckout)
exports('GetImageUrl', imageUrl)
exports('GetInventoryImageUrl', function(itemName)
    return imageUrl(itemName, Config.InventoryImageResource, Config.InventoryImagePath)
end)

RegisterNetEvent('node7-ui:client:open', function(payload)
    Open(payload)
end)

RegisterNetEvent('node7-ui:client:close', function(reason)
    Close(reason)
end)

RegisterNetEvent('node7-ui:client:update', function(payload)
    Update(payload)
end)

RegisterNetEvent('node7-ui:client:toast', function(data)
    ShowToast(data)
end)

RegisterNetEvent('node7-ui:client:modal', function(data)
    ShowModal(data)
end)

RegisterNetEvent('node7-ui:client:playSound', function(name, options)
    PlaySound(name, options)
end)

RegisterNetEvent('node7-ui:client:soundTest', function()
    local sounds = {
        'open', 'navigate', 'focus', 'select', 'modal', 'info',
        'success', 'warning', 'error', 'confirm', 'cancel', 'close'
    }

    CreateThread(function()
        for index = 1, #sounds do
            PlaySound(sounds[index], { force = true })
            Wait(650)
        end
    end)
end)

RegisterNetEvent('node7-ui:client:notificationTest', function()
    local notifications = {
        { type = 'info', title = 'NODE7 Information', message = 'Standalone UI notification test.', duration = 2800 },
        { type = 'success', title = 'NODE7 Success', message = 'The requested action completed successfully.', duration = 2800 },
        { type = 'warning', title = 'NODE7 Warning', message = 'Review this action before continuing.', duration = 2800 },
        { type = 'error', title = 'NODE7 Error', message = 'The requested action could not be completed.', duration = 2800 }
    }

    CreateThread(function()
        for index = 1, #notifications do
            ShowToast(notifications[index])
            Wait(950)
        end
    end)
end)

RegisterNetEvent('node7-ui:client:permissionDenied', function(commandName)
    ShowToast({
        type = 'error',
        title = 'Access denied',
        message = ('You do not have permission to use /%s.'):format(commandName or 'n7uitest'),
        duration = 5000,
        standalone = true
    })
end)

RegisterNUICallback('node7ui_ready', function(_, callback)
    nuiReady = true

    SendNUIMessage({
        namespace = 'node7-ui',
        action = 'bootstrap',
        payload = {
            resource = RESOURCE,
            imageBase = imageBase(),
            imageResource = Config.InventoryImageResource,
            imagePath = Config.InventoryImagePath,
            soundEnabled = Config.SoundEnabled == true,
            soundVolume = tonumber(Config.SoundVolume) or 0.38,
            soundCooldown = tonumber(Config.SoundCooldown) or 30
        }
    })

    flushQueue()
    callback({ ok = true })
end)

RegisterNUICallback('node7ui_close', function(data, callback)
    local reason = type(data) == 'table' and data.reason or 'nui'
    Close(reason)
    TriggerEvent('node7-ui:client:closed', reason)
    callback({ ok = true })
end)

RegisterNUICallback('node7ui_action', function(data, callback)
    if type(data) ~= 'table' then
        callback({ ok = false, error = 'invalid_payload' })
        return
    end

    TriggerEvent('node7-ui:client:action', data)
    callback({ ok = true })
end)

RegisterNUICallback('node7ui_submit', function(data, callback)
    if type(data) ~= 'table' then
        callback({ ok = false, error = 'invalid_payload' })
        return
    end

    TriggerEvent('node7-ui:client:submit', data)
    callback({ ok = true })
end)

CreateThread(function()
    while true do
        if not isOpen then
            Wait(500)
        else
            Wait(100)

            if Config.CloseOnPause and IsPauseMenuActive() then
                Close('pause_menu')
            end
        end
    end
end)

AddEventHandler('onResourceStop', function(resourceName)
    if resourceName ~= RESOURCE then
        return
    end

    if isOpen then
        setFocus(false, false)
    end
end)
