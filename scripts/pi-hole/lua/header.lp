<!DOCTYPE html>
<!--
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
-->
<?
hostname = pihole.hostname()
-- Get name of script by matching whatever is after the last "/" in the URI
scriptname = mg.request_info.request_uri:match("/([^/]*)$")
-- Fall back to "index.lp" if no match is found (e.g. when accessing the root)
if scriptname == nil or string.len(scriptname) == 0 then scriptname = "index.lp" end

-- Boolean check if string starts with a given prefix
function startsWith(text, prefix)
    return text:find(prefix, 1, true) == 1
end

-- Function returning GET parameter value (or nil if not set)
function GET(name)
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

?>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!-- Usually browsers proactively perform domain name resolution on links that the user may choose to follow. We disable DNS prefetching here -->
    <meta http-equiv="x-dns-prefetch-control" content="off">
    <meta http-equiv="cache-control" content="max-age=60,private">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>Pi-hole <?=hostname?></title>

    <link rel="apple-touch-icon" href="img/favicons/apple-touch-icon.png" sizes="180x180">
    <link rel="icon" href="img/favicons/favicon-32x32.png" sizes="32x32" type="image/png">
    <link rel="icon" href="img/favicons/favicon-16x16.png" sizes="16x16" type="image/png">
    <link rel="manifest" href="img/favicons/manifest.json">
    <? pihole.include('scripts/pi-hole/lua/theme.lua') ?>
    <link rel="mask-icon" href="img/favicons/safari-pinned-tab.svg" color="<?=theme.color?>">
    <link rel="shortcut icon" href="img/favicons/favicon.ico">
    <meta name="msapplication-TileColor" content="<?=theme.color?>">
    <meta name="msapplication-TileImage" content="img/favicons/mstile-150x150.png">

    <!-- Theme styles -->
    <meta name="theme-color" content="<?=theme.color?>">

<? if theme.dark then ?>
    <style>
        html { background-color: #000; }
    </style>
<? end ?>

    <!-- Theme fonts -->
<? if theme == 'lcars' then ?>
    <link rel="stylesheet" href="<?=pihole.fileversion('style/vendor/fonts/ubuntu-mono/ubuntu-mono.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('style/vendor/fonts/antonio/antonio.css')?>">
<? else ?>
    <link rel="stylesheet" href="<?=pihole.fileversion('style/vendor/SourceSansPro/SourceSansPro.css')?>">
<? end ?>

    <!-- Common styles -->
    <link rel="stylesheet" href="<?=pihole.fileversion('style/vendor/bootstrap/css/bootstrap.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('style/vendor/AdminLTE.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('style/vendor/select2.min.css')?>">

    <? if startsWith(scriptname, 'groups') then ?>
    <!-- Group management styles -->
    <link rel="stylesheet" href="<?=pihole.fileversion('style/vendor/animate.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('style/vendor/bootstrap-select.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('style/vendor/bootstrap-toggle.min.css')?>">
    <? end ?>

    <!-- Theme styles -->
    <link rel="stylesheet" href="<?=pihole.fileversion('style/pi-hole.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('style/themes/'..pihole.webtheme()..'.css')?>">

    <noscript><link rel="stylesheet" href="<?=pihole.fileversion('style/vendor/js-warn.css')?>"></noscript>

    <!-- scripts -->
    <script src="<?=pihole.fileversion('scripts/vendor/jquery.min.js')?>"></script>
    <script src="<?=pihole.fileversion('style/vendor/bootstrap/js/bootstrap.min.js')?>"></script>
    <script src="<?=pihole.fileversion('scripts/vendor/adminlte.min.js')?>"></script>
    <script src="<?=pihole.fileversion('scripts/vendor/bootstrap-notify.min.js')?>"></script>
    <script src="<?=pihole.fileversion('style/vendor/font-awesome/js/all.min.js')?>"></script>
    <script src="<?=pihole.fileversion('scripts/pi-hole/js/utils.js')?>"></script>
</head>
