# NODE7 UI

Full-screen animated ESO × Red Dead scene shell for NODE7 RedM resources.

`node7-ui` supplies reusable UI structure only. It does not own inventory, money, banking, shops, crafting, housing, jobs, gangs, medical data, records, or framework state. Resources can connect their own data later through the existing generic NODE7 UI API.

## Version 1.4.3

- True full-screen overlay shell
- No native dropdown menus; legacy `select` payloads render as RedM-safe choice cards
- No traditional vertical menu lists
- Styled scrollbars appear only inside panels that genuinely overflow
- Compass-based realm navigation
- Four visible chapter scenes per realm
- Category constellations with page rotation
- Paginated grids, lists, dashboards, tables, trees, dialogue, forms, dual views, and component scenes
- Large animated inspection region
- Animated smoke, dust, tracing lines, compass rings, item hover, preview float, progress glints, and scene transitions
- Supplied NODE7 Development Studios logo embedded locally in `html/images/node7-logo.png`
- Subtle animated borders, selected-card breathing, corner tracing, hover lift, and inspector aura
- Twelve local PCM WAV feedback sounds for opening, closing, navigation, focus, selection, confirmation, cancellation, modals, and notification states
- Standalone notifications display and play feedback even while the full UI shell is closed
- Automatic `node7-inventory/html/images` lookup with text fallback
- Fully scoped `n7ui-` HTML, CSS, JavaScript, NUI callbacks, events, and exports
- Transparent document while closed; no idle black screen
- Existing NUI focus protection and pause-menu closing

## Included realms

- Commerce
- Creation
- Character
- World
- Organizations
- Services
- Social
- Travel
- Activities
- Medical
- Records
- Administration
- Components

Each realm contains four reusable scene structures.

## Installation

```cfg
exec @node7-ui/permissions.cfg
ensure node7-ui
```

No SQL is required. `node7-core` is not modified.

## Controls

```text
Q / E             Previous or next realm
Left / Right      Previous or next chapter scene
Up / Down         Change selected entry
Page Up / Down    Change category
A / D             Previous or next content page
Enter             Trigger the selected preview action
Escape/Backspace  Close
```

Mouse selection remains available for resources that open the shell with cursor support.

## Test commands

```text
/n7uihelp
/n7uitest
/n7uicommerce
/n7uicrafting
/n7uicharacter
/n7uiworld
/n7uiorgs
/n7uiservices
/n7uisocial
/n7uitravel
/n7uiactivities
/n7uimedical
/n7uirecords
/n7uiadmin
/n7uicomponents
/n7uisoundtest
/n7uinotifytest
/n7uiclose
```

## ACE permissions

The included `permissions.cfg` supports:

```text
group.node7_admin
group.node7_owner
group.admin
```

Permission objects:

```text
node7.ui.admin
node7.ui.test
```

Every restricted test command also has its matching `command.<name>` ACE.

## Browser preview

Open `html/index.html` directly. Browser mode loads local preview data and does not contact RedM or NODE7 resources.

## Client API

```lua
exports['node7-ui']:Open(payload)
exports['node7-ui']:Update(payload)
exports['node7-ui']:Close('resource_request')
exports['node7-ui']:ShowToast(data)
exports['node7-ui']:ShowModal(data)
exports['node7-ui']:PlaySound('confirm', { volume = 1.0 })
exports['node7-ui']:IsOpen()
```

Equivalent client events:

```lua
TriggerEvent('node7-ui:client:open', payload)
TriggerEvent('node7-ui:client:update', payload)
TriggerEvent('node7-ui:client:close', 'reason')
TriggerEvent('node7-ui:client:toast', data)
TriggerEvent('node7-ui:client:modal', data)
TriggerEvent('node7-ui:client:playSound', 'confirm', { volume = 1.0 })
```

All UI actions are routed through:

```lua
AddEventHandler('node7-ui:client:action', function(data)
    print(json.encode(data))
end)

AddEventHandler('node7-ui:client:submit', function(data)
    print(json.encode(data))
end)
```

## Server API

```lua
exports['node7-ui']:OpenFor(source, payload)
exports['node7-ui']:CloseFor(source, 'server_request')
exports['node7-ui']:ToastFor(source, data)
exports['node7-ui']:PlaySoundFor(source, 'success', { volume = 1.0 })
```

## Supported scene views

```text
grid
list
dashboard
table
tree
dialogue
form
dual
components
```

Data-heavy catalogue views use fixed visible capacity and page rotation. Checkout, forms, payment methods, and modal fields use a styled scrollbar only when their content exceeds the available panel height.

## Image support

An entry can use:

```lua
item = 'bread'
```

Default lookup:

```text
https://cfx-nui-node7-inventory/html/images/bread.png
```

Other supported forms:

```lua
image = 'bread.png'
imageResource = 'another-resource'
image = 'html/images/custom.png'
image = 'https://cfx-nui-another-resource/html/images/custom.png'
```

Missing images fall back to a monogram without breaking the layout.


For cross-resource loading, `node7-inventory` must expose its image folder in that resource's `fxmanifest.lua`:

```lua
files {
    'html/images/*'
}
```

`node7-ui` then resolves `item`, `itemName`, `image`, `imageUrl`, `thumbnail`, `imageResource`, and `imagePath` values without copying the inventory images into this resource.


## Local sound feedback

The resource includes these standard PCM WAV names:

```text
open
close
navigate
focus
select
confirm
cancel
modal
info
success
warning
error
```

Global defaults:

```lua
Config.SoundEnabled = true
Config.SoundVolume = 0.38
Config.SoundCooldown = 30
```

A payload may override them without changing global configuration:

```lua
soundEnabled = true
soundVolume = 0.45
soundCooldown = 40
```

Notifications automatically use the matching `info`, `success`, `warning`, or `error` WAV. Set `sound = false` to silence a specific notification, or provide another bundled sound name.

## Standalone notifications

`ShowToast` and `ToastFor` now display outside the full shell automatically when it is closed:

```lua
exports['node7-ui']:ShowToast({
    type = 'success',
    title = 'Purchase Complete',
    message = 'The item was added successfully.',
    duration = 3500
})
```

Set `standalone = false` only when a notification must be restricted to the open full-screen UI.


## Commerce controls and inventory images

Version 1.4.3 provides quantity steppers, direct numeric entry, presets, text and textarea inputs, button-card choices, single and grouped checkboxes, toggles, ranges, required-field validation, transaction summaries, and submitted field values. Native HTML dropdowns are never created; older `type = 'select'` payloads are converted automatically into clickable choice cards.

Inventory artwork is resolved from `node7-inventory/html/images` by default. Entries may provide only `item = 'apple'`, `image = 'apple.png'`, `image = 'html/images/apple.png'`, or an explicit `imageResource`/`imagePath`. The UI tries PNG, WEBP, JPG, and JPEG candidates before showing the monogram fallback.

Client exports:

```lua
local image = exports['node7-ui']:GetInventoryImageUrl('apple')
local custom = exports['node7-ui']:GetImageUrl('apple.png', 'node7-inventory', 'html/images')
```

The source resource must expose its image files in its own `fxmanifest.lua`, for example `files { 'html/images/*.png' }`.

## Commerce checkout view

Use `view = 'checkout'` with a `checkout` table for first-class shop checkout support. The view includes direct whole-number quantity input, ± step controls, bulk controls, presets/MAX, selectable payment methods, live totals, optional confirmations/notes, and a final confirmation action.

Exports:

```lua
exports['node7-ui']:OpenCheckout(payload)
exports['node7-ui']:UpdateCheckout(payload)
```

Checkout actions are returned through `node7-ui:client:action` in `data.checkout`, including `itemId`, `quantity`, `paymentMethod`, `subtotal`, `tax`, `fee`, `discount`, `total`, confirmations, and note.

## Optimized package

The runtime resource is kept below 100 files. The optional physical card artwork is stored as one archive at `extras/node7-card-assets.zip`; it is not loaded by RedM and can be extracted separately for editing. Checkout, quantity controls, exports, and `node7-inventory/html/images` resolution remain part of the runtime UI.


## RedM-safe payment selection

Cash, bank, and any custom payment methods render as large clickable cards with an active indicator, account description, and available balance. The UI never uses a native HTML dropdown for payment selection. When a checkout payload does not provide payment methods, NODE7 UI supplies Cash and Bank cards automatically; scripts can override balances with `cashBalance`, `bankBalance`, or `money = { cash = ..., bank = ... }`.

Long payment lists, checkout summaries, commerce controls, and modal fields use the custom brass scrollbar only when needed.
