<html><body>
<?php
require "auth.php";
require "password.php";
check_cors();

if($auth)
{
  if(strlen($pwhash) > 0)
  {
    require_once("../../vendor/qrcode.php");
    $qr = QRCode::getMinimumQRCode($pwhash, QR_ERROR_CORRECT_LEVEL_Q);
    $qr->printHTML("10px");
    print("Raw API Token: ");
    print($pwhash); 

  }
  else
  {
  ?><p>No password set<?php
  }
}
else
{
?><p>Not authorized!</p><?php
}
?>
</body>
</html>
