<?php
$scriptname = basename($_SERVER['SCRIPT_FILENAME']);
$hostname = gethostname() ? gethostname() : '';
?>
<!DOCTYPE html>
<!--
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
-->
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!-- Usually browsers proactively perform domain name resolution on links that the user may choose to follow. We disable DNS prefetching here -->
    <meta http-equiv="x-dns-prefetch-control" content="off">
    <meta http-equiv="cache-control" content="max-age=60,private">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>Pi-hole<?php echo $hostname ? ' - '.$hostname : ''; ?></title>

    <link rel="apple-touch-icon" href="img/favicons/apple-touch-icon.png" sizes="180x180">
    <link rel="icon" href="img/favicons/favicon-32x32.png" sizes="32x32" type="image/png">
    <link rel="icon" href="img/favicons/favicon-16x16.png" sizes="16x16" type="image/png">
    <link rel="manifest" href="img/favicons/manifest.json">
    <link rel="mask-icon" href="img/favicons/safari-pinned-tab.svg" color="<?php echo $theme_color; ?>">
    <link rel="shortcut icon" href="img/favicons/favicon.ico">
    <meta name="msapplication-TileColor" content="<?php echo $theme_color; ?>">
    <meta name="msapplication-TileImage" content="img/favicons/mstile-150x150.png">

    <!-- Theme styles -->
    <meta name="theme-color" content="<?php echo $theme_color; ?>">

<?php if ($darkmode) { ?>
    <style>
        html { background-color: #000; }
    </style>
<?php } ?>

    <!-- Theme fonts -->
<?php if ($theme == 'lcars') { ?>
    <link rel="stylesheet" href="<?php echo fileversion('style/vendor/fonts/ubuntu-mono/ubuntu-mono.css'); ?>">
    <link rel="stylesheet" href="<?php echo fileversion('style/vendor/fonts/antonio/antonio.css'); ?>">
<?php } else { ?>
    <link rel="stylesheet" href="<?php echo fileversion('style/vendor/SourceSansPro/SourceSansPro.css'); ?>">
<?php } ?>

    <!-- Common styles -->
    <link rel="stylesheet" href="<?php echo fileversion('style/vendor/bootstrap/css/bootstrap.min.css'); ?>">
<?php if ($auth) { ?>
    <link rel="stylesheet" href="<?php echo fileversion('style/vendor/datatables.min.css'); ?>">
    <link rel="stylesheet" href="<?php echo fileversion('style/vendor/datatables_extensions.min.css'); ?>">
    <link rel="stylesheet" href="<?php echo fileversion('style/vendor/daterangepicker.min.css'); ?>">
<?php } ?>
    <link rel="stylesheet" href="<?php echo fileversion('style/vendor/AdminLTE.min.css'); ?>">
    <link rel="stylesheet" href="<?php echo fileversion('style/vendor/select2.min.css'); ?>">

<?php if (in_array($scriptname, array('groups.php', 'groups-adlists.php', 'groups-clients.php', 'groups-domains.php'))) { ?>
    <!-- Group management styles -->
    <link rel="stylesheet" href="<?php echo fileversion('style/vendor/animate.min.css'); ?>">
    <link rel="stylesheet" href="<?php echo fileversion('style/vendor/bootstrap-select.min.css'); ?>">
    <link rel="stylesheet" href="<?php echo fileversion('style/vendor/bootstrap-toggle.min.css'); ?>">
<?php } ?>

    <!-- Theme styles -->
    <link rel="stylesheet" href="<?php echo fileversion('style/pi-hole.css'); ?>">
    <link rel="stylesheet" href="<?php echo fileversion('style/themes/'.$theme.'.css'); ?>">

    <noscript><link rel="stylesheet" href="<?php echo fileversion('style/vendor/js-warn.css'); ?>"></noscript>

    <!-- scripts -->
    <script src="<?php echo fileversion('scripts/vendor/jquery.min.js'); ?>"></script>
    <script src="<?php echo fileversion('style/vendor/bootstrap/js/bootstrap.min.js'); ?>"></script>
    <script src="<?php echo fileversion('scripts/vendor/adminlte.min.js'); ?>"></script>
    <script src="<?php echo fileversion('scripts/vendor/bootstrap-notify.min.js'); ?>"></script>
<?php if ($auth) { ?>
    <script src="<?php echo fileversion('scripts/vendor/select2.min.js'); ?>"></script>
    <script src="<?php echo fileversion('scripts/vendor/datatables.min.js'); ?>"></script>
    <script src="<?php echo fileversion('scripts/vendor/datatables.select.min.js'); ?>"></script>
    <script src="<?php echo fileversion('scripts/vendor/datatables.buttons.min.js'); ?>"></script>
    <script src="<?php echo fileversion('scripts/vendor/moment.min.js'); ?>"></script>
    <script src="<?php echo fileversion('scripts/vendor/chart.min.js'); ?>"></script>
    <script src="<?php echo fileversion('scripts/vendor/chartjs-adapter-moment.js'); ?>"></script>
<?php } ?>
    <script src="<?php echo fileversion('style/vendor/font-awesome/js/all.min.js'); ?>"></script>
    <script src="<?php echo fileversion('scripts/pi-hole/js/utils.js'); ?>"></script>
</head>
