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
                 data-ajax="true" data-url="server.php"
          ">
          <thead>
          <tr>
            <th data-column-id="ts">Time</th>
            <th data-column-id="query_type">Type</th>
            <th data-column-id="name">Domain</th>
            <th data-column-id="source">Client</th>
            <th data-column-id="domain">Status</th>
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

    }).on("load.rs.jquery.bootgrid", function (e) {
    /* your code goes here */
  });


</script>