<?php /*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license. */
    require "scripts/pi-hole/php/header.php";
?>
<!-- Send list type to JS -->
<!-- <div id="list-type" hidden><?php echo $list ?></div> -->
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <title></title>
  <meta name="description" content="">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="style/vendor/bootstrap/css/bootstrap.min.css" />
</head>
<style>
.check-list {
  margin: 0;
  padding-left: 1.2rem;
}

.check-list li {
  position: relative;
  list-style-type: none;
  padding-left: 2.5rem;
  margin-bottom: 0.5rem;
}

.check-list li:before {
    content: '';
    display: block;
    position: absolute;
    left: 0;
    width: 5px;
    height: 13px;
    border-width: 0 2px 2px 0;
    border-style: solid;
    border-color: #00a8a8;
    transform-origin: bottom left;
    transform: rotate(45deg);
}

/* Boilerplate stuff */
*,
*:before,
*:after {
  box-sizing: border-box;
}

.heading {
  color: #324047
}

.container{
    margin: 0 auto;
    height:100%;
}
.content{
  display: flex;
}
.about-img{
  height: 120px; 
  float: right;
}
.col-6.image {
    width: 100%;
}
.col-6.text {
    width: 100%;
}
</style>

<body>
  <div class="container">
    <div class="row content">
      <div class="col-6 text">
        <h1 class="heading">Network Secured</h1>
        <p class="heading">We are constantly monitoring your Cyber Threats</p>
        <div class="section">
          <ul class="check-list">
            <li class="heading">501 Threats Blocked</li>
            <li class="heading">102 Identity Breach detected</li>
            <li class="heading">14 Devices Online</li>
          </ul>
        </div>
      </div>

      <div class="col-6 image">
        <img src="img/shield.png" class="about-img mx-auto d-block ">
      </div>

    </div>
  </div>

</body>

</html>
















<!-- Alerts -->
<div id="alInfo" class="alert alert-info alert-dismissible fade in" role="alert" hidden="true">
    <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    Adding to the <?php getFullName(); ?>...
</div>
<div id="alSuccess" class="alert alert-success alert-dismissible fade in" role="alert" hidden="true">
    <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    Success! The list will refresh.
</div>
<div id="alFailure" class="alert alert-danger alert-dismissible fade in" role="alert" hidden="true">
    <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    Failure! Something went wrong, see output below:<br/><br/><pre><span id="err"></span></pre>
</div>
<div id="alWarning" class="alert alert-warning alert-dismissible fade in" role="alert" hidden="true">
    <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    At least one domain was already present, see output below:<br/><br/><pre><span id="warn"></span></pre>
</div>



<!-- Domain List -->
<!-- <?php if($list === "black") { ?>
<h3>Exact blocking</h3>
<?php } ?>
<ul class="list-group" id="list"></ul>
<?php if($list === "black") { ?>
<h3><a href="https://docs.pi-hole.net/ftldns/regex/overview/" target="_blank" title="Click for Pi-hole Regex documentation">Regex</a> &amp; Wildcard blocking</h3>
<ul class="list-group" id="list-regex"></ul>
<?php } ?>

<script src="scripts/pi-hole/js/list.js"></script> -->

<?php
require "scripts/pi-hole/php/footer.php";
?>
