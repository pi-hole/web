<?php
$scriptname = basename($_SERVER['SCRIPT_FILENAME']);
$hostname = gethostname() ? gethostname() : '';

// Create cache busting version
$cacheVer = filemtime(__FILE__);
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
    <link rel="mask-icon" href="img/favicons/safari-pinned-tab.svg" color="#367fa9">
    <link rel="shortcut icon" href="img/favicons/favicon.ico">
    <meta name="msapplication-TileColor" content="#367fa9">
    <meta name="msapplication-TileImage" content="img/favicons/mstile-150x150.png">

    <!-- Theme styles -->
<?php if ($theme == 'default-light') { ?>
    <meta name="theme-color" content="#367fa9">
<?php } elseif ($theme == 'default-dark') { ?>
    <meta name="theme-color" content="#272c30">
<?php } elseif ($theme == 'default-darker') { ?>
    <meta name="theme-color" content="#2e6786">
<?php } elseif ($theme == 'lcars') { ?>
    <meta name="theme-color" content="#4488FF">
<?php } ?>

<?php if ($darkmode) { ?>
    <style>
        html { background-color: #000; }
    </style>
<?php } ?>

    <!-- Theme fonts -->
<?php if ($theme == 'lcars') { ?>
    <link rel="stylesheet" href="style/vendor/fonts/ubuntu-mono/ubuntu-mono.css?v=<?php echo $cacheVer; ?>">
    <link rel="stylesheet" href="style/vendor/fonts/antonio/antonio.css?v=<?php echo $cacheVer; ?>">
<?php } else { ?>
    <link rel="stylesheet" href="style/vendor/SourceSansPro/SourceSansPro.css?v=<?php echo $cacheVer; ?>">
<?php } ?>

    <!-- Common styles -->
    <link rel="stylesheet" href="style/vendor/bootstrap/css/bootstrap.min.css?v=<?php echo $cacheVer; ?>">
<?php if ($auth) { ?>
    <link rel="stylesheet" href="style/vendor/datatables.min.css?v=<?php echo $cacheVer; ?>">
    <link rel="stylesheet" href="style/vendor/datatables_extensions.min.css?v=<?php echo $cacheVer; ?>">
    <link rel="stylesheet" href="style/vendor/daterangepicker.min.css?v=<?php echo $cacheVer; ?>">
<?php } ?>
    <link rel="stylesheet" href="style/vendor/AdminLTE.min.css?v=<?php echo $cacheVer; ?>">
    <link rel="stylesheet" href="style/vendor/select2.min.css?v=<?php echo $cacheVer; ?>">

<?php if (in_array($scriptname, array('groups.php', 'groups-adlists.php', 'groups-clients.php', 'groups-domains.php'))) { ?>
    <!-- Group management styles -->
    <link rel="stylesheet" href="style/vendor/animate.min.css?v=<?php echo $cacheVer; ?>">
    <link rel="stylesheet" href="style/vendor/bootstrap-select.min.css?v=<?php echo $cacheVer; ?>">
    <link rel="stylesheet" href="style/vendor/bootstrap-toggle.min.css?v=<?php echo $cacheVer; ?>">
<?php } ?>

    <!-- Theme styles -->
    <link rel="stylesheet" href="style/pi-hole.css?v=<?php echo $cacheVer; ?>">
    <link rel="stylesheet" href="style/themes/<?php echo $theme; ?>.css?v=<?php echo $cacheVer; ?>">

    <noscript><link rel="stylesheet" href="style/vendor/js-warn.css?v=<?php echo $cacheVer; ?>"></noscript>

    <!-- scripts -->
    <script src="scripts/vendor/jquery.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="style/vendor/bootstrap/js/bootstrap.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="scripts/vendor/adminlte.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="scripts/vendor/bootstrap-notify.min.js?v=<?php echo $cacheVer; ?>"></script>
<?php if ($auth) { ?>
    <script src="scripts/vendor/select2.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="scripts/vendor/datatables.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="scripts/vendor/datatables.select.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="scripts/vendor/datatables.buttons.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="scripts/vendor/moment.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="scripts/vendor/Chart.min.js?v=<?php echo $cacheVer; ?>"></script>
<?php } ?>
    <script src="style/vendor/font-awesome/js/all.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="scripts/pi-hole/js/utils.js?v=<?php echo $cacheVer; ?>"></script>
</head>
