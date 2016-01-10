<?php
require_once ('inc/nameserverHelper.inc.php');
?>

<?php
$nameservers = NameserverHelper::getCustomNameserverEntries();
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Pi-hole Admin Console - Custom Nameservers</title>
    <!-- Tell the browser to be responsive to screen width -->
    <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">

    <link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" rel="stylesheet" type="text/css" />
    <link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css" rel="stylesheet" type="text/css" />
    <link href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css" rel="stylesheet" type="text/css" />

    <link href="./css/AdminLTE.min.css" rel="stylesheet" type="text/css" />
    <link href="./css/skin-blue.min.css" rel="stylesheet" type="text/css" />
    <link href="./css/additions.css" rel="stylesheet" type="text/css" />

    <!--[if lt IE 9]>
    <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
    <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
</head>
<body class="skin-blue sidebar-mini">
<div class="wrapper">
    <header class="main-header">
        <!-- Logo -->
        <a href="http://pi-hole.net" class="logo">
            <!-- mini logo for sidebar mini 50x50 pixels -->
            <span class="logo-mini"><b>P</b>H</span>
            <!-- logo for regular state and mobile devices -->
            <span class="logo-lg"><b>Pi</b>-hole</span>
        </a>
        <!-- Header Navbar: style can be found in header.less -->
        <nav class="navbar navbar-static-top" role="navigation">
            <!-- Sidebar toggle button-->
            <a href="#" class="sidebar-toggle" data-toggle="offcanvas" role="button">
                <span class="sr-only">Toggle navigation</span>
            </a>
            <div class="navbar-custom-menu">
                <ul class="nav navbar-nav">
                    <!-- User Account: style can be found in dropdown.less -->
                    <li class="dropdown user user-menu">
                        <a href="#" class="dropdown-toggle" data-toggle="dropdown">
                            <img src="./img/pihole-160x160.jpg" class="user-image" alt="Pi-hole logo" />
                            <span class="hidden-xs">Pi-hole</span>
                        </a>
                        <ul class="dropdown-menu">
                            <!-- User image -->
                            <li class="user-header">
                                <img src="./img/pihole-160x160.jpg" alt="User Image" />
                                <p>
                                    Open Source Ad Blocker
                                    <small>Designed For Raspberry Pi</small>
                                </p>
                            </li>
                            <!-- Menu Body -->
                            <li class="user-body">
                                <div class="col-xs-4 text-center">
                                    <a href="https://github.com/jacobsalmela/pi-hole">Free</a>
                                </div>
                                <div class="col-xs-4 text-center">
                                    <a href="http://jacobsalmela.com/block-millions-ads-network-wide-with-a-raspberry-pi-hole-2-0/">Details</a>
                                </div>
                                <div class="col-xs-4 text-center">
                                    <a href="#">Updates</a>
                                </div>
                            </li>
                            <!-- Menu Footer-->
                            <li class="user-footer">
                                <div>
                                    <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
                                        <input type="hidden" name="cmd" value="_s-xclick">
                                        <input type="hidden" name="hosted_button_id" value="3J2L3Z4DHW9UY">
                                        <input style="display: block; margin: 0 auto;" type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
                                        <img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
                                    </form>
                                </div>
                                <div style="text-align:center">
                                    <a class="coinbase-button" data-code="c851bab4454421aa35bc789526207381" data-button-style="donation_small" href="https://www.coinbase.com/checkouts/c851bab4454421aa35bc789526207381">Donate Bitcoins</a><script src="https://www.coinbase.com/assets/button.js" type="text/javascript"></script>
                                </div>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </nav>
    </header>
    <!-- Left side column. contains the logo and sidebar -->
    <aside class="main-sidebar">
        <!-- sidebar: style can be found in sidebar.less -->
        <section class="sidebar">
            <!-- Sidebar user panel -->
            <div class="user-panel">
                <div class="pull-left image">
                    <img src="./img/pihole-160x160.jpg" class="img-circle" alt="Pi-hole logo" />
                </div>
                <div class="pull-left info">
                    <p>Status</p>
                    <a href="#"><i class="fa fa-circle text-success"></i> Nominal</a>
                </div>
            </div>
            <!-- sidebar menu: : style can be found in sidebar.less -->
            <ul class="sidebar-menu">
                <li class="header">MAIN NAVIGATION</li>
                <li>
                    <a href="./">
                        <i class="fa fa-tachometer pull-left"></i> <span>Dashboard</span>
                    </a>
                </li>
                <li class="active">
                    <a href="./customNameserver.php">
                        <i class="fa fa-server pull-left"></i> <span>Custom Nameservers</span>
                    </a>
                </li>
                <li>
                    <a href="./whitelist.php">
                        <i class="fa fa-check-square pull-left"></i> <span>Whitelist</span>
                    </a>
                </li>
                <li>
                    <a href="./blacklist.php">
                        <i class="fa fa-ban pull-left"></i> <span>Blacklist</span>
                    </a>
                </li>
                <li>
                    <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=3J2L3Z4DHW9UY">
                        <i class="fa fa-paypal pull-left"></i> <span>Donate</span>
                    </a>
                </li>
            </ul>
        </section>
        <!-- /.sidebar -->
    </aside>
    <!-- Content Wrapper. Contains page content -->
    <div class="content-wrapper">
        <!-- Main content -->
        <section class="content">
            <!-- Small boxes (Stat box) -->
            <div class="row">
                <div class="col-xs-12">
                    <div class="box">
                        <div class="box-header">
                            <h3 class="box-title">Custom Nameservers</h3>
                            <div class="box-tools">
                                <button class="btn btn-sm btn-success" data-toggle="modal" data-target="#addCustomNameserverModal">Add A Custom Nameserver</button>
                            </div>
                        </div>
                        <!-- /.box-header -->
                        <div class="box-body table-responsive no-padding">
                            <table class="table table-hover" id="customNameservers">
                                <tbody>
                                <?php foreach ( $nameservers as $nameserver ) : ?>
                                <tr data-nameserverID="<?php echo $nameserver['id'] ?>">
                                    <td><input type="text" class="form-control nameserverDomain" value="<?php echo $nameserver['domain'] ?>"></td>
                                    <td><input type="text" class="form-control nameserverIP" value="<?php echo $nameserver['ip'] ?>"></td>
                                    <td>
                                        <button data-action="remove" class="btn btn-sm btn-danger">Remove</button>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                        <!-- /.box-body -->
                    </div>
                    <!-- /.box -->
                </div>
            </div>
            <!-- /.row -->
        </section>
        <!-- /.content -->
    </div>
    <!-- /.content-wrapper -->
    <footer class="main-footer">
        <div class="pull-right hidden-xs">
            <b>Pi-hole Version</b> 2.1
        </div>
        <i class="fa fa-github"></i> <strong><a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&amp;hosted_button_id=3J2L3Z4DHW9UY">Donate</a></strong> if you found this useful.
    </footer>
</div>

<div class="modal fade" id="addCustomNameserverModal" tabindex="-1" role="dialog" aria-labelledby="addCustomNameserverModalLabel">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="addCustomNameserverModalLabel">Add A Custom Nameserver</h4>
            </div>
            <div class="modal-body">
                <form id="addNameServerForm">
                    <input type="hidden" name="addCustomNameserver" value="true">
                <div class="form-group">
                    <label for="customNameServerDomain">Domain</label>
                    <input type="text" class="form-control" id="customNameServerDomain" name="customNameServerDomain" placeholder="google.com">
                </div>
                <div class="form-group">
                    <label for="customNameServerIP">IP-Address</label>
                    <input type="text" class="form-control" id="customNameServerIP" name="customNameServerIP" placeholder="8.8.8.8">
                </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-success" id="addNameServerSubmit">Add Nameserver</button>
            </div>
        </div>
    </div>
</div>

<!-- ./wrapper -->
<script src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" type="text/javascript"></script>
<script src="./js/app.min.js" type="text/javascript"></script>
<script src="./js/main.js"></script>
</body>
</html>
