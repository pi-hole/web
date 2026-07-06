<!doctype html>
<!--
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
-->
<?
starttime = mg.time(true)
hostname = pihole.hostname()
webhome = pihole.webhome()
theme = pihole.webtheme()

-- Get name of script by matching whatever is after the last "/" in the URI
scriptname = mg.script_name:match(".*/(.*).lp$"):gsub("-", "/")

-- Fall back to "index.lp" if no match is found (e.g. when accessing the root)
if scriptname == nil or string.len(scriptname) == 0 then scriptname = "index.lp" end

-- Boolean check if string starts with a given prefix
function startsWith(text, prefix)
    return text:find(prefix, 1, true) == 1
end

-- Function returning GET parameter value (or nil if not set)
function GET(name)
    if not mg.request_info.query_string then
        return nil
    end

    return mg.request_info.query_string:match(name.."=([^&]*)")
    -- mg.get_var(mg.request_info.query_string, "REQUEST_URI")
end

-- Function checking if val is in tab
function in_array (val, tab)
    for index, value in ipairs(tab) do
        if value == val then
            return true
        end
    end

    return false
end

-- Function to sanitize hostname containing invalid HTML characters
function sanitize_hostname(str)
    return str:gsub("[&<>\"']", {
        ["&"] = "&amp;",
        ["<"] = "&lt;",
        [">"] = "&gt;",
        ['"'] = "&quot;",
        ["'"] = "&#039;"
    })
end

-- Sanitize hostname
hostname = sanitize_hostname(hostname)

-- Variable to check if user is already authenticated
is_authenticated = mg.request_info.is_authenticated

local bs_theme = theme.dark and 'dark' or 'light'
if theme.name == 'default-auto' then
    bs_theme = 'auto'
elseif theme.name == 'default-light' then
    bs_theme = 'light'
elseif theme.name == 'default-dark' or theme.name == 'lcars' then
    bs_theme = 'dark'
end
?>
<html lang="en" data-bs-theme="<?=bs_theme?>">
<head>
    <script src="<?=pihole.fileversion('scripts/js/theme.js')?>"></script>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pi-hole <?=hostname?></title>
    <meta name="csrf-token" content="<?=mg.request_info.csrf_token?>">

    <link rel="apple-touch-icon" href="<?=webhome?>img/favicons/apple-touch-icon.png" sizes="180x180">
    <link rel="icon" href="<?=webhome?>img/favicons/favicon-32x32.png" sizes="32x32" type="image/png">
    <link rel="icon" href="<?=webhome?>img/favicons/favicon-16x16.png" sizes="16x16" type="image/png">
    <link rel="manifest" href="<?=webhome?>img/favicons/manifest.json">
    <link rel="mask-icon" href="<?=webhome?>img/favicons/safari-pinned-tab.svg" color="<?=theme.color?>">
    <link rel="shortcut icon" href="<?=webhome?>img/favicons/favicon.ico">
    <meta name="msapplication-TileColor" content="<?=theme.color?>">
    <meta name="msapplication-TileImage" content="<?=webhome?>img/favicons/mstile-150x150.png">
    <meta name="theme-color" content="<?=theme.color?>">

    <!-- Theme fonts -->
<? if theme.name == 'lcars' then ?>
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/fonts/ubuntu-mono/ubuntu-mono.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/fonts/antonio/antonio.css')?>">
<? else ?>
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/fonts/source-sans-pro/source-sans-pro.css')?>">
<? end ?>

<? if bs_theme == 'dark' then ?>
    <style>
        html { background-color: #000; }
    </style>
<? elseif bs_theme == 'auto' then ?>
    <!-- The "auto" theme's actual light/dark resolution only happens once
    theme.js runs and the CSS finishes loading, so use a media query
    here (evaluated immediately, no JS/network wait) to avoid a flash
    of white background on every navigation when the OS prefers dark. -->
    <style>
        @media (prefers-color-scheme: dark) {
            html { background-color: #000; }
        }
    </style>
<? end ?>

    <!-- Common styles -->
    <!-- AdminLTE.min.css already bundles Bootstrap 5, so no separate Bootstrap CSS is needed -->
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/adminLTE/adminlte.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/animate/animate.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/font-awesome/css/all.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/nprogress/nprogress.min.css')?>">

<? if is_authenticated then ?>
    <? if startsWith(scriptname, 'groups') then ?>
        <link rel="stylesheet" href="<?=pihole.fileversion('vendor/tom-select/tom-select.bootstrap5.min.css')?>">
    <? end ?>
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/bstreeview/bstreeview.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/datatables/dataTables.bootstrap5.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/datatables-buttons/buttons.bootstrap5.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/datatables-select/select.bootstrap5.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/daterangepicker/daterangepicker.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/bootstrap5-toggle/bootstrap5-toggle.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/waitMe-js/waitMe.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/select2/select2.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/select2/select2-bootstrap-5-theme.min.css')?>">
<? end ?>

    <!-- Theme styles (<?= theme.name ?>) -->
    <link rel="stylesheet" href="<?=pihole.fileversion('style/pi-hole.css')?>">
<? if theme.name == "default-auto" then ?>
    <link rel="stylesheet" href="<?=pihole.fileversion('style/themes/default-dark.css')?>" media="(prefers-color-scheme: dark)">
    <link rel="stylesheet" href="<?=pihole.fileversion('style/themes/default-light.css')?>" media="not (prefers-color-scheme: dark)">
<? else ?>
    <link rel="stylesheet" href="<?=pihole.fileversion('style/themes/' ..theme.name.. '.css')?>">
<? end ?>

    <noscript><link rel="stylesheet" href="<?=pihole.fileversion('vendor/js-warn/js-warn.css')?>"></noscript>

    <!-- scripts -->
    <script src="<?=pihole.fileversion('vendor/jquery/jquery.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/bootstrap/js/bootstrap.bundle.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/adminLTE/adminlte.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/nprogress/nprogress.min.js')?>"></script>
    <script src="<?=pihole.fileversion('scripts/js/utils.js')?>"></script>
