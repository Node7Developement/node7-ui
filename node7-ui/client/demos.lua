local function item(id, label, icon, category, value, badge, description)
    return {
        id = id,
        label = label,
        icon = icon,
        category = category,
        value = value,
        badge = badge,
        description = description,
        stats = {
            { label = 'Category', value = category },
            { label = 'State', value = badge },
            { label = 'Value', value = value },
            { label = 'Source', value = 'Preview data' }
        },
        actions = {
            { id = 'primary', label = 'Preview Action', style = 'primary' },
            { id = 'inspect', label = 'Inspect', style = 'secondary' }
        }
    }
end

local function genericItems(prefix)
    return {
        item(prefix .. '_featured', 'Featured Entry', 'FE', 'featured', '$24.50', 'Rare', 'Featured card structure with image, value, badge, metadata, and actions.'),
        item(prefix .. '_standard', 'Trail Revolver', 'TR', 'weapons', '$58.25', 'Common', 'Weapon card structure for shops, inventories, and equipment.'),
        item(prefix .. '_utility', 'Ranch Coat', 'RC', 'clothing', '$12.00', 'Uncommon', 'Clothing entry structure for apparel, outfits, and appearance.'),
        item(prefix .. '_resource', 'Miracle Tonic', 'MT', 'consumables', '$4.75', 'Common', 'Consumable entry structure for tonics, food, and medicine.'),
        item(prefix .. '_unique', 'Ledger Entry', 'LE', 'documents', 'Filed', 'Unique', 'Document entry structure for records, permits, and reports.'),
        item(prefix .. '_locked', 'Stable Wash', 'SW', 'services', '$15.00', 'Locked', 'Service entry structure for stables, shops, and interactions.'),
        item(prefix .. '_timed', 'Timed Entry', 'TE', 'timed', '18m', 'Active', 'Timed, queued, or expiring entry structure.'),
        item(prefix .. '_custom', 'Custom Entry', 'CE', 'custom', 'Flexible', 'Custom', 'Flexible custom structure for future resources.')
    }
end

local function categories()
    return {
        { id = 'all', label = 'All' },
        { id = 'featured', label = 'Featured' },
        { id = 'weapons', label = 'Weapons' },
        { id = 'clothing', label = 'Clothing' },
        { id = 'consumables', label = 'Consumables' },
        { id = 'tools', label = 'Tools' },
        { id = 'materials', label = 'Materials' },
        { id = 'services', label = 'Services' },
        { id = 'documents', label = 'Documents' },
        { id = 'unique', label = 'Unique' }
    }
end

local function gridScreen(id, label, description)
    return {
        id = id,
        label = label,
        title = label,
        description = description,
        view = 'grid',
        categories = categories(),
        items = genericItems(id)
    }
end

local function listScreen(id, label, description)
    return {
        id = id,
        label = label,
        title = label,
        description = description,
        view = 'list',
        categories = categories(),
        items = genericItems(id)
    }
end

local function dashboardScreen(id, label, description)
    return {
        id = id,
        label = label,
        title = label,
        description = description,
        view = 'dashboard',
        categories = {
            { id = 'overview', label = 'Overview' },
            { id = 'activity', label = 'Activity' },
            { id = 'access', label = 'Access' }
        },
        metrics = {
            { id = 'balance', label = 'Current Balance', value = '$1,245.75', progress = 72, description = 'Primary value summary structure.' },
            { id = 'capacity', label = 'Capacity', value = '68 / 120', progress = 57, description = 'Capacity and weight summary structure.' },
            { id = 'standing', label = 'Standing', value = 'Respected', progress = 84, description = 'Standing or reputation summary structure.' },
            { id = 'active', label = 'Active Entries', value = '12', progress = 61, description = 'Active record count structure.' },
            { id = 'pending', label = 'Pending Actions', value = '3', progress = 35, description = 'Pending action summary structure.' },
            { id = 'completion', label = 'Completion', value = '76%', progress = 76, description = 'Progress and completion structure.' }
        }
    }
end

local function commerceDashboardScreen()
    return {
        id = 'commerce_dashboard',
        label = 'Commerce Dashboard',
        title = 'Commerce Dashboard',
        description = 'Complete reusable transaction controls for shops, sell markets, trades, auctions, and black markets.',
        view = 'dashboard',
        categories = { { id = 'overview', label = 'Transaction' } },
        metrics = {
            { id = 'funds', label = 'Available Funds', value = '$245.00', progress = 72, description = 'Available purchase balance.' },
            { id = 'stock', label = 'Stock', value = '48', progress = 80, description = 'Available merchant stock.' },
            { id = 'capacity', label = 'Carry Capacity', value = '36 / 80', progress = 45, description = 'Inventory capacity before purchase.' },
            { id = 'standing', label = 'Merchant Standing', value = 'Trusted', progress = 88, description = 'Current merchant standing.' }
        },
        dashboard = {
            kicker = 'Commerce Dashboard',
            title = 'Configure Purchase',
            description = 'Direct quantity input, presets, payment selection, checkboxes, delivery toggle, and optional notes.',
            fields = {
                { id = 'quantity', label = 'Quantity', type = 'quantity', min = 1, max = 99, value = 1, presets = { 1, 5, 10, 25 }, required = true },
                { id = 'payment', label = 'Payment Account', type = 'choice', value = 'cash', options = {
                    { value = 'cash', label = 'Cash', description = 'Pay from carried cash' },
                    { value = 'bank', label = 'Bank', description = 'Charge the connected bank account' }
                } },
                { id = 'options', label = 'Order Options', type = 'checkboxes', options = {
                    { value = 'inspect', label = 'Inspect before purchase' },
                    { value = 'receipt', label = 'Request receipt', checked = true }
                } },
                { id = 'delivery', label = 'Direct Delivery', type = 'toggle', value = true, optionLabel = 'Deliver to inventory' },
                { id = 'note', label = 'Order Note', type = 'text', placeholder = 'Optional merchant note', maxLength = 80 }
            },
            summary = { title = 'Trail Revolver', unitPrice = 58.25, quantityField = 'quantity', currency = '$', taxRate = 0.02 },
            actions = {
                { id = 'clear', label = 'Clear', validate = false },
                { id = 'purchase', label = 'Purchase', style = 'primary' }
            }
        }
    }
end

local function tableScreen(id, label, description)
    return {
        id = id,
        label = label,
        title = label,
        description = description,
        view = 'table',
        categories = {
            { id = 'all', label = 'All Records' },
            { id = 'active', label = 'Active' },
            { id = 'closed', label = 'Closed' }
        },
        table = {
            columns = {
                { key = 'entry', label = 'Entry' },
                { key = 'category', label = 'Category' },
                { key = 'status', label = 'Status' },
                { key = 'value', label = 'Value' }
            },
            rows = {
                { id = id .. '_1', entry = 'Primary Record', category = 'General', status = 'Active', value = '$125.00' },
                { id = id .. '_2', entry = 'Secondary Record', category = 'Pending', status = 'Review', value = '$80.00' },
                { id = id .. '_3', entry = 'Archived Record', category = 'History', status = 'Closed', value = '$45.50' },
                { id = id .. '_4', entry = 'Restricted Record', category = 'Staff', status = 'Locked', value = 'Restricted' },
                { id = id .. '_5', entry = 'Timed Record', category = 'Contract', status = '18m', value = '$220.00' }
            }
        }
    }
end

local function treeScreen(id, label, description)
    return {
        id = id,
        label = label,
        title = label,
        description = description,
        view = 'tree',
        categories = {
            { id = 'core', label = 'Core Line' },
            { id = 'utility', label = 'Utility Line' },
            { id = 'mastery', label = 'Mastery Line' }
        },
        tree = {
            columns = {
                {
                    label = 'Core Line',
                    nodes = {
                        item(id .. '_core_1', 'Core Ability I', 'C1', 'active', 'Rank 1', 'Unlocked', 'First active skill node structure.'),
                        item(id .. '_core_2', 'Core Ability II', 'C2', 'passive', 'Rank 2', 'Available', 'Second skill node structure.'),
                        item(id .. '_core_3', 'Core Ability III', 'C3', 'passive', 'Rank 3', 'Locked', 'Requirement-gated skill node structure.')
                    }
                },
                {
                    label = 'Utility Line',
                    nodes = {
                        item(id .. '_utility_1', 'Utility Ability I', 'U1', 'passive', 'Rank 1', 'Unlocked', 'Utility skill node structure.'),
                        item(id .. '_utility_2', 'Utility Ability II', 'U2', 'active', 'Rank 2', 'Available', 'Second utility node structure.'),
                        item(id .. '_utility_3', 'Utility Ability III', 'U3', 'passive', 'Rank 3', 'Locked', 'Advanced utility node structure.')
                    }
                },
                {
                    label = 'Mastery Line',
                    nodes = {
                        item(id .. '_mastery_1', 'Mastery I', 'M1', 'passive', 'Rank 1', 'Unlocked', 'Mastery progression node structure.'),
                        item(id .. '_mastery_2', 'Mastery II', 'M2', 'passive', 'Rank 2', 'Available', 'Second mastery node structure.'),
                        item(id .. '_mastery_3', 'Mastery III', 'M3', 'active', 'Rank 3', 'Locked', 'Final mastery node structure.')
                    }
                }
            }
        }
    }
end

local function dialogueScreen(id, label, description)
    return {
        id = id,
        label = label,
        title = label,
        description = description,
        view = 'dialogue',
        categories = {
            { id = 'conversation', label = 'Conversation' },
            { id = 'requirements', label = 'Requirements' },
            { id = 'rewards', label = 'Rewards' }
        },
        dialogue = {
            speaker = 'Frontier Contact',
            text = 'This dialogue structure supports speaker identity, narrative text, selectable responses, checks, quest details, consequences, and future voice or camera integrations.',
            responses = {
                { id = 'accept', label = 'Accept the available task.' },
                { id = 'details', label = 'Ask for additional information.' },
                { id = 'requirements', label = 'Review requirements and possible rewards.' },
                { id = 'leave', label = 'Leave the conversation.' }
            }
        }
    }
end

local function formScreen(id, label, description)
    return {
        id = id,
        label = label,
        title = label,
        description = description,
        view = 'form',
        categories = {
            { id = 'identity', label = 'Identity' },
            { id = 'details', label = 'Details' },
            { id = 'review', label = 'Review' }
        },
        form = {
            submitLabel = 'Preview Submission',
            fields = {
                { id = 'name', label = 'Display Name', type = 'text', placeholder = 'Enter a value', required = true },
                { id = 'amount', label = 'Amount', type = 'number', min = 1, max = 100, value = 1, required = true },
                { id = 'category', label = 'Category', type = 'choice', options = {
                    { value = 'general', label = 'General' },
                    { value = 'priority', label = 'Priority' },
                    { value = 'restricted', label = 'Restricted' }
                } },
                { id = 'notes', label = 'Notes', type = 'textarea', placeholder = 'Optional details' },
                { id = 'enabled', label = 'Enable option', type = 'checkbox', value = true }
            }
        }
    }
end

local function componentScreen(id, label, description)
    return {
        id = id,
        label = label,
        title = label,
        description = description,
        view = 'components',
        categories = {
            { id = 'overlays', label = 'Overlays' },
            { id = 'feedback', label = 'Feedback' },
            { id = 'states', label = 'States' }
        },
        components = {
            { id = 'modal', label = 'Confirmation Modal', description = 'Confirmation, warning, purchase, crafting, trade, or property overlay.', action = 'modal' },
            { id = 'toast', label = 'Toast Notification', description = 'Success, information, warning, or error notification.', action = 'toast' },
            { id = 'progress', label = 'Progress Structure', description = 'Timed, loading, crafting, queue, or activity progress.', action = 'toast' },
            { id = 'quantity', label = 'Quantity Selector', description = 'Purchase, transfer, split, crafting, or deposit amount control.', action = 'modal' },
            { id = 'empty', label = 'Empty State', description = 'Empty, unavailable, disabled, locked, or missing-content presentation.', action = 'toast' },
            { id = 'loading', label = 'Loading State', description = 'Skeleton and pending-content presentation.', action = 'toast' }
        }
    }
end

local function dualScreen(id, label, description)
    return {
        id = id,
        label = label,
        title = label,
        description = description,
        view = 'dual',
        categories = {
            { id = 'offer', label = 'Offer' },
            { id = 'history', label = 'History' },
            { id = 'permissions', label = 'Permissions' }
        },
        dual = {
            left = { title = 'Your Side', items = genericItems(id .. '_left') },
            right = { title = 'Other Side', items = genericItems(id .. '_right') }
        }
    }
end

local function universalPayload(startModule)
    return {
        id = 'node7-ui-universal-demo',
        title = 'NODE7 Dominion',
        subtitle = 'Full-screen universal interface shell',
        statusLeft = { label = 'NODE7 Framework', value = 'UI structure only' },
        statusRight = { label = 'Preview state', value = 'Isolated · No script conflicts' },
        controls = {
            { key = 'Q / E', label = 'Realm' },
            { key = '← / →', label = 'Scene' },
            { key = '↑ / ↓', label = 'Select' },
            { key = 'A / D', label = 'Page' },
            { key = 'ENTER', label = 'Action' },
            { key = 'ESC', label = 'Close' }
        },
        cursor = true,
        startModule = startModule or 'commerce',
        startScreen = (startModule == nil or startModule == 'commerce') and 'commerce_dashboard' or nil,
        modules = {
            {
                id = 'commerce',
                label = 'Commerce',
                screens = {
                    gridScreen('vendor', 'Vendor Catalogue', 'Shop, catalogue, filtering, stock, quantity, item image, and inspection structure.'),
                    commerceDashboardScreen(),
                    listScreen('buy_sell', 'Buy & Sell', 'Purchase, selling, valuation, stock comparison, and action-row structure.'),
                    tableScreen('auction', 'Auction House', 'Listing, bid, seller, expiry, category, and pricing structure.')
                }
            },
            {
                id = 'creation',
                label = 'Creation',
                screens = {
                    gridScreen('crafting', 'Crafting Station', 'Recipe, ingredient, quantity, output, requirement, and category structure.'),
                    listScreen('blacksmith', 'Blacksmith', 'Forge, repair, upgrade, quality, material, and durability structure.'),
                    dashboardScreen('production', 'Production Queue', 'Queued work, timing, capacity, progress, and output structure.'),
                    formScreen('recipe_form', 'Recipe Configuration', 'Reusable structured form for configurable production workflows.')
                }
            },
            {
                id = 'character',
                label = 'Character',
                screens = {
                    gridScreen('inventory', 'Inventory', 'Item grid, images, quantity, durability, metadata, weight, and action structure.'),
                    dashboardScreen('equipment', 'Equipment', 'Equipment, condition, character values, slot, and comparison structure.'),
                    treeScreen('skills', 'Skill Lines', 'ESO-style active and passive skill progression structure.'),
                    tableScreen('statistics', 'Character Sheet', 'Statistics, resistances, reputation, survival, and modifier structure.')
                }
            },
            {
                id = 'world',
                label = 'World',
                screens = {
                    listScreen('quests', 'Quest Journal', 'Quest, objective, reward, tracker, distance, and state structure.'),
                    dialogueScreen('dialogue', 'Dialogue', 'Speaker, narrative, response, check, and consequence structure.'),
                    dashboardScreen('housing', 'Housing', 'Property, reserve, access, storage, furniture, and ownership structure.'),
                    gridScreen('contracts', 'Contract Board', 'Reward, difficulty, distance, requirement, and expiry structure.')
                }
            },
            {
                id = 'organizations',
                label = 'Organizations',
                screens = {
                    dashboardScreen('jobs', 'Jobs', 'Employment, duty, rank, progression, contract, and permission structure.'),
                    listScreen('gangs', 'Gangs & Factions', 'Roster, hierarchy, treasury, territory, permission, and activity structure.'),
                    tableScreen('law', 'Law Records', 'Warrant, fine, evidence, sentence, report, and status structure.'),
                    dashboardScreen('business', 'Business Management', 'Revenue, expenses, stock, employees, access, and transaction structure.')
                }
            },
            {
                id = 'services',
                label = 'Services',
                screens = {
                    dashboardScreen('banking', 'Banking', 'Account, transfer, deposit, withdrawal, history, and reserve structure.'),
                    gridScreen('stable', 'Stable & Horses', 'Horse, wagon, bonding, statistics, equipment, and active selection structure.'),
                    listScreen('mail', 'Mail & Deliveries', 'Message, parcel, sender, recipient, attachment, and delivery structure.'),
                    gridScreen('storage', 'Storage & Stashes', 'Container, capacity, access, image, item, and transfer structure.')
                }
            },
            {
                id = 'social',
                label = 'Social',
                screens = {
                    listScreen('player_directory', 'Player Directory', 'Player identity, availability, status, role, and interaction structure.'),
                    dialogueScreen('social_dialogue', 'Social Interaction', 'Conversation, response, relationship, invitation, and consequence structure.'),
                    dashboardScreen('reputation', 'Reputation', 'Town, faction, honour, standing, benefit, and hostility structure.'),
                    tableScreen('community_records', 'Community Records', 'Public listing, application, membership, and status structure.')
                }
            },
            {
                id = 'travel',
                label = 'Travel',
                screens = {
                    gridScreen('destinations', 'Destinations', 'Destination, fare, distance, route, requirement, and availability structure.'),
                    dashboardScreen('transport', 'Transport', 'Train, wagon, coach, route, capacity, and condition structure.'),
                    listScreen('routes', 'Route Planner', 'Waypoint, stop, danger, distance, timing, and travel-state structure.'),
                    tableScreen('travel_permits', 'Travel Permits', 'Permit, route, owner, validity, restriction, and record structure.')
                }
            },
            {
                id = 'activities',
                label = 'Activities',
                screens = {
                    gridScreen('professions', 'Professions', 'Profession, level, recipe, reward, contract, and progression structure.'),
                    gridScreen('hunting', 'Hunting', 'Animal, region, condition, reward, tool, and tracking structure.'),
                    listScreen('events', 'World Activities', 'Event, location, reward, duration, requirement, and state structure.'),
                    dashboardScreen('activity_progress', 'Activity Progress', 'Milestone, challenge, completion, streak, and reward structure.')
                }
            },
            {
                id = 'medical',
                label = 'Medical',
                screens = {
                    dashboardScreen('patient', 'Patient Overview', 'Patient, condition, vitals, injury, treatment, and recovery structure.'),
                    gridScreen('treatments', 'Treatments', 'Medicine, procedure, requirement, dosage, effect, and supply structure.'),
                    listScreen('injuries', 'Injury Records', 'Body region, severity, cause, treatment, and status structure.'),
                    tableScreen('medical_records', 'Medical Records', 'Patient, diagnosis, treatment, physician, date, and access structure.')
                }
            },
            {
                id = 'records',
                label = 'Records',
                screens = {
                    tableScreen('documents', 'Document Archive', 'Document, owner, category, status, value, and access structure.'),
                    listScreen('licenses', 'Licenses & Permits', 'License, holder, issuer, validity, restriction, and renewal structure.'),
                    tableScreen('transactions', 'Transaction Ledger', 'Transaction, account, value, direction, date, and status structure.'),
                    gridScreen('evidence', 'Evidence Catalogue', 'Evidence, image, case, owner, condition, and access structure.')
                }
            },
            {
                id = 'administration',
                label = 'Administration',
                screens = {
                    dashboardScreen('staff_overview', 'Staff Overview', 'Staff status, tickets, reports, server state, and action structure.'),
                    listScreen('player_management', 'Player Management', 'Player, identifier, role, state, permission, and action structure.'),
                    tableScreen('audit_log', 'Audit Log', 'Action, actor, target, timestamp, result, and trace structure.'),
                    componentScreen('admin_tools', 'Administrative Tools', 'Reusable warning, confirmation, bulk action, and restricted-state structures.')
                }
            },
            {
                id = 'components',
                label = 'Components',
                screens = {
                    componentScreen('overlays', 'Modals & Overlays', 'Shared confirmation, warning, quantity, notification, and progress structures.'),
                    formScreen('forms', 'Forms & Inputs', 'Text, number, selection, category, validation, review, and submission structures.'),
                    componentScreen('states', 'Loading & Empty States', 'Loading, disabled, locked, unavailable, error, success, and empty states.'),
                    componentScreen('feedback', 'Feedback Components', 'Toast, status, tooltip, progress, badge, alert, and action feedback structures.')
                }
            }
        }
    }
end

RegisterNetEvent('node7-ui:client:openDemo', function(demoName)
    local startModule = demoName or 'commerce'
    if startModule == 'universal' then
        startModule = 'commerce'
    end

    TriggerEvent('node7-ui:client:open', universalPayload(startModule))
end)
