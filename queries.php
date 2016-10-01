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
          <table id="grid-data" class="display table table-striped table-bordered" data-toggle="bootgrid"
                 data-ajax="true" data-url="server.php" data-columnSelection="false"
          ">
          <thead>
          <tr>
            <th data-column-id="ts" data-visible-in-selection="false">Time</th>
            <th data-column-id="query_type" data-visible-in-selection="false">Type</th>
            <th data-column-id="name" data-visible-in-selection="false">Domain</th>
            <th data-column-id="source" data-visible-in-selection="false">Client</th>
            <th data-column-id="domain" data-visible-in-selection="false">Status</th>
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


<!-- /.row -->

<?php
require "footer.php";
?>

<script language="javascript">
  //Refer to http://jquery-bootgrid.com/Documentation for methods, events and settings
  //load gird on page\e load...
  $("#grid-data").bootgrid(
    {
      caseSensitive: false /* make search case insensitive */

    }).on("loaded.rs.jquery.bootgrid", function (e) { //once table has loaded, set the colours for easy recognition of blocked queries.
      console.log("Loaded!");

    $("table tr td:nth-child(5)").each(function () {
      console.log($(this).text());
      if ($(this).text() == '\u00a0') { //Unicode for space or &nbsp;
        $(this).html('OK!');
        $(this).parent().css('color','green');
      }
      else{
        $(this).html('Pi-holed');
        $(this).parent().css('color','red');
      }

    });

  });



</script>