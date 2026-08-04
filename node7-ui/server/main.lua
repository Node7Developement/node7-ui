local RESOURCE = GetCurrentResourceName()

local function hasTestPermission(source)
    if source == 0 then
        return true
    end

    return IsPlayerAceAllowed(source, Config.Permissions.Test)
        or IsPlayerAceAllowed(source, Config.Permissions.Admin)
        or IsPlayerAceAllowed(source, 'node7.admin')
        or IsPlayerAceAllowed(source, 'node7.owner')
end

local function deny(source, commandName)
    print(('[%s] Player %s was denied /%s'):format(RESOURCE, source, commandName))
    TriggerClientEvent('node7-ui:client:permissionDenied', source, commandName)
end

local function registerTestCommand(commandName, demoName)
    RegisterCommand(commandName, function(source)
        if not hasTestPermission(source) then
            deny(source, commandName)
            return
        end

        if source == 0 then
            print(('[%s] /%s must be run by an in-game player.'):format(RESOURCE, commandName))
            return
        end

        TriggerClientEvent('node7-ui:client:openDemo', source, demoName)
    end, true)
end

local demos = {
    Universal = 'universal',
    Commerce = 'commerce',
    Creation = 'creation',
    Character = 'character',
    World = 'world',
    Organizations = 'organizations',
    Services = 'services',
    Social = 'social',
    Travel = 'travel',
    Activities = 'activities',
    Medical = 'medical',
    Records = 'records',
    Administration = 'administration',
    Components = 'components'
}

for key, demoName in pairs(demos) do
    local commandName = Config.TestCommands[key]
    if type(commandName) == 'string' and commandName ~= '' then
        registerTestCommand(commandName, demoName)
    end
end

RegisterCommand(Config.TestCommands.Sound, function(source)
    if not hasTestPermission(source) then
        deny(source, Config.TestCommands.Sound)
        return
    end

    if source == 0 then
        print(('[%s] /%s must be run by an in-game player.'):format(RESOURCE, Config.TestCommands.Sound))
        return
    end

    TriggerClientEvent('node7-ui:client:soundTest', source)
end, true)

RegisterCommand(Config.TestCommands.Notifications, function(source)
    if not hasTestPermission(source) then
        deny(source, Config.TestCommands.Notifications)
        return
    end

    if source == 0 then
        print(('[%s] /%s must be run by an in-game player.'):format(RESOURCE, Config.TestCommands.Notifications))
        return
    end

    TriggerClientEvent('node7-ui:client:notificationTest', source)
end, true)

RegisterCommand(Config.TestCommands.Close, function(source)
    if not hasTestPermission(source) then
        deny(source, Config.TestCommands.Close)
        return
    end

    if source > 0 then
        TriggerClientEvent('node7-ui:client:close', source, 'test_command')
    end
end, true)

RegisterCommand(Config.TestCommands.Help, function(source)
    if not hasTestPermission(source) then
        deny(source, Config.TestCommands.Help)
        return
    end

    if source == 0 then
        print(('[%s] Test commands are documented in README.md.'):format(RESOURCE))
        return
    end

    local commandList = {
        Config.TestCommands.Universal,
        Config.TestCommands.Commerce,
        Config.TestCommands.Creation,
        Config.TestCommands.Character,
        Config.TestCommands.World,
        Config.TestCommands.Organizations,
        Config.TestCommands.Services,
        Config.TestCommands.Social,
        Config.TestCommands.Travel,
        Config.TestCommands.Activities,
        Config.TestCommands.Medical,
        Config.TestCommands.Records,
        Config.TestCommands.Administration,
        Config.TestCommands.Components,
        Config.TestCommands.Sound,
        Config.TestCommands.Notifications,
        Config.TestCommands.Close
    }

    TriggerClientEvent('chat:addMessage', source, {
        color = { 200, 170, 107 },
        multiline = true,
        args = {
            'NODE7 UI',
            '/' .. table.concat(commandList, ' | /')
        }
    })
end, true)

exports('OpenFor', function(source, payload)
    if type(source) ~= 'number' or source <= 0 or type(payload) ~= 'table' then
        return false
    end

    TriggerClientEvent('node7-ui:client:open', source, payload)
    return true
end)

exports('CloseFor', function(source, reason)
    if type(source) ~= 'number' or source <= 0 then
        return false
    end

    TriggerClientEvent('node7-ui:client:close', source, reason or 'server_export')
    return true
end)

exports('ToastFor', function(source, data)
    if type(source) ~= 'number' or source <= 0 or type(data) ~= 'table' then
        return false
    end

    TriggerClientEvent('node7-ui:client:toast', source, data)
    return true
end)

exports('PlaySoundFor', function(source, name, options)
    if type(source) ~= 'number' or source <= 0 or type(name) ~= 'string' then
        return false
    end

    TriggerClientEvent('node7-ui:client:playSound', source, name, type(options) == 'table' and options or {})
    return true
end)


exports('OpenFormFor', function(source, data)
    if type(source) ~= 'number' or source <= 0 or type(data) ~= 'table' then
        return false
    end

    TriggerClientEvent('node7-ui:client:form', source, data)
    return true
end)
