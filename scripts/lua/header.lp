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
starttime = mg.time(true)
hostname = pihole.hostname()
webhome = pihole.webhome()

-- Get name of script by matching whatever is after the last "/" in the URI
scriptname = mg.request_info.request_uri:match(webhome.."(.*)$")
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

-- Connection is considered secure if running natively on HTTPS
is_secure = mg.request_info.https

-- Variable to check if user is already authenticated
is_authenticated = mg.request_info.is_authenticated

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

    <meta name="csrf-token" content="<?=mg.request_info.csrf_token?>">

    <link rel="apple-touch-icon" href="<?=pihole.webhome()?>img/favicons/apple-touch-icon.png" sizes="180x180">
    <link rel="icon" href="<?=pihole.webhome()?>img/favicons/favicon-32x32.png" sizes="32x32" type="image/png">
    <link rel="icon" href="<?=pihole.webhome()?>img/favicons/favicon-16x16.png" sizes="16x16" type="image/png">
    <link rel="manifest" href="<?=pihole.webhome()?>img/favicons/manifest.json">
    <? theme = pihole.webtheme() ?>
    <link rel="mask-icon" href="<?=pihole.webhome()?>img/favicons/safari-pinned-tab.svg" color="<?=theme.color?>">
    <link rel="shortcut icon" href="<?=pihole.webhome()?>img/favicons/favicon.ico">
    <meta name="msapplication-TileColor" content="<?=theme.color?>">
    <meta name="msapplication-TileImage" content="<?=pihole.webhome()?>img/favicons/mstile-150x150.png">

    <!-- Theme styles -->
    <meta name="theme-color" content="<?=theme.color?>">

<? if theme.dark then ?>
    <style>
        html { background-color: #000; }
    </style>
<? end ?>
    <script src="<?=pihole.fileversion('vendor/nprogress/nprogress.min.js')?>"></script>
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/nprogress/nprogress.min.css')?>">

    <!-- Theme fonts -->
<? if theme.name == 'lcars' then ?>
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/fonts/ubuntu-mono/ubuntu-mono.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/fonts/antonio/antonio.css')?>">
<? else ?>
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/fonts/SourceSansPro/SourceSansPro.css')?>">
<? end ?>

    <!-- Common styles -->
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/bootstrap/css/bootstrap.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/animate/animate.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/bstreeview/bstreeview.min.css')?>">
<?
if startsWith(scriptname, 'groups') then
    -- Group management styles
?>
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/bootstrap-select/bootstrap-select.min.css')?>">
<? end ?>
<? if is_authenticated then ?>
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/datatables/datatables.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/datatables-buttons/datatables.buttons.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/datatables-select/datatables.select.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/daterangepicker/daterangepicker.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/bootstrap-toggle/bootstrap-toggle.min.css')?>">
<? end ?>
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/select2/select2.min.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/adminLTE/AdminLTE.min.css')?>">

    <!-- Theme styles -->
    <link rel="stylesheet" href="<?=pihole.fileversion('style/pi-hole.css')?>">
    <link rel="stylesheet" href="<?=pihole.fileversion('style/themes/'..theme.name..'.css')?>">

    <noscript><link rel="stylesheet" href="<?=pihole.fileversion('vendor/js-warn/js-warn.css')?>"></noscript>

    <!-- scripts -->
    <script src="<?=pihole.fileversion('vendor/jquery/jquery.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/bootstrap/js/bootstrap.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/adminLTE/adminlte.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/bootstrap-notify/bootstrap-notify.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/font-awesome/all.min.js')?>"></script>
    <script src="<?=pihole.fileversion('scripts/js/utils.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/waitMe-js/modernized-waitme-min.js')?>"></script>
    <link rel="stylesheet" href="<?=pihole.fileversion('vendor/waitMe-js/waitMe.min.css')?>">
