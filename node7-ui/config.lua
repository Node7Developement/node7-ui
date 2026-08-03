Config = Config or {}

Config.Debug = false
Config.DefaultCursor = true
Config.KeepInput = false
Config.CloseOnPause = true
Config.RespectExistingNuiFocus = true
Config.MaxItemsPerScreen = 250

-- Local PCM WAV feedback. Payloads may override soundEnabled or soundVolume.
Config.SoundEnabled = true
Config.SoundVolume = 0.38
Config.SoundCooldown = 30

-- Optional shared item-image source. node7-ui does not require node7-inventory.
-- Future resources may override imageBase or provide complete image URLs per entry.
Config.InventoryImageResource = 'node7-inventory'
Config.InventoryImagePath = 'html/images'

Config.Permissions = {
    Test = 'node7.ui.test',
    Admin = 'node7.ui.admin'
}

Config.TestCommands = {
    Help = 'n7uihelp',
    Universal = 'n7uitest',
    Commerce = 'n7uicommerce',
    Creation = 'n7uicrafting',
    Character = 'n7uicharacter',
    World = 'n7uiworld',
    Organizations = 'n7uiorgs',
    Services = 'n7uiservices',
    Social = 'n7uisocial',
    Travel = 'n7uitravel',
    Activities = 'n7uiactivities',
    Medical = 'n7uimedical',
    Records = 'n7uirecords',
    Administration = 'n7uiadmin',
    Components = 'n7uicomponents',
    Sound = 'n7uisoundtest',
    Notifications = 'n7uinotifytest',
    Close = 'n7uiclose'
}
