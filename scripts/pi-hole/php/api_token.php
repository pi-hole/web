<html><body>
<?php
require "auth.php";
require "password.php";
check_cors();

if($auth && (strlen($pwhash) > 0))
{
  require_once("../../vendor/qrcode.php");
  $qr = QRCode::getMinimumQRCode("WEBPASSWORD=$pwhash", QR_ERROR_CORRECT_LEVEL_Q);
  $qr->printHTML("10px");
}
?>
</body>
</html>
