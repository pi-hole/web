<?php
    require "header.html";
    include "blacklist.php";
    include "whitelist.php";
?>
<!-- JS Warning -->
<div>
  <link rel="stylesheet" type="text/css" href="css/js-warn.css">
  <input type="checkbox" id="js-hide" />
  <div class="js-warn" id="js-warn-exit"><h1>Javascript Is Disabled</h1><p>Javascript seems to be disabled. This will break some site features.</p>
  <p>To enable Javascript click <a href="http://www.enable-javascript.com/" target="_blank">here</a></p><label for="js-hide">Close</label></div>
  <script>var jswarn = document.getElementById("js-warn-exit"); jswarn.parentNode.removeChild(jswarn);</script>
</div>
<!-- /JS Warning -->
<!-- Small boxes (Stat box) -->
<div class="row">
    <div class="col-md-12">
        <div class="contianer">
<?php
if(isset($_GET['l']) && $_GET['l'] == "black")
{
    display_blacklist();
}
else if(isset($_GET['l']) && $_GET['l'] == "white")
{
    display_whitelist();
}
?>
        </div>
    </div>
</div>
<!-- /.row -->

<?php
    require "footer.php";
?>
