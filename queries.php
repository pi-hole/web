<?php
require "header.php";
?>

<!--
<div class="row">
    <div class="col-md-12">
        <button class="btn btn-info margin-bottom pull-right">Refresh Data</button>
    </div>
</div>
-->
<div class="row">
    <div class="col-md-12">
        <div class="box" id="recent-queries">
            <div class="box-header with-border">
                <h3 class="box-title">Recent Queries</h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="table-responsive">
                    <table id="grid-data" class="display table table-striped table-bordered">
                        <thead>
                        <tr>
                            <th data-column-id="ts" data-visible-in-selection="false">Time</th>
                            <th data-column-id="query_type" data-visible-in-selection="false">Type</th>
                            <th data-column-id="name" data-visible-in-selection="false">Domain</th>
                            <th data-column-id="source" data-visible-in-selection="false">Client</th>
                            <th data-column-id="piholed" data-visible-in-selection="false">Status</th>
                        </tr>
                        </thead>
                    </table>
                </div>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
</div>

<table id="hosts" hidden="true">
    <thead>
    <tr>
        <th>IP</th>
    </tr>
    </thead>
    <tbody>
    <?php //Read in /etc/hosts and show in this hidden table for later use
    $hosts = file_exists("/etc/hosts") ? file("/etc/hosts") : array();
    foreach ($hosts as $host){
        $x = preg_split('/\s+/', $host);
        if ($x[0] != '' && $x[0] != '#'){
            echo '<tr><td>'.$x[0].'#'.$x[1].'</td></tr>';
        }

    }
    ?>
    </tbody>
</table>


<!-- /.row -->

<?php
require "footer.php";
?>

<script language="javascript">
    //Refer to http://jquery-bootgrid.com/Documentation for methods, events and settings
    //load grid on page\e load...
    $("#grid-data").bootgrid({
        ajax:true,
        url:"server.php",
        columnSelection:false,
        rowCount: [10,25,50,100]

    }).on("loaded.rs.jquery.bootgrid", function (e) { //once table has loaded, set the colours for easy recognition of blocked queries.

        $("table tr td:nth-child(5)").each(function () {//Status column
            if ($(this).text() == '0') {
                $(this).html('OK!');
                $(this).parent().css('color', 'green');
            }
            else {
                $(this).html('Pi-holed');
                $(this).parent().css('color', 'red');
            }
        });
        //Remember the hidden table from earlier? This is where we apply the host name to the Client column!
        $("table tr td:nth-child(4)").each(function () {//Client column
            var str=$(this).text(); // Save text out to a variable
            $("#hosts").find("tr td").each(function(){//loop through hidden table rows
                var comp = $(this).text();
                var arr = comp.split('#'); //split each row on #
                if (arr[0] == str){
                    str=(arr[1] +" ("+str+")"); //if IP address matches, then we have a hostname!
                }
            });
            $(this).html(str); //set the cell's text to the new hostname(ip)
        });

    });


</script>