--[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
]]--

available_themes = {}

available_themes['default-light'] = {
    name = 'Pi-hole default theme (light, default)',
    dark = false,
    color = '#367fa9'
}
available_themes['default-dark'] = {
    name = 'Pi-hole midnight theme (dark)',
    dark = true,
    color = '#272c30'
}

available_themes['default-darker'] = {
    name = 'Pi-hole deep-midnight theme (dark)',
    dark = true,
    color = '#2e6786'
}

available_themes['high-contrast'] = {
    name = 'High contrast light',
    dark = false,
    color = '#0078a0'
}

available_themes['high-contrast-dark'] = {
    name = 'High contrast dark',
    dark = true,
    color = '#0077c7'
}

-- Option to have the theme go with the device dark mode setting, always set the
-- background to black to avoid flashing
available_themes['default-auto'] = {
    name = 'Pi-hole auto theme (light/dark)',
    dark = true,
    color = '#367fa9'
}

available_themes['lcars'] = {
    name = 'Star Trek LCARS theme (dark)',
    dark = true,
    color = '#4488FF'
}

-- Get properties of currently selected theme by asking FTL what the currently
-- enabled theme is
theme = available_themes[pihole.webtheme()]
